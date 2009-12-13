var reyooz = reyooz || { };

reyooz.User = function ( ) {
    
    var controller,
        userLoggedIn = false,
        listItemAfterLogin = false;
    
    function getItemsForUser() {
        var userId = $("input.userId").val();
        $.get("/users/" + userId + "/items", { }, function ( response ) {
            if ( response.success === true ) {
                controller.setItems( response.items );
            } else {
                controller.error( response.errors );
            }
        }, "json");
    }
    
    function closeLoginSignupDialog() {
        $( "#loginSignup" )
            .find( ".password" )
                .val( "" )
            .end() 
            .find( "#newUserEmail" )
                .val( "" )
            .end()
            .find( "#newUserPassword")
                .val( "" )
            .end()
            .find( "#newUserConfirmPassword" )
                .val( "" )
            .end()
            .dialog( "close" );
    };
    
    function openLoginSignupDialog() {
        $("#loginSignup div.privacy:visible").hide();
        $( "#loginSignup" ).dialog( "open" );
        $( ".login .username" ).focus();
    }
    
    function showEditItemsButton() {
        $( "#buttonEditItems" ).removeClass( "hidden" );
    }
    
    function hideEditItemsButton() {
        $( "#buttonEditItems" ).addClass( "hidden" );        
    }
    
    function checkTotalUserItems( id ) {
        $.get("/users/" + id + "/items", { }, function ( response ) {
            if ( response.success === true ) {
                if ( response.items.length !== 0 ) {
                    showEditItemsButton();
                } else {
                    hideEditItemsButton();
                }
            } else {
                controller.error( response.errors );
            }
        }, "json");
    }
    
    function disableLoginButton() {
        $("#loginSignup a.login").addClass("busy");
    }
    
    function enableLoginButton() {
        $("#loginSignup a.login").removeClass("busy");        
    }
    
    function loginUser( e, p ) {
        disableLoginButton();
        
        $.post("/login", { email: e, password: p }, function ( response ) {
            enableLoginButton();

            if ( response.success === true ) {
                userLoggedIn = true;
                $("#loginLogout")
                    .removeClass( "isLoggedOut" )
                    .addClass( "isLoggedIn" )
                    .find( ".loginLogout" )
                        .html("Logout <span class='currentUserEmail'>" + e + "</span><input type='hidden' class='userId' value='" + response.user_id + "' />");
                        
                closeLoginSignupDialog();
                
                controller.setCurrentUserEmail( e );

                checkTotalUserItems( response.user_id );
                
                if ( listItemAfterLogin ) {
                    controller.addItem();
                }
                
            } else {
                controller.error( response.errors, "#loginSignup div.login");
            }
        }, "json");
    }
    
    function logoutUser() {
        $.get("/logout", { }, function ( response ) {
            if ( response.success === true ) {
                userLoggedIn = false;
                $("#loginLogout")
                    .removeClass( "isLoggedIn" )
                    .addClass( "isLoggedOut" )
                    .find( ".loginLogout" )
                        .text("Login");
                        
                controller.setCurrentUserEmail( "" );
                
                hideEditItemsButton();
                        
            } else {
                controller.error( response.errors );
            }
        }, "json");
    }
    
    function confirmSignup( email ) {
        $( "#loginSignup div.signup" ).hide();
        $( "#loginSignup div.confirmation" )
            .find("strong.email")
                .text( email )
            .end()
            .show();
    }
    
    function disableSignupButton() {
        $("#loginSignup a.signup").addClass("busy");
    }
    
    function enableSignupButton() {
        $("#loginSignup a.signup").removeClass("busy");
    }
    
    function newUser( e, p, c ) {
        disableSignupButton();
        $.post("/users/new", { email: e, password: p, confirm_password: c }, function ( response ) {
            enableSignupButton();

            if ( response.success === true ) {
                confirmSignup( e );
            } else {
                controller.error( response.errors, "#loginSignup div.signup" );
            }
        }, "json");
    }
    
    function attachBehaviours() {
        $("#loginLogout a.loginLogout").click(function () {
            if ( userLoggedIn ) {
                logoutUser();
            } else {
                listItemAfterLogin = false;
                openLoginSignupDialog();
            }
        });
        
        $("#loginSignup a.close").click(function () {
            closeLoginSignupDialog();
        });
        
        $("#loginSignup a.login").click(function () {
            if ( !$(this).hasClass("busy") ) {
                loginUser(
                    $("div.login input.username").val(),
                    $("div.login input.password").val()
                );
            }
        });
        
        $(".login input.password").keypress(function (event) {
           if ( event.keyCode === 13 ) {
               $("#loginSignup a.login").click();
           }
        });
        
        $("#loginSignup a.signup").click(function () {
            if ( !$(this).hasClass("busy") ) {
                newUser(
                    $("div.signup input.username").val(), 
                    $("div.signup input.password").val(), 
                    $("div.signup input.passwordConfirm").val()
                );
            }
        });
        
        $("#loginSignup input.passwordConfirm").keypress(function (event) {
            if ( event.keyCode === 13 ) {
                $("#loginSignup a.signup").click();
            }
        });
        
        $("#loginSignup a.ok").click(function () {
            $( "#loginSignup" ).dialog("close");
            $( "#loginSignup div.confirmation").hide();
            $( "#loginSignup div.signup" ).show();
        });
        
        $("#loginSignup a.privacy").click(function () {
            $("div.privacy")
                .find(".content")
                    .html( $("#termsAndConditions .content").html() )
                .end()
                .slideDown( "fast" ); 
        });
        
        $( "#loginSignup div.privacy a.cancel" ).click(function() {
            $( "#loginSignup div.privacy" ).slideUp( "fast" );
        });
    }
    
    function clearErrors() {
        $("input.error, textarea.error").removeClass( "error" );
        $("div.errorMsg, div.invalid, div.valid").remove();
    }
    
    function createDialogs() {
        
        $( "#loginSignup" ).dialog({
            autoOpen: false,
            modal: true,
            width: 946,
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
            userLoggedIn = $("#loginLogout").hasClass("isLoggedIn");
            attachBehaviours();
            createDialogs();
        },
        
        addEventListener: function ( handler ) {
            controller = handler;
        },
        
        loginUserAndListItem: function () {
            listItemAfterLogin = true;
            openLoginSignupDialog();
        },
        
        isLoggedIn: function () {
            return userLoggedIn;
        },
        
        getItems: function () {
            getItemsForUser();
        },
        
        showEditItemsButton: function () {
            showEditItemsButton();
        },
        
        showVerifiedLoginDialog: function ( email ) {
            if ( !userLoggedIn ) {
                $("#loginSignup").dialog( "open" )
                    .find(".loginHeader")
                        .hide()
                    .end()
                    .find(".verification")
                        .show()
                    .end()
                    .find("#loginFormEmail")
                        .val( email )
                    .end()
                    .find("#loginFormPassword")
                        .focus();
            }
        }
    };
};