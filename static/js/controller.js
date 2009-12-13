google.load("search", "1");
google.load("maps", "2");

var reyooz = reyooz || { };

// create our ui objects
var layout = reyooz.Layout(),
    map = reyooz.Map(),
    user = reyooz.User(),
    messages = reyooz.Messages(),
    items = reyooz.Items( "#listingsWrapper" ),
    footer = reyooz.Footer(),
    help = reyooz.Help();

// create our controller singleton, this will handle events
reyooz.controller = (function () {
    return {
        error: function ( msg, parentId ) {
            messages.error( msg, parentId );
        },
        
        success: function ( msg ) {
            messages.success( msg );
        },
        
        addItem: function () {
            if ( !user.isLoggedIn() ) {
                user.loginUserAndListItem();
            } else {
                items.addItem();
            }
        },
        
        openAddItemDialog: function () {
            map.attachMiniMapAddItem();
        },
        
        itemAdded: function ( item ) {
            map.showItem( item );
            user.showEditItemsButton();
        },
        
        getItemsForUser: function () {
            user.getItems();
        },
        
        setItems: function ( itemList ) {
            items.setItemsForUser( itemList );
        },
        
        getLatLngFromSearch: function ( search, callback ) {
            map.getLatLngFromSearch( search, callback );
        },
        
        mapMoved: function ( bounds ) {
            items.getItems( bounds );
        },
        
        addItemsToMap: function ( items ) {
           map.addItems( items );
        },
        
        popupItem: function ( id ) {
            map.popupItem( id );
        },
        
        search: function () {
            map.nudge();
        },
        
        mapOverlayChanged: function () {
            map.overlayChanged();
        },
        
        messageSent: function ( msg ) {
            map.closeInfoWindow();
            messages.success( msg );
        },
        
        setCurrentUserEmail: function ( email ) {
            items.setCurrentUserEmail( email );
        },
        
        miniMapAddItemLatLngChange: function ( lat, lng ) {
            items.setAddItemLatLng( lat, lng );
        },
        
        zoomMapOut: function () {
            map.zoomOut();
        }
    };
})();

// inject our controller into our ui objects
map.addEventListener( reyooz.controller );
items.addEventListener( reyooz.controller );
user.addEventListener( reyooz.controller );
footer.addEventListener( reyooz.controller );
help.addEventListener( reyooz.controller );

// on dom ready attach ui object behaviours to events
$(function () {
    // fix pngs
    $( document ).pngFix();
    
    layout.bind();
    
    items.bind();
    
    user.bind();
    
    footer.bind();
    
    help.bind();
    
    if ( user.isLoggedIn() ) {
        items.setCurrentUserEmail( $(".currentUserEmail").text() );
    }
    
    // by this stage the dialogs will no longer be in the dom
    // so can show the remaining components which will have loaded
    $("#loadingWrapper").removeClass( "hidden" );

    // pop the welcome message dialog on page load
    help.showWelcomeDialog();

    // trigger the resize event before binding the map so that
    // it can correctly determine its dimensions
    $( window ).trigger( "resize" );
    map.bind();
    
    // finally, nudge the map so we pickup the markers
    map.nudge();
    
    // check to see if this is a redirect from the verification page
    // if so, popup the signin dialog with a confirmation message
    // http://localhost:8000/?verified=true&email=test2%40test.com#
    
    if ( /\?verified=true&/.test( document.location ) === true ) {
        var email = /&email=(.*)$/.exec( document.location )[1].replace( "%40", "@" ).replace( "#","" );     
        user.showVerifiedLoginDialog( email );
    }
});