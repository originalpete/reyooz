var reyooz = reyooz || { };

reyooz.Map = function ( ) {
    
    // private variables:
    
    var DEFAULT_ZOOM = 12,
        MINIMAP_DEFAULT_ZOOM = 12,
        searchPostfix = ", UK",
        reyoozIcon,
        currentMapPoint,
        map,
        miniMapAddItem,
        miniMapAddItemMarker,
        markers = { },
        search,
        controller;
    
    // private functions:
    
    function attachMap() {
        if ( google.maps.BrowserIsCompatible() ) {
            map = new google.maps.Map2( $( "#map" ).get(0) );
            map.enableScrollWheelZoom();
            
           if ( google.loader.ClientLocation !== null ) {
                searchPostfix = ", " + google.loader.ClientLocation.address.country;
                currentMapPoint = new google.maps.LatLng(google.loader.ClientLocation.latitude, google.loader.ClientLocation.longitude);
            } else {
                // default to London if we don't have a location
                currentMapPoint = new google.maps.LatLng( 51.5, -0.117 );
            }
            
            map.setCenter(currentMapPoint, DEFAULT_ZOOM);
            map.addControl( new google.maps.LargeMapControl() );
            map.addControl( new google.maps.OverviewMapControl() );
            
            google.maps.Event.addListener(map, "moveend", function() {
                var swBounds = map.getBounds().getSouthWest(),
                    neBounds = map.getBounds().getNorthEast(),
                    bounds = {
                        ne_lat: neBounds.lat(),
                        ne_lng: neBounds.lng(),
                        sw_lat: swBounds.lat(),
                        sw_lng: swBounds.lng()
                    };
                controller.mapMoved( bounds );
                // store the current map center so we can use it elsewhere
                currentMapPoint = map.getCenter();
                // close any open info windows if they are no longer on the map
                var point = map.getInfoWindow().getPoint();
                if ( point && !map.getBounds().containsLatLng( point ) ) {
                    map.closeInfoWindow();
                }
            });
        }
    }
    
    function createCustomMarker() {
        reyoozIcon =  new GIcon(G_DEFAULT_ICON);
        reyoozIcon.image = "/static/img/marker-offered.png";
        reyoozIcon.shadow = "/static/img/shadow-marker-offered.png";
        reyoozIcon.iconSize = new GSize(29, 39);
        reyoozIcon.shadowSize = new GSize(49, 39);
        reyoozIcon.iconAnchor = new GPoint(15, 39);
        //reyoozIcon.infoWindowAnchor = new GPoint(14, 2);
    }
    
    function attachMiniMapAddItem() {
        if ( google.maps.BrowserIsCompatible() ) {
            if ( !miniMapAddItem ) {
                miniMapAddItem = new google.maps.Map2( $("#addItem .map").get(0) );
                miniMapAddItem.setCenter( currentMapPoint, MINIMAP_DEFAULT_ZOOM );
                miniMapAddItem.addControl( new GSmallMapControl() );
                
                miniMapAddItemMarker = new google.maps.Marker( currentMapPoint, { draggable: true, icon: reyoozIcon } );
                
                google.maps.Event.addListener(miniMapAddItemMarker, "dragend", function() {
                    var latlng = miniMapAddItemMarker.getLatLng();
                    controller.miniMapAddItemLatLngChange( latlng.lat(), latlng.lng() );
                });
                
                miniMapAddItem.addOverlay( miniMapAddItemMarker );
            }
            
            miniMapAddItem.setCenter( currentMapPoint, MINIMAP_DEFAULT_ZOOM );
            miniMapAddItemMarker.setLatLng( currentMapPoint );
            controller.miniMapAddItemLatLngChange( currentMapPoint.lat(), currentMapPoint.lng() );
        }
    }
    
    // object returned with public members:
    
    return {
        
        bind: function () {
            search = new google.search.LocalSearch();
            attachMap();
            createCustomMarker();
            $( "body" ).bind( "unload", google.maps.Unload );
        },
        
        addEventListener: function ( handler ) {
            controller = handler;
        },
        
        getLatLngFromSearch: function ( searchTerm, callback ) {
            search.setSearchCompleteCallback( null, function () {
                if ( search.results.length !== 0 ) {
               	    
               	    callback( search.results[0].lat, search.results[0].lng );
               	    var point =  new google.maps.LatLng( search.results[0].lat, search.results[0].lng );
                    miniMapAddItem.setCenter( point );
                    miniMapAddItemMarker.setLatLng( point );
                    controller.miniMapAddItemLatLngChange( search.results[0].lat, search.results[0].lng );
                    
                } else {
                    controller.error( "Cannot find this place.",  "#addItem div.where input.where" );
                }
            });
            search.execute( searchTerm + searchPostfix);
        },
        
        addItems: function ( items ) { 
            $.each(items, function (i, item) {
                if ( markers[ item.id ] === undefined ) {
                    /*var latOffset = 0,
                        lngOffset = 0;
                        
                    // check through current markers to see if we need to declutter
                    $.each(markers, function(j, marker) {
                        if ( item.lat === marker.lat && item.lng === marker.lng ) {
                            latOffset++;
                            lngOffset++;
                        }
                    });*/
                    markers[ item.id ] = item;
                    // create an overlay
                    var point = new google.maps.LatLng( item.lat, item.lng );
                    var m = new google.maps.Marker( point, { icon: reyoozIcon, title: item.title } );

                    google.maps.Event.addListener(m, "click", function() {
                        map.openInfoWindow( point, item.itemOverlayNode );
                    });

                    map.addOverlay( m );
                    // finally store the marker so we can remove it later
                    markers[ item.id ].marker = m;
                }
            });

            $.each(markers, function (i, marker) {
                var markerInList = false;
                $.each(items, function (j, item) {
                    if ( marker.id === item.id ) {
                        markerInList = true;
                    }
                });
                if ( !markerInList ) {
                    map.removeOverlay( marker.marker );
                    delete markers[ marker.id ];
                }
            });
        },
        
        showItem: function ( item ) {
            var point = new google.maps.LatLng(item.lat, item.lng);
            map.setCenter( point, map.getZoom() );
            map.openInfoWindow( point, item.itemOverlayNode );
        },
        
        popupItem: function ( id ) {
            google.maps.Event.trigger( markers[ id ].marker, "click" );
        },
        
        nudge: function () {
            markers = { };
            map.clearOverlays();
            google.maps.Event.trigger(map, "moveend");
        },
        
        overlayChanged: function () {
            map.updateInfoWindow();
        },
        
        closeInfoWindow: function () {
            map.closeInfoWindow();
        },
        
        attachMiniMapAddItem: function () {
            attachMiniMapAddItem();
        },
        
        zoomOut: function () {
            map.setZoom( map.getZoom() - 1 );
        }
    }
};