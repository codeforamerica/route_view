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
            //console.log(routeToGeoJSON(result.routes[0].overview_path));

            var polyg = bufferLine(routeToGeoJSON(result.routes[0].overview_path))
            drawPolygon(polyg);

            $.ajax("/cameras.json", {success:function(data){
                //console.log(data); 
                var cameras = filterCameras(data, polyg);

                $("#cameras").empty();
    
                cameraOrder =[];
                for(c in cameras){
                    cam = cameras[c];
                    cam.distance = Math.pow(result.routes[0].legs[0].start_location.lng() - cam.geometry[0], 2) 
                        + Math.pow(result.routes[0].legs[0].start_location.lat() - cam.geometry[1], 2)
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
                    $("#cameras").append("<img id='camera-"+c+
                                         "' src='/camera?url="+encodeURIComponent(cameraOrder[c].cameraImageURL)+"&time="+
                                         (+new Date())+"' />");
                }

                //setCameras(data.cameras);
            }}, "json");
            
            


            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(result);
            }
        });
    });
});


function filterCameras(cameras, polygon){

    var filtered = [];

    for(c in cameras){
        cam = cameras[c];
        
        if(isPointInPoly(cam.geometry, polygon)){
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(cam.geometry.coordinates[1],
                                                 cam.geometry.coordinates[0]),
                map: map,
                title:cam.description
            });


            filtered.push(cam);

//            $("#cameras").append("<img src='/camera?url="+encodeURIComponent(cam.cameraImageURL)+"&time="+(+new Date())+"' />")
            cameras.push(marker);
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

function routeToGeoJSON(route){
    var geojson = {"type": "LineString", coordinates: []};
    for(var i =0 ; i < route.length; i++){
        geojson.coordinates.push([route[i].lng(), route[i].lat()]);
    }
    return geojson;
}

function drawPolygon(route){

    path = []
    for(r in route){
        path.push(new google.maps.LatLng(route[r][1], route[r][0]));
    }

    var polyg = new google.maps.Polygon({
        paths: path,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35
    });
    polyg.setMap(map);

}


var bufferLine = function(line){

    var next = null,
        current = null;
    
    distance = 0.00025;

    var side1 = [],
        side2 = [];
    for(var i=0; i<line.coordinates.length; i++){
        current = line.coordinates[i];
        if(i+1 < line.coordinates.length){
            next = line.coordinates[i+1];

            var x_diff = current[0] - next[0];
            var y_diff = current[1] - next[1];

            if((current[0] > next[0]) && (current[1] > next[1])){
                // bottom left
                side1.push([current[0] -distance, current[1] + distance])
                side2.push([current[0] +distance, current[1] - distance])
                addLine([[current[0] -distance, current[1] + distance],
                         [current[0] +distance, current[1] - distance]])
            }else if((current[0] < next[0]) && (current[1] < next[1])){
                //top right
                side1.push([current[0] +distance, current[1] - distance])
                side2.push([current[0] -distance, current[1] + distance])
                addLine([[current[0] +distance, current[1] - distance],
                         [current[0] -distance, current[1] + distance]])
            }else if((current[0] < next[0]) && (current[1] > next[1])){
                // top left
                side1.push([current[0] -distance, current[1] - distance])
                side2.push([current[0] +distance, current[1] + distance])
                addLine([[current[0] -distance, current[1] - distance],
                         [current[0] +distance, current[1] + distance]])

            }else if((current[0] > next[0]) && (current[1] < next[1])){
                //bottom right
                side1.push([current[0] +distance, current[1] + distance])
                side2.push([current[0] -distance, current[1] - distance])
                addLine([[current[0] +distance, current[1] + distance],
                         [current[0] -distance, current[1] - distance]])
            }
        }

    }
    side2.reverse();
    return side1.concat(side2);

};

var addLine = function(coords){
    l = new google.maps.Polyline({
        path: [new google.maps.LatLng(coords[0][1], coords[0][0]),
              new google.maps.LatLng(coords[1][1], coords[1][0])],
        strokeColor: "#00ff00",
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    l.setMap(map);
}

var pointInPolygon = function (point, poly) {
    var x = point.coordinates[1],
    y = point.coordinates[0];
//    poly = polygon; //TODO: support polygons with holes
    for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) {
      var px = poly[i][1],
        py = poly[i][0],
        jx = poly[j][1],
        jy = poly[j][0];
      if (((py <= y && y < jy) || (jy <= y && y < py)) && (x < (jx - px) * (y - py) / (jy - py) + px)) {
        c = [point];
      }
    }
    return c;
}

function isPointInPoly(pt, poly){
    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i][1] <= pt.coordinates[1] && pt.coordinates[1] < poly[j][1]) || (poly[j][1] <= pt.coordinates[1] && pt.coordinates[1] < poly[i][1]))
        && (pt.coordinates[0] < (poly[j][0] - poly[i][0]) * (pt.coordinates[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
        && (c = !c);
    return c;
}