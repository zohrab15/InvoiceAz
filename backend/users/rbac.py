# users/rbac.py

# Unified dictionary defining allowed methods and query filter types for each role.
# 
# filter_type meanings:
#   'all': Sees all records for the business.
#   'assigned_only': Sees only records where assigned_to=user.
#   'own_or_assigned': Sees records where created_by=user OR related client is assigned to user.
#   'none' (or missing model): Sees nothing (access denied).

ROLE_PERMISSIONS = {
    'MANAGER': {
        'can_access_all': True,
        'models': {}
    },
    'ACCOUNTANT': {
        'can_access_all': False,
        'models': {
            'Invoice': {'methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], 'filter_type': 'all'},
            'Expense': {'methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], 'filter_type': 'all'},
            'Payment': {'methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], 'filter_type': 'all'},
            'Client': {'methods': ['GET', 'OPTIONS', 'HEAD'], 'filter_type': 'all'}, # Read-only
            'Product': {'methods': ['GET', 'OPTIONS', 'HEAD'], 'filter_type': 'all'}, # Read-only
        }
    },
    'INVENTORY_MANAGER': {
        'can_access_all': False,
        'models': {
            'Product': {'methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], 'filter_type': 'all'},
            'InventoryTransaction': {'methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], 'filter_type': 'all'},
            'Category': {'methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], 'filter_type': 'all'},
        }
    },
    'SALES_REP': {
        'can_access_all': False,
        'models': {
            'Client': {'methods': ['GET', 'POST', 'PUT', 'PATCH'], 'filter_type': 'assigned_only'}, # No DELETE
            'Invoice': {'methods': ['GET', 'POST', 'PUT', 'PATCH'], 'filter_type': 'own_or_assigned'}, # No DELETE
            'Product': {'methods': ['GET', 'OPTIONS', 'HEAD'], 'filter_type': 'all'}, # Read-only
        }
    }
}
