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

    def get_total_revenue(self, obj):
        return obj.invoices.exclude(status='draft').aggregate(Sum('total'))['total__sum'] or 0

    def get_total_expenses(self, obj):
        return obj.expenses.aggregate(Sum('amount'))['amount__sum'] or 0
