import os.path
import settings
from django.views.generic.simple import direct_to_template
from django.conf.urls.defaults import *
from django.contrib import admin
from maps import views

admin.autodiscover()

urlpatterns = patterns('',
    (r'^$', views.welcome),
    
    (r'^login$', views.login),
    (r'^logout$', views.logout),
    
    (r'^users/new$', views.new_user),
    (r'^users/(\d+)/verify$', views.verify_user),
    (r'^users/(\d+)$', views.get_user),
    (r'^users/(\d+)/items$', views.get_user_items),
    
    (r'^items/new$', views.new_item),
    (r'^items/(\d+)$', views.get_item),
    (r'^items/(\d+)/update$', views.update_item),
    (r'^items/(\d+)/message$', views.send_item_message),
    (r'^items/(\d+)/expire$', views.expire_item),
    (r'^items/(\d+)/relist$', views.relist_item),
    (r'^items$', views.get_items),
    
    (r'^feeds/(\w+)$', views.get_feed),
    
    (r'^api$', direct_to_template, {'template': 'api.html'}),
    
    (r'^messages/(\d+)/report_spam$', views.report_spam),
    (r'^feedback/new$', views.new_feedback),
    (r'^admin/(.*)', admin.site.root),
)

if settings.DEBUG:
    urlpatterns += patterns('', 
        (r'^static/(?P<path>.*)$', 'django.views.static.serve', { 'document_root': os.path.join(os.path.dirname(__file__), 'static'), 'show_indexes': True } ),
        (r'^test_api$', direct_to_template, {'template': 'api_scaffold/scaffold.html'}),
        
        (r'^items/delete$', views.delete_all_items),
        
        (r'^users/delete$', views.delete_all_users),
        (r'^users/activate_by_email$', views.activate_user_by_email),
        (r'^users/(\d+)/magic_key$', views.get_user_key),
    )
