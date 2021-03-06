/**
 * Created by nathan on 4/29/15.
 */
var koa = require("koa");
var faye = require("faye");
var http = require("http");
var serve = require("koa-static");
var serveP = require("koa-file-server");
var clickApp = require("./lib/clickapp");
var clickNode = require("./lib/clicknode");
var fayeRedis = require("faye-redis");
var compress = require('koa-compress');
var cluster = require("cluster");

var bayeux = new faye.NodeAdapter({
    mount: "/ws",
    engine: {
        type: fayeRedis,
        host: "localhost",
        port: 6379
    }
});

if (cluster.isMaster) {
    // cluster.fork();
    // cluster.fork();
    // cluster.fork();
    clickApp.launch(bayeux);
// } else {
    var app = koa();
    if (process.env.NODE_ENV === "production") {
        app.use(serveP({index: true, root: __dirname + "/public"}));
    } else {
        app.use(compress());
        app.use(serve(__dirname + "/public"));
    }

    var server = http.createServer(app.callback());
    bayeux.attach(server);

    clickNode.launch(bayeux);
    server.listen(process.env.PORT||3000, process.env.IP||"0.0.0.0", 128, function(err){
        if (err) throw err;
        console.log("Listening on :%d", server.address().port);
    });
}

