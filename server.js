"use strict";

//External Dependencies
var Hapi = require("hapi");
var bodyParser = require('body-parser');

//Internal Dependencies
var Config = require("./Config");
var Routes = require("./Routes");
var Plugins = require("./Plugins");
var Bootstrap = require("./Utils/BootStrap");
var FroalaEditor = require("./Lib/lib/froalaEditor");
var server = new Hapi.Server({
  app: {
    name: Config.APP_CONSTANTS.SERVER.appName
  },
});

server.connection({
  port: Config.APP_CONSTANTS.SERVER.PORTS.HAPI,
  routes: { cors: true }
});

//Register All Plugins
server.register(Plugins, function(err) {
  if (err) {
    server.error("Error while loading plugins : " + err);
  } else {
    server.log("info", "Plugins Loaded");
  }
});

//Default Routes
server.route({
  method: "GET",
  path: "/",
  handler: function(req, res) {
    //TODO Change for production server
    res.view("index");
  }
});

//API Routes
server.route(Routes);

//Connect To Socket.io
Bootstrap.connectSocket(server);

//Bootstrap admin data
Bootstrap.bootstrapAdmin(function(err, message) {
  if (err) {
    console.log("Error while bootstrapping admin : " + err);
  } else {
    console.log(message);
  }
});

//Bootstrap Version data
Bootstrap.bootstrapAppVersion(function(err, message) {
  if (err) {
    console.log("Error while bootstrapping version : " + err);
  } else {
    console.log(message);
  }
});

//Adding Views
server.views({
  engines: {
    html: require("handlebars")
  },
  relativeTo: __dirname,
  path: "./Views"
});

//Games.createIndex({'location': "2dsphere"});

//Start Server
server.start(function() {
  server.log("info", "Server running at: " + server.info.uri);
});
