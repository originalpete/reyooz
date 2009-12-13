from django.core.mail import EmailMessage
from django.shortcuts import render_to_response
import settings
import time
import os

class SendEmailError(Exception):
    pass

class VerificationEmail(object):
    def __init__(self, **kwargs):
        try:
            self.user = kwargs['user']
        except:
            raise SendEmailError("user required.")
    
    def send(self):
        subject = "Please complete your Reyooz sign-up"
        html_content = render_to_response('emails/verification_html.html', {
            'user': self.user,
            'base_url': settings.BASE_URL
        }).content
        
        msg = EmailMessage(subject, html_content, settings.EMAIL_SYSTEM_SENDER, [self.user.email])
        msg.content_subtype = "html"
        
        try:
            if not settings.EMAIL_TEST_MODE: msg.send(fail_silently = False)
            
            else: # save the email to disk for manual inspection
                filename = os.path.join( settings.TEST_EMAIL_DIR, "%s_VerificationEmail.eml" % time.time().__int__().__str__() )
                if not os.path.isdir(settings.TEST_EMAIL_DIR): os.mkdir(settings.TEST_EMAIL_DIR)
                f = open(filename, 'w')
                f.write(msg.message().as_string())
                f.close()
        except Exception, e:
            print "Exception: %s" % e
            raise SendEmailError


class ItemMessageEmail(object):
    def __init__(self, **kwargs):
        try:
            self.message = kwargs['message']
        except:
            raise SendEmailError("message required.")
    
    def send(self):
        subject = "A Reyoozer is interested in \"%s\"" % self.message.item.title
        html_content = render_to_response('emails/item_message_html.html', {
            'message': self.message,
            'base_url': settings.BASE_URL
        }).content
        
        msg = EmailMessage(subject, html_content, settings.EMAIL_SYSTEM_SENDER, [self.message.item.user.email])
        msg.content_subtype = "html"
        
        try:
            if not settings.EMAIL_TEST_MODE: msg.send(fail_silently = False)
            
            else: # save the email to disk for manual inspection
                filename = os.path.join( settings.TEST_EMAIL_DIR, "%s_ItemMessageEmail.eml" % time.time().__int__().__str__() )
                if not os.path.isdir(settings.TEST_EMAIL_DIR): os.mkdir(settings.TEST_EMAIL_DIR)
                f = open(filename, 'w')
                f.write(msg.message().as_string())
                f.close()
        except Exception, e:
            print "Exception: %s" % e
            raise SendEmailError

