var reyooz = reyooz || { };

reyooz.Messages = function () {
    return {
        error: function ( msg, parentId ) {
            $( "input.error, textarea.error" ).removeClass( "error" );
            $( "#error" ).text("");
            $( "div.errorMsg, div.invalid").remove();
            
            $.each( msg, function(elClass, message) {
                if( elClass !== "__all__" ) {
                    $( parentId + " input." + elClass + ", " + parentId + " textarea." + elClass )
                        .addClass( "error" )
                        .select()
                        .after( '<div class="errorMsg">' + message + '</div>' )
                        ;
                    
                    //var parentTop = $( parentId + " input." + elClass ).position();
                    //var elTop = parentTop.top + 5;
                    //$( parentId ).after( '<div class="invalid" style="top:' + elTop + 'px;" title="'+ message +'"></div>' );
                }
                else {
                    if( message.length !== 0 ) {
                        $( "#error" ).html( "<p>" + message[0] + "</p>" ).fadeIn("fast", function() {
                            setTimeout( function() {
                                $( "#error" ).hide();
                            }, 5000);
                        });
                        $( parentId + " input:first").select();
                    }
                }
            });
        },
        success: function ( msg ) {
            $( "#success" ).html( "<p>" + msg + "</p>" ).fadeIn("fast", function() {
                setTimeout( function() {
                    $( "#success" ).fadeOut();
                }, 3000);
            });
        }
    }
};