from rest_framework import serializers
from invoices.models import Invoice, InvoiceItem, Payment, Expense
from users.serializers import BusinessSerializer
from clients.serializers import ClientSerializer

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('id', 'business', 'created_at', 'updated_at')

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = '__all__'
        read_only_fields = ('id', 'invoice', 'amount')

class PaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.ReadOnlyField(source='invoice.invoice_number')
    client_name = serializers.ReadOnlyField(source='invoice.client.name')

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('id',)

    def validate(self, data):
        request = self.context.get('request')
        if request and 'invoice' in data:
            invoice = data['invoice']
            business = getattr(request, '_active_business', None)
            
            # Security: Prevent adding payments to invoices from other businesses (IDOR)
            if business and invoice.business_id != business.id:
                from rest_framework import serializers
                raise serializers.ValidationError({"invoice": "Bu faktura seçilmiş biznesə aid deyil."})
                
        return data

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)
    payments = PaymentSerializer(many=True, read_only=True)
    client_details = ClientSerializer(source='client', read_only=True)
    business_details = BusinessSerializer(source='business', read_only=True)
    client_name = serializers.ReadOnlyField(source='client.name')
    client_phone = serializers.ReadOnlyField(source='client.phone')
    client_email = serializers.ReadOnlyField(source='client.email')
    status = serializers.ChoiceField(choices=Invoice.STATUS_CHOICES, default='draft')

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ('id', 'business', 'invoice_number', 'share_token', 'pdf_file', 'created_at', 'updated_at', 'paid_amount', 'paid_at')

    def validate(self, data):
        request = self.context.get('request')
        if request and 'client' in data:
            client = data['client']
            business = getattr(request, '_active_business', None)
            
            # Ensure client belongs to the active business context
            if business and client.business_id != business.id:
                raise serializers.ValidationError({"client": "Seçilmiş müştəri bu biznesə aid deyil."})
                
            is_team_member = getattr(request, '_is_team_member', False)
            role = getattr(request, '_team_role', 'SALES_REP') if is_team_member else 'OWNER'
            
            # Ensure Sales Reps can only use clients explicitly assigned to them
            if role == 'SALES_REP':
                if client.assigned_to != request.user:
                    raise serializers.ValidationError({"client": "Bu müştəri sizə təhkim olunmayıb."})
                    
        return data

    def create(self, validated_data):
        from django.db import transaction
        with transaction.atomic():
            items_data = validated_data.pop('items', [])
            invoice = Invoice.objects.create(**validated_data)
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=invoice, **item_data)
            invoice.calculate_totals()
            return invoice

    def update(self, instance, validated_data):
        # Prevent editing sent or paid invoices
        # Exception: Allow if status is 'sent' but it was never actually delivered (sent_at is None)
        if instance.status in ['viewed', 'paid'] or (instance.status == 'sent' and instance.sent_at):
            raise serializers.ValidationError({"error": "Göndərilmiş və ya ödənilmiş fakturaları redaktə etmək olmaz. Zəhmət olmasa dublikat yaradın."})

        from django.db import transaction
        with transaction.atomic():
            items_data = validated_data.pop('items', [])

            # Update instance fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            
            # Update items
            if items_data:
                instance.items.all().delete()
                for item_data in items_data:
                    InvoiceItem.objects.create(invoice=instance, **item_data)
            
            instance.calculate_totals()
            return instance
