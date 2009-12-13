var reyooz = reyooz || { };

reyooz.Layout = function () {

    function resize() {
        var headerHeight = $("#header").outerHeight(),
            footerHeight = $("#footer").outerHeight(),
            contentHeight = $(window).height() - headerHeight - footerHeight,
            mapWidth = $("#content").outerWidth() - $("#listingsWrapper").outerWidth(),
            listingsWidth = $("#listingsWrapper").outerWidth();

        $("#mapWrapper")
            .height( contentHeight )
            .width( mapWidth );

        $("#map")
            .height( contentHeight - 20 )
            .width( mapWidth - 40);
            
        $("#mapWrapper .mapLeft, #mapWrapper .mapRight")
            .height( contentHeight - 14 );
            
        $("#mapWrapper .mapTop, #mapWrapper .mapBottom")
            .width( mapWidth - 34);
               
        $("#listingsWrapper")
            .height( contentHeight - 150 );
            
        $("#listings")
            .height( contentHeight - 190 )
            .width( listingsWidth - 30 );
    }
    
    return {
        bind: function () {
            $( window ).bind( "resize", resize );
        }
    };
    
};