import re

def respond_to(request):
    return Responder(request)

class Responder(object):
    mime_map = {
        'html' : ('text/html',),
        'js' : (
            'text/javascript',
            'application/javascript',
            'application/x-javascript',
        ),
        'json' : ('application/json','text/json',),
    }
    
    def __init__(self, request):
        """
        Keep an instance copy of the request, and create a 
        reverse-lookup dictionary of acceptable mime types.
        """
        
        self.request = request
        
        # Sanity-check the mime mapping class dict. 
        # Jesus, this would be one line of Ruby.
        self.reverse_mime_map = {}
        for group in self.mime_map.keys():
            for mime_type in self.mime_map[group]:
                if mime_type in self.reverse_mime_map.keys():
                    raise InvalidMimeMapping, "The mime type '%s' is specified in two different groups." % mime_type
                self.reverse_mime_map[mime_type] = group
    
    
    def __getattr__(self, name):
        """
        Treat the attribute name as a mime group name. Return true if the
        requests mime-type matches the group name provided.
        """
        
        if name in self.mime_map.keys():
            matches = []
            for r in self.acceptable_responses():
                if r[0] in self.reverse_mime_map.keys():
                    matches.append(self.reverse_mime_map[r[0]] == name)
            return True in matches
            
        else:
            raise UnrecognisedResponseType, "Response type '%s' is not recognised" % name
    
    def acceptable_responses(self):
        """
        Returns an ordered list of response types that the client will accept.
        """
        
        tokens = self.request.META['HTTP_ACCEPT'].split(',')
        r = re.compile(r'(.*?)(?:\s*;\s*q\s*\=\s*(.*))?$')
        responses = []
        for s in tokens:
            m = r.match(s)
            q = float(m.groups()[1]) if m.groups()[1] else 1.0
            t = m.groups()[0].strip()
            responses.append((t, q))
        
        responses.sort(lambda x, y: cmp(y[1],x[1]))
        return responses

class UnrecognisedResponseType(Exception):
    pass

class InvalidMimeMapping(Exception):
    pass
