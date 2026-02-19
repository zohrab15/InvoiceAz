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
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(pay_url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            temp_qr = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
            img.save(temp_qr.name)
            qr_code_path = temp_qr.name
        except Exception as e:
            print(f"QR Code generation error: {e}")

        context = {
            'invoice': invoice,
            'business': invoice.business,
            'client': invoice.client,
            'items': invoice.items.all(),
            'qr_code_path': qr_code_path,
            'theme': invoice.invoice_theme or 'modern',
        }
        
        html_string = render_to_string('invoices/invoice_pdf.html', context)
        
        # Font registration
        try:
            from reportlab.pdfbase import pdfmetrics
            from reportlab.pdfbase.ttfonts import TTFont
            from reportlab.pdfbase.pdfmetrics import registerFontFamily
            
            # Use absolute strings for paths
            static_dir = str(settings.BASE_DIR / "static")
            fonts_dir = os.path.join(static_dir, "fonts")
            
            # Register Inter
            pdfmetrics.registerFont(TTFont('Inter', os.path.join(fonts_dir, "Inter-Regular.ttf")))
            pdfmetrics.registerFont(TTFont('Inter-Bold', os.path.join(fonts_dir, "Inter-Bold.ttf")))
            registerFontFamily('Inter', normal='Inter', bold='Inter-Bold')
            
            # Register Arial (Good for Az characters)
            pdfmetrics.registerFont(TTFont('Arial', os.path.join(fonts_dir, "arial.ttf")))
            pdfmetrics.registerFont(TTFont('Arial-Bold', os.path.join(fonts_dir, "arialbd.ttf")))
            registerFontFamily('Arial', normal='Arial', bold='Arial-Bold')
            
        except Exception as e:
            print(f"Font registration error: {e}")

        def link_callback(uri, rel):
            import os
            import requests
            import tempfile
            from django.conf import settings

            if not uri: return uri
            
            # 1. Handle absolute local paths
            if os.path.isabs(uri) and os.path.isfile(uri):
                return uri

            # 2. Handle HTTP/HTTPS URLs (important for Logos in production)
            if uri.startswith('http://') or uri.startswith('https://'):
                try:
                    response = requests.get(uri, timeout=5)
                    if response.status_code == 200:
                        temp_img = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
                        temp_img.write(response.content)
                        temp_img.close()
                        return temp_img.name
                except Exception as e:
                    print(f"Error downloading image {uri}: {e}")
                return uri

            # 3. Handle local URL paths
            path = None
            if uri.startswith(settings.STATIC_URL):
                path = os.path.join(settings.STATIC_ROOT, uri[len(settings.STATIC_URL):])
                if not os.path.isfile(path):
                    path = os.path.join(str(settings.BASE_DIR), "static", uri[len(settings.STATIC_URL):])
            
            elif uri.startswith(settings.MEDIA_URL):
                path = os.path.join(settings.MEDIA_ROOT, uri[len(settings.MEDIA_URL):])
                if not os.path.isfile(path):
                    path = os.path.join(str(settings.BASE_DIR), "media", uri[len(settings.MEDIA_URL):])

            if path and os.path.isfile(path):
                return path
            
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
            
            # Clean up QR code file
            if qr_code_path and os.path.exists(qr_code_path):
                try:
                    os.unlink(qr_code_path)
                except:
                    pass
            
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
