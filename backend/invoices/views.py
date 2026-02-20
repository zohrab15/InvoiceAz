from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Invoice, Expense
from .serializers import InvoiceSerializer, ExpenseSerializer
from users.models import Business
from users.mixins import BusinessContextMixin
from users.plan_limits import check_invoice_limit, check_expense_limit
from django.http import HttpResponse
from django.template.loader import render_to_string
import io

class ExpenseViewSet(BusinessContextMixin, viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        business = self.get_active_business()
        if not business:
            raise PermissionDenied("Active business required")
            
        limit_check = check_expense_limit(self.request.user, business)
        if not limit_check['allowed']:
            raise PermissionDenied({
                "code": "plan_limit", 
                "detail": "Aylıq xərc limitiniz dolub.",
                "limit": limit_check['limit'],
                "current": limit_check['current'],
                "upgrade_required": True
            })
            
        serializer.save(business=business)

class PaymentViewSet(BusinessContextMixin, viewsets.ModelViewSet):
    from .models import Payment
    from .serializers import PaymentSerializer
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        business = self.get_active_business()
        if business:
            return self.queryset.filter(invoice__business=business)
        return self.queryset.none()

    def perform_create(self, serializer):
        business = self.get_active_business()
        if not business:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Əməliyyat üçün Biznes Profili seçilməyib."})
        
        # The mixin's perform_create tries to save(business=business)
        # but Payment model doesn't have a business field (it's in Invoice).
        serializer.save()

class InvoiceViewSet(BusinessContextMixin, viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # We override mixin's get_queryset to add select_related/prefetch_related
        # But we still use get_active_business helper
        business = self.get_active_business()
        if business:
            return Invoice.objects.filter(
                business=business
            ).select_related('client', 'business').prefetch_related('items', 'payments')
        return Invoice.objects.none()

    def perform_create(self, serializer):
        business = self.get_active_business()
        if not business:
            raise PermissionDenied("Active business required")
            
        limit_check = check_invoice_limit(self.request.user, business)
        if not limit_check['allowed']:
            raise PermissionDenied({
                "code": "plan_limit", 
                "detail": "Aylıq faktura limitiniz dolub.",
                "limit": limit_check['limit'],
                "current": limit_check['current'],
                "upgrade_required": True
            })
            
        serializer.save(business=business)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        invoice = self.get_object()
        items = invoice.items.all()
        
        # Clone invoice
        invoice.pk = None
        invoice.invoice_number = None # Let model's save() generate a new number
        import uuid
        invoice.share_token = uuid.uuid4()
        invoice.status = 'draft'
        invoice.save()
        
        # Clone items
        for item in items:
            item.pk = None
            item.invoice = invoice
            item.save()
        
        invoice.calculate_totals()
            
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    def _generate_pdf(self, invoice):
        invoice.calculate_totals()
        
        import qrcode
        import tempfile
        import os
        from django.conf import settings
        
        # Generate QR code for payment
        qr_code_path = None
        try:
            pay_url = f"https://invoiceaz.vercel.app/public/pay/{invoice.share_token}"
            qr = qrcode.QRCode(version=1, box_size=15, border=4)
            qr.add_data(pay_url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            temp_qr = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
            img.save(temp_qr.name)
            qr_code_path = temp_qr.name
        except Exception as e:
            print(f"QR Code generation error: {e}")

        # Prepare font paths for template
        static_dir = str(settings.BASE_DIR / "static")
        fonts_dir = os.path.join(static_dir, "fonts")
        
        # Read and encode fonts to base64 to avoid path issues
        import base64
        
        def get_font_base64(font_name):
            font_path = os.path.join(fonts_dir, font_name)
            try:
                with open(font_path, "rb") as f:
                    return base64.b64encode(f.read()).decode('utf-8')
            except Exception as e:
                print(f"Error reading font {font_name}: {e}")
                return ""

        arial_font_base64 = get_font_base64("arial.ttf")
        arial_bold_font_base64 = get_font_base64("arialbd.ttf")

        context = {
            'invoice': invoice,
            'business': invoice.business,
            'client': invoice.client,
            'items': invoice.items.all(),
            'qr_code_path': qr_code_path,
            'theme': invoice.invoice_theme or 'modern',
            'arial_font_base64': arial_font_base64,
            'arial_bold_font_base64': arial_bold_font_base64,
        }
        
        html_string = render_to_string('invoices/invoice_pdf.html', context)
        
        # Font registration
        # Font registration with reportlab is NOT needed for xhtml2pdf when using @font-face in CSS
        # We perform it only if strictly necessary for other reportlab features, but for xhtml2pdf
        # the CSS @font-face with base64 should be sufficient.
        # However, to be safe and avoid "Can't open file" errors from reportlab trying to load
        # fonts from temp paths if xhtml2pdf falls back, we skip explicit file registration here
        # and rely 100% on the HTML/CSS embedding.

        def link_callback(uri, rel):
            import os
            import requests
            import tempfile
            from django.conf import settings
            import pathlib

            # print(f"DEBUG: link_callback called for uri: {uri}")

            if not uri: return uri
            
            # Normalize and strip to avoid path issues
            uri_clean = uri.strip().replace('\\', '/')
            
            path = None
            
            # 1. Handle absolute local paths (Windows specific check)
            # If it looks like a drive path (C:/...) trust it if it exists
            if ':' in uri_clean and os.path.isfile(uri_clean):
                 path = uri_clean
            elif os.path.isabs(uri_clean) and os.path.isfile(uri_clean):
                path = uri_clean

            # 2. Handle HTTP/HTTPS URLs
            elif uri_clean.startswith('http://') or uri_clean.startswith('https://'):
                try:
                    response = requests.get(uri_clean, timeout=5)
                    if response.status_code == 200:
                        temp_img = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
                        temp_img.write(response.content)
                        temp_img.close()
                        path = temp_img.name
                except Exception as e:
                    print(f"Error downloading image {uri_clean}: {e}")

            # 3. Handle local URL paths
            elif uri_clean.startswith('/static/'):
                rel_path = uri_clean[len('/static/'):]
                path = os.path.join(settings.STATIC_ROOT, rel_path)
                if not os.path.isfile(path):
                    path = os.path.join(str(settings.BASE_DIR), "static", rel_path)
            
            elif uri_clean.startswith('/media/'):
                rel_path = uri_clean[len('/media/'):]
                path = os.path.join(settings.MEDIA_ROOT, rel_path)
                if not os.path.isfile(path):
                    path = os.path.join(str(settings.BASE_DIR), "media", rel_path)
            
            else:
                # 4. Fallback for relative paths
                path = os.path.join(str(settings.BASE_DIR), "static", uri_clean)
                if not os.path.isfile(path):
                    path = os.path.join(str(settings.BASE_DIR), "media", uri_clean)

            if path and os.path.isfile(path):
                # For Windows, sometimes file:/// protocol is safer for xhtml2pdf
                # but returning absolute path usually works if it's not treated as URL
                res = os.path.abspath(path)
                # print(f"DEBUG: PDF Link - {uri} -> {res}")
                return res
            
            # print(f"DEBUG: PDF Link FAILED - {uri} -> Resolved to: {path}")
            return uri

        try:
            from xhtml2pdf import pisa
            result = io.BytesIO()
            pisa_status = pisa.pisaDocument(
                io.BytesIO(html_string.encode("UTF-8")), 
                result, 
                encoding='UTF-8',
                link_callback=link_callback
            )
            
            # No need to clean up QR code file if using base64
            
            if pisa_status.err:
                print(f"PISA ERROR: {pisa_status.err}")
            return result.getvalue() if not pisa_status.err else None
        except Exception as e:
            print(f"PDF generation error: {e}")
            return None

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        invoice = self.get_object()
        pdf_content = self._generate_pdf(invoice)
        
        if pdf_content:
            response = HttpResponse(pdf_content, content_type='application/pdf')
            filename = f"invoice_{invoice.invoice_number}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        return Response({"error": "PDF generation failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        invoice = self.get_object()
        client = invoice.client
        
        if not client or not client.email:
            return Response({"error": "Müştərinin email ünvanı yoxdur."}, status=status.HTTP_400_BAD_REQUEST)
        
        pdf_content = self._generate_pdf(invoice)
        if not pdf_content:
            return Response({"error": "PDF yaradıla bilmədi."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        try:
            from django.core.mail import EmailMessage
            from django.conf import settings
            
            subject = f"Faktura #{invoice.invoice_number} - {invoice.business.name}"
            
            # Simple body with link
            public_link = f"http://localhost:5173/view/{invoice.share_token}"
            body = f"Salam {client.name},\n\n"
            body += f"{invoice.business.name} tərəfindən sizə {invoice.invoice_number} nömrəli faktura göndərilib.\n"
            body += f"Məbləğ: {invoice.total} AZN\n\n"
            body += f"Fakturanı onlayn izləmək və ödəmək üçün aşağıdakı linkə daxil olun:\n{public_link}\n\n"
            body += "Təşəkkürlər!"
            
            email = EmailMessage(
                subject,
                body,
                settings.DEFAULT_FROM_EMAIL or 'noreply@invoiceaz.com',
                [client.email],
            )
            
            email.attach(f"invoice_{invoice.invoice_number}.pdf", pdf_content, 'application/pdf')
            email.send()
            
            # Update status if needed
            if invoice.status in ['draft', 'finalized']:
                invoice.status = 'sent'
                import django.utils.timezone as timezone
                invoice.sent_at = timezone.now()
                invoice.save()
                
            return Response({"message": "Email uğurla göndərildi."})
        except Exception as e:
            return Response({"error": f"Email göndərmək mümkün olmadı: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def mark_as_sent(self, request, pk=None):
        invoice = self.get_object()
        from django.utils import timezone
        invoice.sent_at = timezone.now()
        if invoice.status in ['draft', 'finalized']:
            invoice.status = 'sent'
        invoice.save()
        return Response({"message": "Faktura göndərildi kimi qeyd edildi.", "sent_at": invoice.sent_at})

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='public/(?P<share_token>[^/.]+)')
    def public_view(self, request, share_token=None):
        try:
            from django.utils import timezone
            invoice = Invoice.objects.get(share_token=share_token)
            
            # Tracking logic
            if invoice.status in ['sent', 'finalized']:
                invoice.status = 'viewed'
            
            if not invoice.viewed_at:
                invoice.viewed_at = timezone.now()
            
            invoice.save()
            
            return Response(InvoiceSerializer(invoice).data)
        except Invoice.DoesNotExist:
            return Response({"error": "Faktura tapılmadı"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny], url_path='public/(?P<share_token>[^/.]+)/pay')
    def public_pay(self, request, share_token=None):
        try:
            invoice = Invoice.objects.get(share_token=share_token)
            if invoice.status == 'paid':
                return Response({"message": "Bu faktura artıq ödənilib"}, status=status.HTTP_200_OK)
            
            # Create a mock payment record
            from .models import Payment
            from django.utils import timezone
            Payment.objects.create(
                invoice=invoice,
                amount=invoice.total,
                payment_date=timezone.now().date(),
                payment_method='online',
                reference=f"PAY-{timezone.now().strftime('%Y%m%d%H%M%S')}"
            )
            
            return Response({"message": "Ödəniş uğurla tamamlandı", "status": "paid"})
        except Invoice.DoesNotExist:
            return Response({"error": "Faktura tapılmadı"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='public/(?P<share_token>[^/.]+)/pdf')
    def public_pdf(self, request, share_token=None):
        try:
            invoice = Invoice.objects.get(share_token=share_token)
            pdf_content = self._generate_pdf(invoice)
            
            if pdf_content:
                response = HttpResponse(pdf_content, content_type='application/pdf')
                filename = f"invoice_{invoice.invoice_number}.pdf"
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
            
            return Response({"error": "PDF yaradıla bilmədi."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Invoice.DoesNotExist:
            return Response({"error": "Faktura tapılmadı"}, status=status.HTTP_404_NOT_FOUND)
    @action(detail=False, methods=['get'], url_path='top-products')
    def top_products(self, request):
        from django.db.models import Sum, F
        from .models import InvoiceItem
        
        business = self.get_active_business()
        if not business:
            return Response({"error": "Biznes seçilməyib."}, status=status.HTTP_404_NOT_FOUND)
            
        items = InvoiceItem.objects.filter(invoice__business=business)\
            .values(product_name=F('description'))\
            .annotate(
                total_quantity=Sum('quantity'),
                total_revenue=Sum('amount')
            )\
            .order_by('-total_quantity')[:10]
            
        return Response(items)
