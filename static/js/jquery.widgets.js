// event delegate functionality taken from dan webb 
// http://www.danwebb.net/2008/2/8/event-delegation-made-easy-in-jquery
jQuery.delegate = function ( rules ) {
    return function ( e ) {
        var target = $( e.target );
        for ( var selector in rules ) {
            if ( target.is( selector ) ) { 
                return rules[selector].apply( target.get(0), $.makeArray(arguments) );
            }
        }
    };
};