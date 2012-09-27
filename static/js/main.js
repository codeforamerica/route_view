var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var map;
var cameraMarkerImage, cameraMarkerImageSelected; 
var mapCameras;
$(function(){
    directionsDisplay = new google.maps.DirectionsRenderer({draggable:true});
    var myOptions = {
        center: new google.maps.LatLng(21.3069444, -157.8583333),
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };


    map = new google.maps.Map($("#map")[0], myOptions);
    var trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
    directionsDisplay.setMap(map);


    var defaultBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(21.19, -158.20),
        new google.maps.LatLng(21.76, -157.56));
    
    var options = {
        bounds: defaultBounds,
        types: ['geocode']
    };

    var autocomplete_start = new google.maps.places.Autocomplete($('start')[0], options);
    var autocomplete_end = new google.maps.places.Autocomplete($('end')[0], options);



    cameraMarkerImage = new google.maps.MarkerImage('/static/img/map_pin.png',
                                                       new google.maps.Size(30.0, 44.0),
                                                       new google.maps.Point(0, 0),
                                                       new google.maps.Point(15.0, 44.0));

    cameraMarkerImageSelected = new google.maps.MarkerImage('/static/img/map_pin_selected.png',
                                                       new google.maps.Size(36.0, 50.0),
                                                       new google.maps.Point(0, 0),
                                                       new google.maps.Point(18.0, 50.0));

    google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
        renderCamerasAlongRoute(directionsDisplay.directions)
    });
    $("#end").keypress(function(e){
        if(e.keyCode == 13){
            $("#getdirections").click();
        }
    });
    $("#getdirections").click(function (){
        var start = $("#start").val();
        var end = $("#end").val();
        $("header.slim span.from").text(start);
        $("header.slim span.to").text(end);
        $("#favorited").attr("src", "/static/img/star.png");
        var request = {
            origin:start,
            destination:end,
            travelMode: google.maps.TravelMode.DRIVING
        };
        directionsService.route(request, function(result, status) {
 

            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(result);
            }
        });
    });

    $("#cambtn").click(function(){
        $("#map").hide();
        $("#menu").show();
        $(".btn").removeClass("selected");
        $(this).addClass("selected");

    });
    $("#mapbtn").click(function(){
        $("#map").show();
        $("#menu").hide();
        $(".btn").removeClass("selected");
        $(this).addClass("selected");
    });
    $("#change").click(function(){
        $("header").show();
        $("header.slim").hide();
    });
    $("#cameras img").live("click",function(){
        highlightCamera($(this).attr("id").split("-")[1]);
    });
    $("#showfavs").click(function(){
        $("#container").show();
        $("#routefavs").show();
        $("#nameroute").hide();
    });
    $("#favorited").click(function(){

        $("#container").show();
        $("#routefavs").hide();
        $("#nameroute").show();

//        
    });
    $("#saveRoute").click(function(){
        $("#favorited").attr("src", "/static/img/star_active.png");
        
        saveFavoriteRoute($("#start").val(),
                          $("#end").val(),
                          $("#routename").val());
        renderFavorites();
        $("#routename").val("");
        $("#container").hide();
        $("#routefavs").hide();
        $("#nameroute").hide();

    })
    $("div#cancel").click(function(){
        $("#container").hide();
        $("#routefavs").hide();
        $("#nameroute").hide();
    });
    $("div.close").click(function(){
        $("#container").hide();
        $("#routefavs").hide();
        $("#nameroute").hide();
    });
    $("#exampleroute").click(function(e){
        e.preventDefault();
        $("#start").val("Honolulu, HI");
        $("#end").val("Hawaii-Kai, HI");
        $("#getdirections").click();
    });
    $("div.remove").live("click", function(){
        removeFavoriteRoute($(this).parent().attr("id").split("-")[1]);
        renderFavorites();
    });
    $("li.favroute").live("click", function(){
        $("#start").val($(this).find("span.start").text());
        $("#end").val($(this).find("span.end").text());
        $("#getdirections").click();
        $("#container").hide();
        $("#routefavs").hide();
        $("#nameroute").hide();
    });
    renderFavorites();

});
function renderCamerasAlongRoute(result){
    $("header").attr("style", "");
    
    for(c in mapCameras){
        mapCameras[c].setMap(null);
    }
    mapCameras = [];
    $("#cameras").empty();

    var polyline = new google.maps.Polyline({path:result.routes[0].overview_path});

    $.ajax("/data/cameras.json", {success:function(data){
        var cameras = filterCameras(data, polyline);

        $("#cameras").empty();
        
        cameraOrder =[];
        for(c in cameras){
            cam = cameras[c];
            cam.distance = Math.pow(result.routes[0].legs[0].start_location.lng() - cam.geometry.coordinates[0], 2) 
                + Math.pow(result.routes[0].legs[0].start_location.lat() - cam.geometry.coordinates[1], 2)
            for(c in cameraOrder){
                if(cameraOrder[c].distance > cam.distance){
                    cameraOrder.splice(c, 0,cam)
                    break;
                }else if(c == cameraOrder.length-1){
                    cameraOrder.push(cam)
                }
            }
            if(cameraOrder.length === 0){
                cameraOrder.push(cam);
            }
        }
        for(c in cameraOrder){
            addCamera(cameraOrder[c]);
        }        
    }}, "json");
}


