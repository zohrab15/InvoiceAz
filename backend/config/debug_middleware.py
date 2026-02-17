import traceback
import os
from django.utils.deprecation import MiddlewareMixin

class ExceptionLoggingMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        log_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'error_log.txt')
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"\n--- EXCEPTION: {exception} ---\n")
            f.write(f"Path: {request.path}\n")
            f.write(f"Method: {request.method}\n")
            f.write(traceback.format_exc())
            f.write("-" * 40 + "\n")
        return None
