var reyooz = reyooz || { };

reyooz.Footer = function () {
    var controller;
    
    function sendFeedback( e, m ) {
        $.post("/feedback/new", { email: e, message: m }, function ( response ) {
            if ( response.success === true ) {
                controller.success(response.message);
                // alert(response.message);
                $("#feedback").dialog("close");
            } else {
                controller.error( response.errors, "#feedback" );
            }
        }, "json");
    }
    
    function attachBehaviours() {
        
        $("#footer .about").click(function () {
            $("#about").dialog("open");
        });

        $("#about .button.ok").click(function () {
            $("#about").dialog("close");
        });
        
        $("#footer .termsAndConditions").click(function () {
           $("#termsAndConditions").dialog("open");
        });
        
        $("#termsAndConditions .button.ok").click(function () {
            $("#termsAndConditions").dialog("close");
        });
        
        $("#footer .feedback").click(function () {
           $("#feedback").dialog("open");
        });
        
        $("#feedback .button.send").click(function () {
            sendFeedback(
                $("#feedback input.email").val(),
                $("#feedback textarea.message").val()
            );
        });
        
        $( "#feedback a.close").click(function() {
            $("#feedback").dialog("close");
        });
        
        $( "#termsAndConditions a.close" ).click(function() {
            $("#termsAndConditions").dialog("close");
        });
        
        $( "#about a.close" ).click(function() {
            $("#about").dialog("close");
        });
    }
    
    function createDialogs() {
        $("#about, #termsAndConditions").dialog({
            autoOpen: false,
            modal: true,
            width: 640,
            height: 400, 
            resizable: false,
            overlay: { 
                background: "black", 
                opacity: 0.5 
            }
        });
        
        $("#feedback").dialog({
            autoOpen: false,
            modal: true,
            width: 438,
            height: 350, 
            resizable: false,
            overlay: { 
                background: "black", 
                opacity: 0.5 
            },
            open: function() {
                $( "#feedback input:text, #feedback textarea").val("");
                $( "#feedback textarea.message").select();
                $( ".errorMsg" ).remove();
                $( "input.error, textarea.error" ).removeClass("error");  
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
        }
    }
}