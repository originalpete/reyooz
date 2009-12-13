var reyooz = reyooz || { };

reyooz.Help = function ( ) {
    
    var controller;
    
    function createCookie(name,value,days) {
    	if (days) {
    		var date = new Date();
    		date.setTime(date.getTime()+(days*24*60*60*1000));
    		var expires = "; expires="+date.toGMTString();
    	}
    	else var expires = "";
    	document.cookie = name+"="+value+expires+"; path=/";
    }
    
    function readCookie(name) {
    	var nameEQ = name + "=";
    	var ca = document.cookie.split(';');
    	for(var i=0;i < ca.length;i++) {
    		var c = ca[i];
    		while (c.charAt(0)==' ') c = c.substring(1,c.length);
    		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    	}
    	return null;
    }
    
    function attachBehaviours() {
        $("#help a.close").click(function () {
            $( "#help" ).dialog( "close" );
        });
        
        $("#buttonHelp").click(function () {
            $( "#help" ).dialog( "open" );
        });
        
        $('#help a.continue').click(function() {
            $( "#help a.close" ).click();
        });
        
        $("#welcome a.close").click(function () {
            $( "#welcome" ).dialog( "close" );
        });
        
        $("#welcome a.ok").click(function () {
            $( "#welcome" ).dialog( "close" );
        });
        
        $('#welcome a.tellMeMore').click(function() {
            $( "#welcome a.close" ).click();
            $( "#help" ).dialog("open");
        })
    }
    
    function clearErrors() {
        $("input.error, textarea.error").removeClass( "error" );
        $("div.errorMsg, div.invalid, div.valid").remove();
    }
    
    function createDialogs() {
        
        $( "#help" ).dialog({
            autoOpen: false,
            modal: true,
            width: 980,
            height: 520, 
            resizable: false,
            overlay: { 
                background: "black", 
                opacity: 0.5 
            },
            open: function() {
                clearErrors();
            }
        });
        
        $( "#welcome" ).dialog({
            autoOpen: false,
            modal: true,
            width: 800,
            height: 400, 
            resizable: false,
            overlay: { 
                background: "black", 
                opacity: 0.5 
            },
            open: function() {
                clearErrors();
            }
        });
        
    }
    
    return {
        bind: function () {
            attachBehaviours();
            createDialogs();
        },
        
        addEventListener: function ( handler ) {
            controller = handler;
        },
        
        showWelcomeDialog: function () {
            if ( readCookie("showDialog") === null ) {
                $( "#welcome" ).dialog("open");                
            }
            createCookie( "showDialog", "true", 30 );
        }
    };
    
};