var request = require("request");
var express = require("express");
var app = express.createServer();
var fs = require("fs");

app.use(express.bodyParser());

//load cameras
var camfile = fs.readFileSync("data/cameras.json");
var cameras = JSON.parse(camfile);


// This is a server side implementation of the search for cameras along a route.
// Currently Route View does this client side
app.all('/api/cameras', function(req, resp){
    
    var wktline = null;
    wktline = geoJSONToWKT(req.param("route"));
    
    if(wktline){
        var routeLine = new geonode.Geometry(wktline);
        routeLine.srid = 4326;
        var buffered = routeLine.buffer(0.00025);
        
        var alongRoute = [];
        for(var i=0; i< cameras.length; i++){
            var cam = cameras[i];
            try{
                console.log("contains ",i, cameras.length, cam.point.toWkt());
                console.log((buffered.contains(cam.point)));

                if(buffered.contains(cam.point)){
                    alongRoute.push({description:cam.description,
                                     imageURL: cam.cameraImageURL,
                                     geometry:cam.geometry});
            }

            }catch(e){
                console.log(e);
            }
        }
        resp.send({cameras:alongRoute});
    }
});


var geoJSONToWKT = function(geojson){

    var wkt = geojson.type.toUpperCase()+"(";
    var points = [];
    for(var i=0; i<geojson.coordinates.length;i++){
        points.push(geojson.coordinates[i].join(" "))
    }
    wkt+=points.join(",")+")";
    return wkt;
}


// This proxy the request to a camera in order to add the referer it expects
app.all('/camera', function(req, resp){

    var url = "http://goakamai.org/"+req.param("url", "");
    req.headers.referer = "http://goakamai.org/Home.aspx";
    var x = request(url)
    req.pipe(x)    
    x.pipe(resp)
});


app.use('/', express.static(__dirname + '/')); 
var port = process.env.PORT || 3005;
app.listen(port, function() {
  console.log("Listening on " + port);
});
