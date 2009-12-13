from django.shortcuts import get_object_or_404
from django.views.generic.simple import direct_to_template
from django.http import HttpResponseRedirect, HttpResponse
from django.contrib.auth.models import User
from django.contrib import auth
from django.utils import simplejson
from maps.models import Item, UserProfile, ItemMessage, FeedbackMessage, Feed
from maps.forms import LoginForm, NewUserForm, ItemForm, GetItemsForm, ItemMessageForm, FeedbackForm
from maps.emails import VerificationEmail, ItemMessageEmail, SendEmailError
from maps.feeds import FeedbackFeed, ItemFeed, ItemMessageFeed
from lib.responder import respond_to
import settings
import datetime
import random
from lib.decorators import allowed_methods

class JsonResponseError(Exception):
    pass


# GET /
@allowed_methods('GET')
def welcome(request):
    # force session flush if there's no sessionid.
    if not request.COOKIES.get(settings.SESSION_COOKIE_NAME): request.session.flush()
    
    api_key = request.GET.get('api_key')
    if not api_key: api_key = settings.GOOGLE_MAPS_API_KEY
    return direct_to_template(request, 'index.html', {'api_key': api_key, 'cache_buster': random.randint(10e13,10e14)})
    # if respond_to(request).html:
    #     return direct_to_template(request, 'index.html', {'api_key': settings.GOOGLE_MAPS_API_KEY, 'user_is_authenticated': request.user.is_authenticated()})


# POST /login
@allowed_methods('POST')
def login(request):
    errors = {'__all__': []}
    try:
        form = LoginForm(request.POST)
        
        if not form.is_valid():
            errors.update(form.field_errors_dict())
            raise JsonResponseError
        
        users = User.objects.filter(email=form.cleaned_data['email'])
        
        if not users.__len__() == 1: 
            errors['__all__'].append("User not found")
            raise JsonResponseError
            
        user = auth.authenticate(username=users[0].username, password=form.cleaned_data['password'])
        
        if user is None or not user.is_active:
            errors['__all__'].append("Could not authenticate")
            raise JsonResponseError
        
        auth.login(request, user)
        response = {'success': True, 'user_id': user.id}
        return HttpResponse(simplejson.dumps(response))
    
    except JsonResponseError:
        response = {'success': False, 'errors': errors}
        return HttpResponse(simplejson.dumps(response))


# GET /logout
@allowed_methods('GET')
def logout(request):
    auth.logout(request)
    response = {'success': True}
    return HttpResponse(simplejson.dumps(response))


# POST /users/new
@allowed_methods('POST')
def new_user(request):
    errors = {'__all__': []}
    try:
        form = NewUserForm(request.POST)
        
        if not form.is_valid():
            errors.update(form.field_errors_dict())
            raise JsonResponseError
        
        user = User(
            username = form.cleaned_data['email'],
            email = form.cleaned_data['email'],
        )
        
        user.set_password(form.cleaned_data['password'])
        user.is_active = False
        user.save()

        profile = UserProfile(
            user = user,
            magic_key = "%x" % random.randint(10e13,10e14),
            signup_ip = request.META['REMOTE_ADDR']
        )
        profile.save()
        
        try:
            VerificationEmail(user=user).send()
        except SendEmailError:
            profile.delete()
            user.delete()
            errors['__all__'].append("could not send email")
            raise JsonResponseError
        
        message = """
            You have been successfully signed up! Please check your email for 
            instructions on how to activate your new account.
        """ 
        response = {'success': True, 'user_id': user.id, 'message': message}
        return HttpResponse(simplejson.dumps(response))
    
    except JsonResponseError:
        response = {'success': False, 'errors': errors}
        return HttpResponse(simplejson.dumps(response))


