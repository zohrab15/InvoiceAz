import tempfile
import io
import base64
from xhtml2pdf import pisa

font_data = b'PK\x03\x04\x14\x00\x00\x00\x08\x00' # stub
b64 = base64.b64encode(font_data).decode('ascii')
html = f"""
<html><head><style>
@font-face {{
    font-family: "Test";
    src: url("data:font/ttf;base64,{b64}");
}}
</style></head><body>Hello</body></html>
"""

result = io.BytesIO()
status = pisa.pisaDocument(io.BytesIO(html.encode('utf-8')), result)
if status.err:
    print("Error:", status.err)
else:
    print("Success")
