from rest_framework import permissions

class IsRoleAuthorized(permissions.BasePermission):
    """
    Checks if the user has a sufficient role to perform an action on a model.
    Assumes `request._team_role` and `request._is_team_member` are set by BusinessContextMixin.
    If they are not set, it assumes the user is the owner and allows access.
    """
    def has_permission(self, request, view):
        # Determine role from active business or fallback
        is_team_member = getattr(request, '_is_team_member', None)
        role = getattr(request, '_team_role', None)
        
        # If mixin hasn't run yet, try to run its helper logic if possible
        if is_team_member is None and hasattr(view, 'get_active_business'):
            view.get_active_business()
            is_team_member = getattr(request, '_is_team_member', False)
            role = getattr(request, '_team_role', 'SALES_REP')

        # Allow owners to do whatever
        if is_team_member is False:
            return True
            
        # Default role for team members is SALES_REP if not specified
        if role is None:
            role = 'SALES_REP'
        
        # Determine model name from serializer
        model = getattr(getattr(view, 'serializer_class', None), 'Meta', None)
        model = getattr(model, 'model', None)
        model_name = model.__name__ if model else None
        
        if not model_name:
            return True

        from .rbac import ROLE_PERMISSIONS
        
        rules = ROLE_PERMISSIONS.get(role, {})
        
        if rules.get('can_access_all', False):
            return True
            
        models_config = rules.get('models', {})
        
        if model_name not in models_config:
            return False
            
        allowed_methods = models_config[model_name].get('methods', [])
        
        if request.method not in allowed_methods:
            return False
            
        return True
            
        return False
