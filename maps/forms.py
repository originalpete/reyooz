from django import forms
from django.contrib.auth.models import User
import re
from django.utils.encoding import force_unicode


class FormProcessingError(Exception):
    pass


class FormFunctions:
    def field_errors_dict(self):
        """Return dictionary of fields and array of field errors in text format."""
        d = {}
        for field, error_array in self.errors.items():
            d[field] = [force_unicode(error) for error in error_array]
        return d


class LoginForm(forms.Form, FormFunctions):
    email = forms.EmailField(required=True)
    password = forms.CharField(required=True)


class NewUserForm(forms.Form, FormFunctions):
    email = forms.EmailField(required=True)
    password = forms.CharField(required=True, min_length=4, max_length=255)
    confirm_password = forms.CharField(required=True, min_length=4, max_length=255)

    def clean_email(self):
        users = User.objects.filter(email=self.cleaned_data['email'])
        if users.__len__() > 0: raise forms.ValidationError("A user with this email address already exists")
        return self.cleaned_data['email']
    
    def clean(self):
        password = self.cleaned_data.get('password')
        confirm_password = self.cleaned_data.get('confirm_password')
        if password != confirm_password: raise forms.ValidationError("Passwords don't match")
        return self.cleaned_data
        

class ItemForm(forms.Form, FormFunctions):
    title = forms.CharField(required=True)
    description = forms.CharField(required=True, widget=forms.Textarea())
    lat = forms.FloatField(required=True)
    lng = forms.FloatField(required=True)


class GetItemsForm(forms.Form, FormFunctions):
    q = forms.CharField(required=False)
    use_q = forms.BooleanField(required=False)
    
    use_map_bounds = forms.BooleanField(required=False)
    ne_lat = forms.FloatField(required=False)
    ne_lng = forms.FloatField(required=False)
    sw_lat = forms.FloatField(required=False)
    sw_lng = forms.FloatField(required=False)
    
    def clean(self):
        # Ensure that co-ordinates are "one for all"
        coords = []
        coords.append(self.cleaned_data.get("ne_lat") != None)
        coords.append(self.cleaned_data.get("ne_lng") != None)
        coords.append(self.cleaned_data.get("sw_lat") != None)
        coords.append(self.cleaned_data.get("sw_lng") != None)
        
        if coords.__contains__(True) & coords.__contains__(False):
            raise forms.ValidationError("All coordinates required if one is present")
            
        self.cleaned_data["use_map_bounds"] = coords.__contains__(True)
        
        q = self.cleaned_data["q"]
        self.cleaned_data["use_q"] = (q != None) & (q.__len__() > 0)
        
        if self.cleaned_data["use_q"] & (not self.cleaned_data["use_map_bounds"]):
            raise forms.ValidationError("Map bounds required to use search")
        
        return self.cleaned_data


class ItemMessageForm(forms.Form, FormFunctions):
    email = forms.EmailField(required=True)
    message = forms.CharField(required=True, widget=forms.Textarea())


class FeedbackForm(forms.Form, FormFunctions):
    email = forms.EmailField(required=False)
    message = forms.CharField(required=True, widget=forms.Textarea())
    
    def clean_message(self):
        message = self.cleaned_data["message"]
        if re.compile('<[a-zA-Z]+.*>').match(message):
            raise forms.ValidationError("HTML tags are not allowed in the feedback message.")
        return message