# GET /users/id/verify?magic_key=
@allowed_methods('GET')
def verify_user(request, user_id):
    # we don't use a form here, so regular error array is fine
    errors = []
    try:
        users = User.objects.filter(id=user_id)
        
        if users.__len__() == 0:
            errors.append("user not found")
            raise JsonResponseError
        
        user = users[0]
        if user.is_active:
            errors.append("user already verified")
            raise JsonResponseError
        
        if user.get_profile().magic_key != request.GET.get('magic_key', None):
            errors.append("invalid or missing magic key")
            raise JsonResponseError
        
        user.is_active = True
        user.get_profile().magic_key = ""
        user.get_profile().save()
        user.save()
        
        return HttpResponseRedirect("/?verified=true&email=%s" % user.email)

    except JsonResponseError:
        return direct_to_template(request, 'verify.html', {'success': False, 'errors': errors})
        

# GET /users/id
@allowed_methods('GET')
def get_user(request, user_id):
    errors = {'__all__': []}
    try:
        users = User.objects.filter(id=user_id)
        
        if users.__len__() == 0:
            errors['__all__'].append("user not found")
            raise JsonResponseError
        
        user = users[0]
        
        if user != request.user:
            errors['__all__'].append("Not allowed")
            raise JsonResponseError
        
        response = {
            'success': True, 
            'user': {
                'id': user.id,
                'email': user.email,
            }
        }
        
        return HttpResponse(simplejson.dumps(response))
    
    except JsonResponseError:
        response = {'success': False, 'errors': errors}
        return HttpResponse(simplejson.dumps(response))

#
# GET /users/id/items
@allowed_methods('GET')
def get_user_items(request, user_id):
    errors = {'__all__': []}
    try:
        users = User.objects.filter(id=user_id)
        
        if users.__len__() == 0:
            errors['__all__'].append("user not found")
            raise JsonResponseError
        
        user = users[0]
        
        if user != request.user:
            errors['__all__'].append("Not allowed")
            raise JsonResponseError
        
        item_dicts = []
        for item in user.item_set.all():
            i = item.simple_dict()
            i['expired'] = item.expired()
            item_dicts.append({'item': i})
        
        response = { 'success': True, 'items': item_dicts }
        return HttpResponse(simplejson.dumps(response))
    
    except JsonResponseError:
        response = {'success': False, 'errors': errors}
        return HttpResponse(simplejson.dumps(response))


# POST /items/id/message
@allowed_methods('POST')
def send_item_message(request, item_id):
    errors = {'__all__': []}
    try:
        items = Item.objects.filter(id=item_id)
        
        if items.__len__() == 0:
            errors['__all__'].append("item not found")
            raise JsonResponseError
        
        item = items[0]
        
        form = ItemMessageForm(request.POST)
        
        if not form.is_valid():
            errors.update(form.field_errors_dict())
            raise JsonResponseError
        
        user = request.user if request.user.is_authenticated() else None
        
        msg = ItemMessage(
            user = user,
            item = item,
            ip = request.META['REMOTE_ADDR'],
            session_id = request.COOKIES.get(settings.SESSION_COOKIE_NAME),
            magic_key = "%x" % random.randint(10e13,10e14),
            email = form.cleaned_data['email'],
            message = form.cleaned_data['message']
        )
        msg.save()
        
        try:
            ItemMessageEmail(message = msg).send()
        except SendEmailError, e:
            errors['__all__'].append("could not send email")
            msg.delete()
            raise JsonResponseError
        
        msg.save()
        
        response = {'success': True, 'message': "Thank you - your message is on its way to the item's owner"}
        return HttpResponse(simplejson.dumps(response))

    except JsonResponseError:
        response = {'success': False, 'errors': errors}
        return HttpResponse(simplejson.dumps(response))


# POST /items/new
@allowed_methods('POST')
def new_item(request):
    errors = {'__all__': []}
    try:
        if not request.user.is_authenticated():
            errors['__all__'].append("user must be logged in to create an item")
            raise JsonResponseError
        
        form = ItemForm(request.POST)
        
        if not form.is_valid():
            errors.update(form.field_errors_dict())
            raise JsonResponseError
        
        item = Item(
            title = form.cleaned_data['title'],
            description = form.cleaned_data['description'],
            lat = form.cleaned_data['lat'],
            lng = form.cleaned_data['lng'],
            user = request.user
        )
        
        item.relist()
        item.save()
        
        response = {'success': True, 'item_id': item.id}
        return HttpResponse(simplejson.dumps(response))
    
    except JsonResponseError:
        response = {'success': False, 'errors': errors}
        return HttpResponse(simplejson.dumps(response))