function addCamera(cam){
    var cam_desc = "<div class='cameradesc'>"+cam.description+"</div>";
    $("#cameras").append("<img id='camera-"+cam.id+
                         "' src='/camera?url="+encodeURIComponent(cam.cameraImageURL)+"&time="+
                         (+new Date())+"' />"+cam_desc);
}

function highlightCamera(id){
    for(m in mapCameras){
        cam = mapCameras[m];
        if(cam.id == id){
            cam.setIcon(cameraMarkerImageSelected);
        }else{
            cam.setIcon(cameraMarkerImage);
        }
    }        
}


function filterCameras(cameras, polyline){

    var filtered = [];
    for(c in cameras){
        cam = cameras[c];
        if(google.maps.geometry.poly.isLocationOnEdge(new google.maps.LatLng(cam.geometry.coordinates[1],
                                                                             cam.geometry.coordinates[0]), polyline, 0.00025)){

            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(cam.geometry.coordinates[1],
                                                 cam.geometry.coordinates[0]),
                map: map,
                title:cam.description,
                icon:cameraMarkerImage,
                id:c
            });
            filtered.push($.extend(cam,{id:c}));
            mapCameras.push(marker);
        }   
    }
    return filtered;
}


var cameras = [];
function setCameras(alongRoute){
    for(var i=0;i<cameras.length;i++){
        cameras[i].setMap(null);
    }
    cameras = [];
    
    for(var i=0;i<alongRoute.length;i++){
         var marker = new google.maps.Marker({
             position: new google.maps.LatLng(alongRoute[i].geometry.coordinates[1],
                                              alongRoute[i].geometry.coordinates[0]),
             map: map,
             title:alongRoute[i].description
         });
        cameras.push(marker);
    }
    
}

if (!window.localStorage) {  
    window.localStorage = {  
        getItem: function (sKey) {  
            if (!sKey || !this.hasOwnProperty(sKey)) { return null; }  
            return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));  
        },  
        key: function (nKeyId) { return unescape(document.cookie.replace(/\s*\=(?:.(?!;))*$/, "").split(/\s*\=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]); },  
        setItem: function (sKey, sValue) {  
            if(!sKey) { return; }  
            document.cookie = escape(sKey) + "=" + escape(sValue) + "; path=/";  
            this.length = document.cookie.match(/\=/g).length;  
        },  
        length: 0,  
        removeItem: function (sKey) {  
            if (!sKey || !this.hasOwnProperty(sKey)) { return; }  
            var sExpDate = new Date();  
            sExpDate.setDate(sExpDate.getDate() - 1);  
            document.cookie = escape(sKey) + "=; expires=" + sExpDate.toGMTString() + "; path=/";  
            this.length--;  
        },  
        hasOwnProperty: function (sKey) { return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie); }  
    };  
    window.localStorage.length = (document.cookie.match(/\=/g) || window.localStorage).length;  
}

function saveFavoriteRoute(start, end, name){

    var routes = localStorage.getItem("routes");
    if((routes == null) || (routes == "null")){routes = {};}
    else{routes = JSON.parse(routes);}
    routes[""+(+new Date())] = {start:start,
                                end:end,
                                name:name}

    localStorage.setItem("routes", JSON.stringify(routes));
}
function removeFavoriteRoute(id){
    var routes = localStorage.getItem("routes")
    if((routes == null) || (routes == "null")){return;}
    else{routes = JSON.parse(routes)}
    delete routes[id];
    if(JSON.stringify(routes) == "{}"){
        localStorage.setItem("routes", null);
    }else{
        localStorage.setItem("routes", JSON.stringify(routes));
    }
}
function loadFavoriteRoutes(){
    var routes = localStorage.getItem("routes");
    if((routes == null) || (routes == "null")){return {};}
    else{routes = JSON.parse(routes)}
    return routes;
}

function renderFavorites(){
    $("#routefavs ul").empty();
    routes = loadFavoriteRoutes();
    $("#nofavorites").show();
    for(r in routes){
        route = routes[r];
        $("#nofavorites").hide();
        $("#routefavs ul").append("<li id='route-"+r+"' class='favroute'>"+
                                  "<span class='name'>"+route.name+"</span><br />"+
                                  "<span class='start'>"+route.start+"</span> - <span class='end'>"+route.end+"</span>" +
                                  "<div class='remove'>[X]</div>" +
                                  "</li>");
    }
}