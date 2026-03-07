import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import Product
from django.db.models import Sum, F

qs = Product.objects.all()

try:
    print("Testing base_price * stock_quantity")
    res1 = qs.aggregate(total=Sum(F('base_price') * F('stock_quantity')))
    print("res1:", res1)
except Exception as e:
    print("Exception on res1:", type(e), e)

try:
    print("Testing cost_price * stock_quantity")
    res2 = qs.aggregate(total=Sum(F('cost_price') * F('stock_quantity')))
    print("res2:", res2)
except Exception as e:
    print("Exception on res2:", type(e), e)

print("Done")
