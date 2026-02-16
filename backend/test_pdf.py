import os
import django
import io

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from invoices.models import Invoice
from django.template.loader import render_to_string
from xhtml2pdf import pisa

def test_pdf():
    invoice = Invoice.objects.first()
    if not invoice:
        print("No invoice found")
        return
    
    context = {
        'invoice': invoice,
        'business': invoice.business,
        'client': invoice.client,
        'items': invoice.items.all(),
    }
    
    html_string = render_to_string('invoices/invoice_pdf.html', context)
    
    result = io.BytesIO()
    pdf = pisa.pisaDocument(
        io.BytesIO(html_string.encode("UTF-8")), 
        result, 
        encoding='UTF-8'
    )
    
    if not pdf.err:
        with open("test_output.pdf", "wb") as f:
            f.write(result.getvalue())
        print(f"PDF generated successfully: {os.path.abspath('test_output.pdf')}")
    else:
        print(f"PDF generation failed: {pdf.err}")

if __name__ == "__main__":
    test_pdf()