# GET /items/id
@allowed_methods('GET')
def get_item(request, item_id):
    errors = {'__all__': []}
    try:
        items = Item.objects.filter(id=item_id)
        
        if items.__len__() == 0:
            errors['__all__'].append("item not found")
            raise JsonResponseError
        
        item = items[0]
        
        response = {
            'success': True, 
            'item': item.simple_dict()
        }
        
        return HttpResponse(simplejson.dumps(response))
    
    except JsonResponseError:
        response = {'success': False, 'errors': errors}
        return HttpResponse(simplejson.dumps(response))


# POST /items/id/update
@allowed_methods('POST')
def update_item(request, item_id):
    errors = {'__all__': []}
    try:
        items = Item.objects.filter(id=item_id)
        
        if items.__len__() == 0:
            errors['__all__'].append("item not found")
            raise JsonResponseError
        
        item = items[0]

        if item.user != request.user:
            errors['__all__'].append("not allowed")
            raise JsonResponseError
        
        form = ItemForm(request.POST)
        
        if not form.is_valid():
            errors.update(form.field_errors_dict())
            raise JsonResponseError
        
        item.title = form.cleaned_data['title']
        item.description = form.cleaned_data['description']
        item.lat = form.cleaned_data['lat']
        item.lng = form.cleaned_data['lng']
        
        item.relist()
        item.save()

        response = {'success': True}
        return HttpResponse(simplejson.dumps(response))
    
    except JsonResponseError:
        response = {'success': False, 'errors': errors}
        return HttpResponse(simplejson.dumps(response))
    

# POST /items/id/expire
@allowed_methods('POST')
def expire_item(request, item_id):
    errors = {'__all__': []}
    try:
        items = Item.objects.filter(id=item_id)

        if items.__len__() == 0:
            errors['__all__'].append("item not found")
            raise JsonResponseError

        item = items[0]
        
        if item.user != request.user:
            errors['__all__'].append("not allowed")
            raise JsonResponseError
        
        item.expire()
        item.save()

        response = {'success': True}
        return HttpResponse(simplejson.dumps(response))

    except JsonResponseError:
        response = {'success': False, 'errors': errors}
        return HttpResponse(simplejson.dumps(response))


# POST /items/id/relist
@allowed_methods('POST')
def relist_item(request, item_id):
    errors = {'__all__': []}
    try:
        items = Item.objects.filter(id=item_id)

        if items.__len__() == 0:
            errors['__all__'].append("item not found")
            raise JsonResponseError

        item = items[0]
        
        if item.user != request.user:
            errors['__all__'].append("not allowed")
            raise JsonResponseError
        
        item.relist()
        item.save()

        response = {'success': True}
        return HttpResponse(simplejson.dumps(response))

    except JsonResponseError:
        response = {'success': False, 'errors': errors}
        return HttpResponse(simplejson.dumps(response))


# GET /items
@allowed_methods('GET')
def get_items(request):
    errors = {'__all__': []}
    try:
        form = GetItemsForm(request.GET)
        
        if not form.is_valid():
            errors.update(form.field_errors_dict())
            raise JsonResponseError
        
        if form.cleaned_data["use_q"]:
            q = "(default: %s) AND lat_f: [%s TO %s] AND lng_f: [%s TO %s]" % (
                form.cleaned_data["q"],
                form.cleaned_data["sw_lat"],
                form.cleaned_data["ne_lat"],
                form.cleaned_data["sw_lng"],
                form.cleaned_data["ne_lng"]
            )
            items = Item.find_by_solr(q)
            
        elif form.cleaned_data["use_map_bounds"]:
            items = Item.objects.filter(
                lat__gte = form.cleaned_data["sw_lat"],
                lat__lte = form.cleaned_data["ne_lat"],
                lng__gte = form.cleaned_data["sw_lng"],
                lng__lte = form.cleaned_data["ne_lng"]
            ).order_by('expires_at').reverse()[:100]
        else:
            items = Item.objects.order_by('expires_at').reverse()[:100]
        
        item_dicts = []
        for item in items:
            if not item.expired(): item_dicts.append( { 'item': item.simple_dict() } )
        
        response = { 'success': True, 'items': item_dicts }
        return HttpResponse(simplejson.dumps(response))
    
    except JsonResponseError:
        response = {'success': False, 'errors': errors}
        return HttpResponse(simplejson.dumps(response))


