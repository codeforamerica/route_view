var request = require("request");
var express = require("express");
var app = express.createServer();
var fs = require("fs");
//var geonode = require("geonode");

app.use(express.bodyParser());
//app.use(express.logger({ format: ':method :url' }));


//load cameras
var camfile = fs.readFileSync("cameras.json");
var cameras = JSON.parse(camfile);


/*for(c in cameras){
    var cam = cameras[c];
    cam.point = new geonode.Geometry("POINT("+cam.geometry.coordinates[0]+" "+cam.geometry.coordinates[1]+")");
    cam.point.srid = 4326;
}*/

/*var myPoint = new geonode.Geometry("POINT(10 30)");
console.log(myPoint.toWkt()); // "POINT (1.0000000000000000 2.0000000000000000)"

var myPolygon = new geonode.Geometry("POLYGON((0 0, 3 0, 3 3, 0 3, 0 0))");
console.log(myPolygon.contains(myPoint)); // "true"

var myLine = new geonode.Geometry("LINESTRING (30 10, 10 30, 40 40)");

console.log(myLine.buffer(5).toWkt());

console.log(myLine.buffer(5).contains(myPoint));
*/


app.all('/api/cameras', function(req, resp){
    
    var wktline = null;
    wktline = geoJSONToWKT(req.param("route"));

    try{
    
    }catch(e){
        resp.send({error:"bad input"}, 401);
    }
    
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
        console.log(alongRoute);
        //resp.send({a:"a"})
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



