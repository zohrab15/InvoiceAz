from dj_rest_auth.views import LoginView
import logging

logger = logging.getLogger('django')

class DebugLoginView(LoginView):
    def post(self, request, *args, **kwargs):
        logger.info(f"--- DEBUG LOGIN START ---")
        logger.info(f"Data: {request.data}")
        logger.info(f"Headers: {request.headers}")
        
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 400:
            logger.error(f"LOGIN 400 ERROR: {response.data}")
        else:
            logger.info(f"LOGIN SUCCESS: {response.status_code}")
            
        return response
