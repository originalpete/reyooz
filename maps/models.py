from django.db import models
from django.contrib.auth.models import User
from pysolr import Solr, SolrError
import datetime
import settings
import random

class ModelFunctions:
    def simple_dict(self):
        d = self.__dict__.copy()
        for key in d.keys():
            try: d[key] = d[key].encode('utf8', 'replace')
            except AttributeError: d[key] = d[key].__str__()
        return d

# extend Django User model to mixin ModelFunctions
User.__bases__ += (ModelFunctions,)

class Item(models.Model, ModelFunctions):
    user = models.ForeignKey(User)
    title = models.CharField(max_length=255)
    description = models.TextField()
    lat = models.FloatField()
    lng = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null = False)
    
    def __unicode__(self):
        return self.title
    
    def expired(self):
        return datetime.datetime.now().__gt__(self.expires_at)
        
    def expire(self):
        """
        Set item's expiry date to now.
        """
        self.expires_at = datetime.datetime.now()
    
    def relist(self):
        """
        Set item to expire in 2 weeks.
        """
        self.expires_at = datetime.datetime.now() + datetime.timedelta(14,0,0)
    
    def save(self):
        self.updated_at = datetime.datetime.now()
        super(Item, self).save()
        self.solr_save()
    
    def solr_save(self):
        """Save the item to the solr index. Index will be updated if solr_id already exists in the index."""
        if settings.SOLR['running']:
            con = Solr(settings.SOLR_URL)
            docs = [{
                'solr_id': 'Item_' + str(self.id),
                'id': str(self.id),
                'class': 'Item',
                'title_t': self.title,
                'description_t': self.description,
                'lat_f': str(self.lat),
                'lng_f': str(self.lng)
            }]
            con.add(docs)
            return True
        else:
            return False
            
    
    @classmethod
    def find_by_solr(self, q):
        """Search solr index for q and return iterable set of items."""
        if settings.SOLR['running']:
            con = Solr(settings.SOLR_URL)
            solr_results = con.search("(%s) AND class: %s" % (q, 'Item'))
            
            # Convert hits back into models and add to the results list
            results = []
            for doc in solr_results.docs:
                objects = eval(doc['class']).objects.filter(id = doc['id'])
                if objects.__len__() > 0: results.append(objects[0])
                
            return results
        else:
            return []
    
    @classmethod
    def rebuild_index(self):
        """Wipe out and rebuild solr index for this class."""
        if settings.SOLR['running']:
            con = Solr(settings.SOLR_URL)
            con.delete(q = 'solr_id: [* TO *] AND class: %s' % 'Item')
            
            for item in Item.objects.all():
                item.solr_save()
            return True
        else:
            return False


class UserProfile(models.Model):
    magic_key = models.CharField(max_length = 255, blank=True)
    user = models.ForeignKey(User, unique = True)
    signup_ip = models.IPAddressField()
    created_at = models.DateTimeField(auto_now_add = True)
    updated_at = models.DateTimeField(auto_now_add = True)
    
    def save(self):
        self.updated_at = datetime.datetime.now()
        super(UserProfile, self).save()


class ItemMessage(models.Model):
    user = models.ForeignKey(User, null = True)
    item = models.ForeignKey(Item, null = False)
    ip = models.IPAddressField()
    magic_key = models.CharField(max_length = 255, blank=False)
    session_id = models.CharField(max_length = 255, blank = False)
    email = models.EmailField(blank=False)
    message = models.TextField(blank=False)
    is_spam = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)
    
    def save(self):
        self.updated_at = datetime.datetime.now()
        super(ItemMessage, self).save()
    

class FeedbackMessage(models.Model):
    user = models.ForeignKey(User, null = True)
    ip = models.IPAddressField()
    email = models.EmailField(blank=True)
    message = models.TextField(blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    

class Feed(models.Model):
    CLASS_CHOICES = (
        ('ItemFeed', 'Latest items'),
        ('FeedbackFeed', 'Latest feedback'),
        ('ItemMessageFeed', 'Latest item messages'),
    )
    
    feed_class = models.CharField(max_length = 255, blank = False, choices = CLASS_CHOICES)
    uid = models.CharField(max_length = 255)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self):
        self.uid = "%x" % random.randint(10e13,10e14)
        super(Feed, self).save()
        
    def url(self):
        return "%s/feeds/%s" % (settings.BASE_URL, self.uid)