# GET /messages/id/report_spam?magic_key=
@allowed_methods('GET')
def report_spam(request, message_id):
    # we don't use a form here, so regular error array is fine
    errors = []
    try:
        messages = ItemMessage.objects.filter(id=message_id)
        
        if messages.__len__() == 0:
            errors.append("message not found")
            raise JsonResponseError
        
        msg = messages[0]
        
        if msg.magic_key != request.GET.get('magic_key', None):
            errors.append("invalid or missing magic key")
            raise JsonResponseError
        
        msg.is_spam = True
        msg.save()
        
        return direct_to_template(request, 'report_spam.html', {'success': True} )

    except JsonResponseError:
        return direct_to_template(request, 'report_spam.html', {'success': False, 'errors': errors})


# POST /feedback/new
@allowed_methods('POST')
def new_feedback(request):
    errors = {'__all__': []}
    try:
        form = FeedbackForm(request.POST)
        
        if not form.is_valid():
            errors.update(form.field_errors_dict())
            raise JsonResponseError
        
        user = request.user if request.user.is_authenticated() else None
        
        msg = FeedbackMessage(
            user = user,
            ip = request.META['REMOTE_ADDR'],
            email = form.cleaned_data['email'],
            message = form.cleaned_data['message']
        )
        
        # Send email >here.<
        msg.save()
        
        response = {'success': True, 'message': "Thank you for your feedback!"}
        return HttpResponse(simplejson.dumps(response))
        
    except JsonResponseError:
        response = {'success': False, 'errors': errors}
        return HttpResponse(simplejson.dumps(response))


@allowed_methods('GET')
def get_feed(request, feed_uid):
    f = get_object_or_404(Feed, uid=feed_uid)
    feed = eval(f.feed_class)
    
    # ripped from syndication.views.feed
    feedgen = feed(None, request).get_feed()
    response = HttpResponse(mimetype=feedgen.mime_type)
    feedgen.write(response, 'utf-8')
    return response


# Test API methods
# -------------------------------

# POST | GET /items/delete
@allowed_methods('POST', 'GET')
def delete_all_items(request):
    Item.objects.all().delete()
    response = {'success': True}
    return HttpResponse(simplejson.dumps(response))

# POST | GET /users/delete
@allowed_methods('POST', 'GET')
def delete_all_users(request):
    User.objects.all().delete()
    response = {'success': True}
    return HttpResponse(simplejson.dumps(response))


#POST | GET /users/activate_by_email
@allowed_methods('POST', 'GET')
def activate_user_by_email(request):
    user = User.objects.filter(email=request.GET.get('email', None))[0]
    user.is_active = True
    user.save()
    
    response = {'success': True}
    return HttpResponse(simplejson.dumps(response))

    
# GET /users/id/magic_key
@allowed_methods('GET')
def get_user_key(request, user_id):
    errors = {'__all__': []}
    try:
        users = User.objects.filter(id=user_id)
    
        if users.__len__() == 0:
            errors['__all__'].append("user not found")
            raise JsonResponseError
    
        user = users[0]
    
        response = {
            'success': True, 
            'magic_key': user.get_profile().magic_key
        }
        return HttpResponse(simplejson.dumps(response))
        
    except JsonResponseError: 
        response = {'success': False, 'errors': errors}
        return HttpResponse(simplejson.dumps(response))
