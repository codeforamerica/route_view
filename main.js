var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var map;
var cameraMarkerImage; 
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



    cameraMarkerImage = new google.maps.MarkerImage('/map_pin.png',
                                                       new google.maps.Size(30.0, 44.0),
                                                       new google.maps.Point(0, 0),
                                                       new google.maps.Point(15.0, 44.0)
                                                      );


    google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
        renderCamerasAlongRoute(directionsDisplay.directions)
    });

    $("#getdirections").click(function (){
        var start = $("#start").val();
        var end = $("#end").val();
        $("header.slim span.from").text(start);
        $("header.slim span.to").text(end);
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


});
function renderCamerasAlongRoute(result){
    $("header").attr("style", "");
    
    for(c in mapCameras){
        mapCameras[c].setMap(null);
    }
    mapCameras = [];
    $("#cameras").empty();

    console.log(result);
    
    var polyline = new google.maps.Polyline({path:result.routes[0].overview_path});

    $.ajax("/cameras.json", {success:function(data){
        //console.log(data); 
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
                icon:cameraMarkerImage
            });
            filtered.push(cam);
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
