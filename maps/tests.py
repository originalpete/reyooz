from django.test import TestCase
from django.test.client import Client
from django.utils import simplejson as json
from maps.models import User, UserProfile, Item

from settings import *

class ItemTest(TestCase):
    def setUp(self):
        self.client = Client()

        peter = User.objects.create(username="peter")
        
        Item.objects.create(user=peter, title='', description='', lat=0, lng=0)
        Item.objects.create(user=peter, title='', description='', lat=0.5, lng=0.5)
        Item.objects.create(user=peter, title='', description='', lat=0.999, lng=0.999)
        Item.objects.create(user=peter, title='', description='', lat=1, lng=1)
        Item.objects.create(user=peter, title='', description='', lat=1.00001, lng=1.00001)
        
    def testGetItemsShouldWork(self):
        response = self.client.get('/items')
        self.assertEquals(response.status_code, 200)
        
    def testGetItemsInsideBounds(self):
        response = self.get_items_in_bounds( (0.0, 0.0, 1.0, 1.0) )
        items = json.loads(response.content)
        self.assertEquals(items['items'].__len__(), 4)
        
        response = self.get_items_in_bounds( (0.0, 0.0, 1.1, 1.1) )
        items = json.loads(response.content)
        self.assertEquals(items['items'].__len__(), 5)
    
    # Helper methods
    def get_items_in_bounds(self, bounds=()):
        params = {
            'sw_lat': bounds[0],
            'sw_lng': bounds[1],
            'ne_lat': bounds[2],
            'ne_lng': bounds[3]
        }
        return self.client.get("/items", params)
