from django.contrib import admin
from maps.models import Item, ItemMessage, FeedbackMessage, UserProfile, Feed

class ItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'expires_at', 'user', 'title', 'description', )
admin.site.register(Item, ItemAdmin)

class ItemMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'user', 'item', 'ip', 'email', 'message', )
    list_filter = ('is_spam',)
admin.site.register(ItemMessage, ItemMessageAdmin)

class FeedbackMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'user', 'email', 'message')
admin.site.register(FeedbackMessage, FeedbackMessageAdmin)

class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'user', 'magic_key', 'signup_ip')
admin.site.register(UserProfile, UserProfileAdmin)

class FeedAdmin(admin.ModelAdmin):
    fields = ('feed_class',)
    list_display = ('id', 'feed_class', 'url', 'created_at',)
admin.site.register(Feed, FeedAdmin)
