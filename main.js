var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var map;
$(function(){
    directionsDisplay = new google.maps.DirectionsRenderer();
    var myOptions = {
        center: new google.maps.LatLng(21.3069444, -157.8583333),
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map($("#map")[0], myOptions);
    var trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
    directionsDisplay.setMap(map);

    $("#getdirections").click(function (){
        var start = $("#start").val();
        var end = $("#end").val();
        var request = {
            origin:start,
            destination:end,
            travelMode: google.maps.TravelMode.DRIVING
        };
        directionsService.route(request, function(result, status) {
            console.log(routeToGeoJSON(result.routes[0].overview_path));

            
            $.ajax("/api/cameras", {data:{route:routeToGeoJSON(result.routes[0].overview_path)},
                                    success:function(data){
                                        console.log(data); 
                                        setCameras(data.cameras);
                                    }}, "json");
            
            


            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(result);
            }
        });
    });
});

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

function routeToGeoJSON(route){

    var geojson = {"type": "LineString", coordinates: []};
    for(var i =0 ; i < route.length; i++){
        geojson.coordinates.push([route[i].lng(), route[i].lat()]);
    }
    return geojson;
}

