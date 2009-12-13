var a;
$(function() {
    $("div.apiMethod").each(function(i, apiMethod){
        
        var form = $("form", apiMethod)[0];
        var originalAction = form.action;
        
        // Set the <h2> with the form action and method
        var urlPaths = new RegExp("^[a-z].+\://[^/]+(.*)", "i").exec(form.action);
        path = urlPaths[urlPaths.length-1];
        $("h1", apiMethod).after("<h2>" + form.method.toUpperCase() + " " + path +"</h2>");
        
        // When form fields are edited, check if the field name is an "_id" and update form.action with the id
        $("input:text").each(function(i, n){
            $(this).keyup(function(e){
                if (/^.*_id$/i.test(n.name) == true) {
                    
                    // Update action
                    form.action = originalAction.replace(n.name, n.value);
                    
                    // Update h2 (TODO: refactor this!)
                    var urlPaths = new RegExp("^[a-z].+\://[^/]+(.*)", "i").exec(form.action);
                    path = urlPaths[urlPaths.length-1];
                    $("h2", apiMethod).text(form.method.toUpperCase() + " " + path);
                }
            });
        });
        
        // Bind submission click to send form in the background
        $("input:submit", form).click(function(){
            $("#"+form.id).ajaxSubmit({ 
                dataType: "json",
                success: function(obj) {
                    var jsonResponse = "<li class='success'>" + $("h2", apiMethod).text() + "<br/>" + $.toJSON(obj) + "</li>";
                    $("#jsonResponse").append(jsonResponse);
                    $("#jsonResponse")[0].scrollTop = $("#jsonResponse")[0].scrollHeight;
                },
                error: function(XMLHttpRequest) {
                    var jsonResponse = "<li class='error'>" + $("h2", apiMethod).text() + "<br/>" + "Response status: " + XMLHttpRequest.status + "</li>";
                    $("#jsonResponse").append(jsonResponse);
                    $("#jsonResponse")[0].scrollTop = $("#jsonResponse")[0].scrollHeight;
                }
            });
            return false;
        });
    });
});
