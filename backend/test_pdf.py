import os
import django
import io
import sys

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from invoices.models import Invoice
from invoices.views import InvoiceViewSet
from django.template.loader import render_to_string
from xhtml2pdf import pisa

def test_pdf_with_themes():
    invoice = Invoice.objects.first()
    if not invoice:
        print("No invoice found")
        return
    
    viewset = InvoiceViewSet()
    
    for theme in ['modern', 'classic', 'minimal']:
        print(f"Testing theme: {theme}")
        invoice.invoice_theme = theme
        pdf_content = viewset._generate_pdf(invoice)
        
        if pdf_content:
            output_file = f"test_output_{theme}.pdf"
            with open(output_file, "wb") as f:
                f.write(pdf_content)
            print(f"PDF generated successfully: {os.path.abspath(output_file)}")
        else:
            print(f"PDF generation failed for theme: {theme}")

if __name__ == "__main__":
    test_pdf_with_themes()
