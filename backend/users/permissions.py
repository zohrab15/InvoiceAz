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

        if role == 'MANAGER':
            return True
            
        if role == 'ACCOUNTANT':
            allowed_models = ['Invoice', 'Expense', 'Payment', 'Client']
            if model_name not in allowed_models:
                return False
            # Read-only for Clients
            if model_name == 'Client' and request.method not in permissions.SAFE_METHODS:
                return False
            return True
            
        if role == 'INVENTORY_MANAGER':
            allowed_models = ['Product', 'InventoryTransaction', 'Category']
            if model_name not in allowed_models:
                return False
            return True
            
        if role == 'SALES_REP':
            allowed_models = ['Client', 'Invoice']
            if model_name not in allowed_models:
                return False
            return True
            
        return False
