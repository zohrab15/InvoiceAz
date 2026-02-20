class BusinessContextMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Note: In DRF, request.user is often not populated yet (AnonymousUser)
        # because authentication happens during the view dispatch, not middleware.
        # Business isolation is handled via BusinessContextMixin in ViewSets.
        
        request.business = None
        return None
