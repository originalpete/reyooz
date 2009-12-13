# Django settings for reyooz project.
import os.path
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'vendor'))

# These settings can be over-ridden in settings_local.py
# -----------------------------------------------------------------------------------------
DEBUG = True

DATABASE_ENGINE = 'sqlite3'
DATABASE_NAME = os.path.join(os.path.dirname(__file__), 'db', 'reyooz.db')
DATABASE_USER = ''             # Not used with sqlite3.
DATABASE_PASSWORD = ''         # Not used with sqlite3.
DATABASE_HOST = ''             # Set to empty string for localhost. Not used with sqlite3.
DATABASE_PORT = ''             # Set to empty string for default. Not used with sqlite3.
#DATABASE_OPTIONS = {"init_command": "SET storage_engine=INNODB"}

TEST_DATABASE_NAME = os.path.join(os.path.dirname(__file__), 'db', 'reyooz_test.db')

# key for http://localhost
GOOGLE_MAPS_API_KEY = "ABQIAAAA7UXt6nJtFzIZRfLLEed_dBT2yXp_ZAY8_ufC3CFXhHIE1NvwkxTVwHA_dWaSbmegeAgXEMYKQ-AFaw"

SOLR_URL = 'http://localhost:8983/solr'     # Note: This option does not control how Solr is started!
BASE_URL = 'http://localhost:8000'          # e.g. 'http://reyooz.example.com

# Email settings
EMAIL_TEST_MODE = True
EMAIL_HOST = 'localhost'
EMAIL_HOST_PASSWORD = ''
EMAIL_HOST_USER = ''
EMAIL_PORT = 25
EMAIL_USE_TLS = False
EMAIL_SYSTEM_SENDER = 'Reyooz <noreply@localhost>'

ADMINS = (
    ('Admin', 'admin@local'),
)

# -----------------------------------------------------------------------------------------

try:
    from settings_local import *
    print "Loaded setings_local.py"
except ImportError:
    print "Couldn't find settings_local.py, no settings overridden."
    
MANAGERS = ADMINS

TIME_ZONE = 'Europe/London'

TEMPLATE_DEBUG = DEBUG

LANGUAGE_CODE = 'en-gb'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = ''

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = ''

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/media/'

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'BIGSECRET'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.load_template_source',
    'django.template.loaders.app_directories.load_template_source',
#     'django.template.loaders.eggs.load_template_source',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
#    'django.contrib.csrf.middleware.CsrfMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.middleware.doc.XViewMiddleware',
)

ROOT_URLCONF = 'reyooz.urls'

TEMPLATE_DIRS = (
    os.path.join(os.path.dirname(__file__), 'maps', 'templates'),
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.admin',
    'maps',
)

STATIC_DOCUMENT_ROOT = os.path.join(os.path.dirname(__file__), 'static')

TEST_EMAIL_DIR = os.path.join(os.path.dirname(__file__), 'tmp', 'test_emails')

AUTH_PROFILE_MODULE = 'maps.UserProfile'

SESSION_COOKIE_NAME = 'sessionid'

# Check if Solr is running
try:
    import socket
    from pysolr import Solr, SolrError
    conn = Solr(SOLR_URL)
    conn.search('default: test', rows=1)
    SOLR = {'running': True}
    print "Solr is running."

except socket.error:
    SOLR = {'running': False}
    print "Error: Solr is not running."

except SolrError:
    SOLR = {'running': False}
    print "Error: Solr is running but could not search. Check settings.SOLR_URL."
