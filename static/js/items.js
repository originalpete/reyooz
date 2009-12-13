var reyooz = reyooz || { };

reyooz.Items = function ( node ) {
    
    // private variables:
    
    var controller,
        currentUserEmail = "",
        emptySearchText = "",
        emptyTitleText = "",
        emptyDescriptionText = "",
        editItemLastSelected,
        monthLookup = {
            "01": "Jan",
            "02": "Feb",
            "03": "Mar",
            "04": "Apr",
            "05": "May",
            "06": "Jun",
            "07": "Jul",
            "08": "Aug",
            "09": "Sep",
            "10": "Oct",
            "11": "Nov",
            "12": "Dec"
        },
        dateLookup = {
            "01": "1st",
            "02": "2nd",
            "03": "3rd",
            "04": "4th",
            "05": "5th",
            "06": "6th",
            "07": "7th",
            "08": "8th",
            "09": "9th",
            "10": "10th",
            "11": "11th",
            "12": "12th",
            "13": "13th",
            "14": "14th",
            "15": "15th",
            "16": "16th",
            "17": "17th",
            "18": "18th",
            "19": "19th",
            "20": "20th",
            "21": "21st",
            "22": "22nd",
            "23": "23rd",
            "24": "24th",
            "25": "25th",
            "26": "26th",
            "27": "27th",
            "28": "28th",
            "29": "29th",
            "30": "30th",
            "31": "31st"    
        };
    
    // private functions:
    
    function getItemOverlayHtml( item ) {
        var html = '<div class="viewItem overlay">';
        html += '<div class="image"></div>';
        html += '<div class="details">';
        html += '<h1 type="text" id="viewItemTitle">' + item.title + '</h1>';
        html += '<p id="viewItemDescription">' + item.description + '</p>';
        html += '<a class="contact">Contact this person</a>';
        html += '<div class="contactForm">';
        html += '<input type="hidden" name="item_id" value="' + item.id + '" />';
        html += '<label>Your email address</label>';
        html += '<input id="contactFormEmail" type="text" class="contact email" value="" />';
        html += '<textarea id="contactFormMessage" class="contact message">';
        html += 'Type your message here...';
        html += '</textarea>';
        html += '<fieldset class="buttons">';
        html += '<a class="button send"><div class="left"></div><span class="label">Send</span></a>';
        html += '<a class="cancel"><span>cancel</span></a>';
        html += '</fieldset>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        return html;
    }
    
    function getItemOverlayNode( html ) {
        // build the dom node and attach the event handlers
        // thank god for jquery!
        return $( html )
            .find(".contactForm")
                .hide()
            .end()
            .find("a.contact")
                .click(function () {
                    $( this )
                        .siblings( ".contactForm" )
                            .toggle()
                            .find( ".contact.email" )
                                .val( currentUserEmail )
                                .focus();       
                    controller.mapOverlayChanged();
                })
            .end()
            .find("textarea")
                .click((function () {
                    var clicked = false;
                    return function () {
                        if ( !clicked ) {
                            $( this ).val( "" );
                            clicked = true;
                        }
                    }
                })())
            .end()
            .find("a.cancel")
                .click(function () {
                    $( this ).parents( ".contactForm" ).hide();
                    controller.mapOverlayChanged();
                })
            .end()
            .find("a.send")
                .click(function () {
                    var params = { };
                    params.email = $( this )
                        .parents( ".contactForm" )
                        .find( ".contact.email" )
                        .val();
                    
                    params.item_id = $( this )
                        .parents( ".contactForm" )
                        .find( "input[name='item_id']" )
                        .val();
                    
                    params.message = $( this )
                        .parents( ".contactForm" )
                        .find( ".contact.message" )
                        .val();
                    
                    $.post("/items/" + params.item_id + "/message", params, function ( response ) {
                        if ( response.success === true ) {
                            controller.messageSent(response.message);
                        } else {
                            controller.error( response.errors, "div.viewItem div.contactForm" );
                        }
                    }, "json");    
                })
            .end()
            .get(0);
    }
    
    function getItemsAsArray( itemList ) {
        var items = [ ];
        $.each( itemList, function (i, node) {
            node.item.itemOverlayHtml = getItemOverlayHtml( node.item );
            node.item.itemOverlayNode = getItemOverlayNode( node.item.itemOverlayHtml );
            items.push( node.item );
        } );
        return items;
    }
    
    function getItemsInBounds( bounds ) {
        var params = bounds,
            q = $('#searchWrapper input.search').val();
        
        if ( q !== "" && q !== emptySearchText ) {
            params.q = q;
        }
        
        $.get("/items", params, function ( response ) {
            if ( response.success === true ) {
                var items = getItemsAsArray( response.items );
                
                controller.addItemsToMap( items );
                
                $("#listings ul").html("");
                
                if( items.length === 0 ) {
                    $(".noItemsFound").removeClass("hidden");
                }
                else{
                    $(".noItemsFound").addClass("hidden");
                    $.each( items, function (i, item) { 
                        $("#listings ul").append("<li><a id='" + item.id + "' class='listingsItemLink'><h2>" + item.title  +"</h2><span class='date'>" + prettyDate( item.updated_at ) + "</span></a></li>");
                    });
                }
                
            } else {
                controller.error( response.errors );
            }
        }, "json");
    }
    
    function disableSaveButton() {
        $( "#addItem a.save" ).addClass("busy");
    }
    
    function enableSaveButton() {
        $( "#addItem a.save" ).removeClass("busy");
    }
    
    function saveItem ( t, desc, lat, lng ) {
        disableSaveButton();
        $.post("/items/new", { title: t, description: desc, lat: lat, lng: lng }, function ( response ) {
            enableSaveButton();
            if ( response.success === true ) {
                var item = {
                    id: response.item_id,
                    title: t,
                    description: desc,
                    lat: lat,
                    lng: lng
                };
                item.itemOverlayHtml = getItemOverlayHtml( item );
                item.itemOverlayNode = getItemOverlayNode( item.itemOverlayHtml );
                controller.itemAdded( item );
                $( "#addItem" ).dialog( "close" );
            } else {
                controller.error( response.errors, "#addItem" );
            }
        }, "json");
    }
    
    function openEditItemsDialog( items ) {
        $( "#editItem .myItems ul" ).html("");
        
        $.each(getItemsAsArray( items ), function (i, item) {
            var html = "<li class='" + (item.expired === false ? "active" : "expired");
            html += " id" + item.id;
            html += "'>";
            html += "<h4>" + item.title + "</h4>";
            html += '<input type="hidden" class="description" value="' + item.description + '" />';
            html += "<input type='hidden' class='lat' value='" + item.lat + "' />";
            html += "<input type='hidden' class='lng' value='" + item.lng + "' />";
            html += "<a class='" + (item.expired === false ? "taken'>Taken" : "relist'>Re-list") + "</a>";
            html += "</li>";
            $( "#editItem .myItems ul" ).append( html );
        });

        $("#editItem").dialog("open");       
    }
    
    function clearErrors() {
        $("input.error, textarea.error").removeClass( "error" );
        $("div.errorMsg, div.invalid, div.valid").remove();
    }
    
    function prettyDate(d){
        var result = d.match(/(\d\d\d\d)\-(\d\d)\-(\d\d)\ (\d\d)\:(\d\d)/), minutes = result[5], hours = result[4], day = result[3], month = result[2], year = result[1];
        return dateLookup[day] + " " + monthLookup[month] + " " + hours + ":" + minutes;
    }
    
    function createDialogs() {
        $("#addItem").dialog({
            autoOpen: false,
            modal: true,
            width: 620,
            height: 400, 
            resizable: false,
            overlay: { 
                background: "black", 
                opacity: 0.5 
            },
            open: function () {
                clearErrors();
                
                controller.openAddItemDialog();
                $( "#addItem input.where" ).val("").focus();
                $( "#addItem div.what textarea.description" ).addClass( "descriptionEmpty" ).val( emptyDescriptionText );
                $( "#addItem div.what input.title" ).addClass( "titleEmpty" ).val( emptyTitleText );
            }
        });
        
        $("#editItem").dialog({
            autoOpen: false,
            modal: true,
            width: 340,
            height: 400, 
            resizable: false,
            overlay: { 
                background: "black", 
                opacity: 0.5 
            },
            open: function() {
                clearErrors();
                
                if ( editItemLastSelected ) { 
                    $( "#editItem ul li.id" + editItemLastSelected + " h4" ).bubble("click");
                } else {
                    $( "#editItem ul li:first h4" ).bubble("click");
                }
            },
            close: function() {
                map.nudge();
            }
        });
    }
    
    function attachBehaviours() {
        
        $( "#buttonAddItem" ).click(function () {
            controller.addItem();
        });
        
        $( "#buttonEditItems").click(function () {
            controller.getItemsForUser();
        });
        
        $( "#addItem .cancel, #addItem .close" ).click(function () {
            $( "#addItem" ).dialog( "close" );
        });
        
        $( "#addItem a.search" ).click(function () {
            if ($("#addItem input.where").val() !== "") {
                controller.getLatLngFromSearch($("#addItem input.where").val(), function(lat, lng){
                    $("#addItem input.itemLat").val(lat);
                    $("#addItem input.itemLng").val(lng);
                });
            }
        });
        
        $('#addItem input.where, #addItem a.search').keyup(function( event ) {
            if (event.keyCode === 13) {
                controller.getLatLngFromSearch( $("#addItem input.where").val(), function (lat, lng) {
                    $("#addItem input.itemLat").val( lat );
                    $("#addItem input.itemLng").val( lng );
                });
            }
        });
        
        $("#addItem input.where").blur(function() {
            $( "#addItem a.search" ).click();
        });
        
        $( "#addItem a.save" ).click(function () {
            if ( !$(this).hasClass("busy") ) {
                saveItem(
                    $("#addItem input.title").val(),
                    $("#addItem textarea.description").val(),
                    $("#addItem input.itemLat").val(),
                    $("#addItem input.itemLng").val()
                );
            }
        });
        
        emptyDescriptionText = $( "#addItem div.what textarea.description" ).val();
        $( "#addItem div.what textarea.description" )
            .focus(function () {
                if ( $(this).hasClass("descriptionEmpty") ) {
                    $(this).val("").removeClass("descriptionEmpty");
                }
            })
            .keyup(function() {
                $("#addItem div.preview p.description").text( $(this).val() );
            });
        
        emptyTitleText = $( "#addItem div.what input.title" ).val();
        $( "#addItem div.what input.title" )
            .focus(function () {
                if ( $(this).hasClass("titleEmpty") ) {
                    $(this).val("").removeClass("titleEmpty");
                }
            })
            .keyup(function() {
                $("#addItem div.preview h4").text( $(this).val() );
            });
            
        $( "#editItem a.close, #editItem a.cancel" ).click(function () {
            $( "#editItem" ).dialog( "close" );
        });

        $( "#searchWrapper input.search, #searchWrapper a.search" ).keyup(function ( event ) {
            if ( event.keyCode === 13 ) {
                controller.search();
            }
        });
        
        $( "#searchWrapper a.search" ).click(function () {
            controller.search();
        });
        
        // get the value here as this will only be run on dom ready
        emptySearchText = $( "#searchWrapper input.search" ).val();
        $( "#searchWrapper input.search" )
            .focus(function () {
                if ( $( this ).hasClass( "searchEmpty" ) ) {
                    $( this ).val( "" ).removeClass( "searchEmpty" );
                }
            })
            .blur(function () {
                if ( $( this ).val().replace( / /g, "" ) === "" ) {
                    $( this ).addClass( "searchEmpty" ).val( emptySearchText );
                }
            });
        
        // use event delegation so we pickup new events even when dom elements
        // are added on the fly. woohoo event delegation baby!
        $("#listings ul").click($.delegate({
            // test for all 3 elements that could throw event because of delegation
            "h2, span": function () {
                controller.popupItem( $( this ).parent("a").attr("id") );
            },
            "a": function() {
                controller.popupItem( $(this).attr("id") );
            }
        }));
        
        $("a.zoomOut").click(function() {
            controller.zoomMapOut();
        });
        
        $("#editItem .myItems ul").click($.delegate({
            'a.taken': function () {
                var id = $(this)
                    .parent("li")
                        .siblings("li.selected")
                            .removeClass("selected")
                        .end()
                    .addClass("selected")
                    .attr("class").match( /id(\d+)/ )[1];
                
                editItemLastSelected = id;    
                
                $.post("/items/" + id + "/expire", { }, function ( response ) {
                    if ( response.success === true ) {
                        controller.getItemsForUser();    
                    } else {
                        controller.error( response.errors );
                    }
                }, "json");
            },
            
            'a.relist': function () {
                var id = $(this)
                    .parent("li")
                        .siblings("li.selected")
                            .removeClass("selected")
                        .end()
                    .addClass("selected")
                    .attr("class").match( /id(\d+)/ )[1];

                editItemLastSelected = id;    

                $.post("/items/" + id + "/relist", { }, function ( response ) {
                    if ( response.success === true ) {
                        controller.getItemsForUser();
                    } else {
                        controller.error( response.errors );
                    }
                }, "json");
            },
            
            'h4': function () {
                var id = $(this)
                    .parent("li")
                        .siblings("li.selected")
                            .removeClass("selected")
                        .end()
                    .addClass("selected")
                    .attr("class").match( /id(\d+)/ )[1];
                
                editItemLastSelected = id;
            }
        }));
    }
      
    return {
        bind: function () {
            attachBehaviours();
            createDialogs();
        },
        
        addEventListener: function ( handler ) {
            controller = handler;
        },
        
        addItem: function () {
            $("#addItem").dialog("open");
        },
        
        getItems: function ( bounds ) {
            getItemsInBounds( bounds );
        },
        
        setCurrentUserEmail: function ( email ) {
            currentUserEmail = email;
        },
        
        setItemsForUser: function ( items ) {
            openEditItemsDialog( items );
        },
        
        setAddItemLatLng: function ( lat, lng ) {
            $("#addItem input.itemLat").val( lat );
            $("#addItem input.itemLng").val( lng );
        }
        
    };
};