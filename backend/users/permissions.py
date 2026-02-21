from rest_framework import permissions

class IsRoleAuthorized(permissions.BasePermission):
    """
    Checks if the user has a sufficient role to perform an action on a model.
    Assumes `request._team_role` and `request._is_team_member` are set by BusinessContextMixin.
    If they are not set, it assumes the user is the owner and allows access.
    """
    def has_permission(self, request, view):
        # Allow owners to do whatever
        if hasattr(request, '_active_business') and not getattr(request, '_is_team_member', False):
            return True
            
        # If they haven't passed BusinessContextMixin yet, or it's not applicable, allow it
        # (The mixin itself will filter querysets)
        if not hasattr(request, '_is_team_member'):
            return True
            
        role = getattr(request, '_team_role', 'SALES_REP')
        
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
