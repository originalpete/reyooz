from django.contrib.syndication.feeds import Feed
from django.utils import feedgenerator
from maps.models import Item, ItemMessage, FeedbackMessage
import settings

class ItemFeed(Feed):
    feed_type = feedgenerator.Rss201rev2Feed
    title = "Reyooz items"
    descripion = "Recently added items"
    ttl = '60'
    link = settings.BASE_URL
    
    title_template = "feeds/items_title.html"
    description_template = "feeds/items_description.html"
    
    def item_link(self, obj):
        return "%s/admin/maps/item/%s/" % (settings.BASE_URL, obj.id)
    
    def item_pubdate(self, obj):
        return obj.created_at
    
    def items(self, obj):
        return Item.objects.order_by('-created_at')[:20]


class FeedbackFeed(Feed):
    feed_type = feedgenerator.Rss201rev2Feed
    title = "Reyooz feedback"
    descripion = "Recent user-submitted feedback"
    ttl = '60'
    link = settings.BASE_URL
    
    title_template = "feeds/feedback_title.html"
    description_template = "feeds/feedback_description.html"
    
    def item_link(self, obj):
        return "%s/admin/maps/feedbackmessage/%s/" % (settings.BASE_URL, obj.id)
    
    def item_pubdate(self, obj):
        return obj.created_at
    
    def items(self):
        return FeedbackMessage.objects.order_by('-created_at')[:20]


class ItemMessageFeed(Feed):
    feed_type = feedgenerator.Rss201rev2Feed
    title = "Reyooz item messages"
    descripion = "Recent messages about items"
    ttl = '60'
    link = settings.BASE_URL

    title_template = "feeds/messages_title.html"
    description_template = "feeds/messages_description.html"

    def item_link(self, obj):
        return "%s/admin/maps/itemmessage/%s/" % (settings.BASE_URL, obj.id)

    def item_pubdate(self, obj):
        return obj.created_at

    def items(self, obj):
        return ItemMessage.objects.order_by('-created_at')[:20]
