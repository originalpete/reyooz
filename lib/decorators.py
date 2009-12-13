try:
    from functools import update_wrapper
except ImportError:
    from django.utils.functional import update_wrapper  # Python 2.3, 2.4 fallback.
    
from django.http import HttpResponseNotAllowed


def allowed_methods(*methods):
    def decorate(view_func):
        return _CheckHttpMethod(view_func, methods)
    return decorate

class _CheckHttpMethod(object):
    
    def __init__(self, view_func, allowed_methods):
        self.view_func = view_func
        self.allowed_methods = allowed_methods
        update_wrapper(self, view_func)
        
    def __get__(self, obj, cls=None):
        view_func = self.view_func.__get__(obj, cls)
        return _CheckHttpMethod(view_func, self.allowed_methods)
    
    def __call__(self, request, *args, **kwargs):
        if not self.allowed_methods.__contains__(request.method):
            return HttpResponseNotAllowed(self.allowed_methods)
        else:
            return self.view_func(request, *args, **kwargs)
    