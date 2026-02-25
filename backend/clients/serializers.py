from rest_framework import serializers
from clients.models import Client

from django.db.models import Sum

class ClientSerializer(serializers.ModelSerializer):
    total_revenue = serializers.SerializerMethodField()
    total_expenses = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ('id', 'business', 'created_at', 'updated_at')

    def validate(self, data):
        client_type = data.get('client_type', self.instance.client_type if self.instance else 'company')
        voen = data.get('voen')

        if voen and client_type != 'foreign':
            # Remove any spaces or dashes
            voen = voen.replace(' ', '').replace('-', '')
            if not voen.isdigit():
                raise serializers.ValidationError({"voen": "VÖEN yalnız rəqəmlərdən ibarət olmalıdır."})
            if len(voen) != 10:
                raise serializers.ValidationError({"voen": "VÖEN mütləq 10 rəqəmli olmalıdır."})
            data['voen'] = voen
            
        return data

    def get_total_revenue(self, obj):
        return obj.invoices.exclude(status='draft').aggregate(Sum('total'))['total__sum'] or 0

    def get_total_expenses(self, obj):
        return obj.expenses.aggregate(Sum('amount'))['amount__sum'] or 0
