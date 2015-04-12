var SSDP = require('node-ssdp');
var http = require('http');
var url = require('url');
var fs = require('fs');
var express = require('express');
var Handlebars = require('handlebars');

var config = {
  ip: '192.168.1.5',
  port: 49153,
  serial_number: '221422K01023B'
};

var ssdpServer = new SSDP.Server({
    log: true,
    logLevel: 'error',
    udn : 'uuid:Socket-1_0-' + config.serial_number,
    ssdpSig: 'Linux/2.6.21, UPnP/1.0, Portable SDK for UPnP devices/1.6.18',
    description : 'Belkin Plugin Socket 1.0',
    location : 'http://' + config.ip + ':' + config.port + '/setup.xml'
});

ssdpServer.addUSN('upnp:rootdevice');
ssdpServer.addUSN('urn:Belkin:device:controllee:1');
ssdpServer.addUSN('urn:Belkin:service:basicevent:1');

ssdpServer.on('advertise-alive', function (headers) {
  // Expire old devices from your cache.
  // Register advertising device somewhere (as designated in http headers heads)
});

ssdpServer.on('advertise-bye', function (headers) {
  // Remove specified device from cache.
});


var httpServer = express();

httpServer.all('/:file', function(req, res) {
  var path = __dirname + '/public/' + req.params.file;

  fs.readFile(path, 'utf8', function (err, content) {
    if (err) {
      console.log(err);
      return res.send('<html><body><h1>400 Bad Request</h1></body></html>');
    }
    var template = Handlebars.compile(content);
    var data = config;

    res.setHeader("Content-Type", "text/xml");
    res.setHeader("SERVER", "Linux/2.6.21, UPnP/1.0, Portable SDK for UPnP devices/1.6.18");
    res.setHeader("X-User-Agent", "redsonic");

    res.send(template(data));
  });
});

httpServer.listen(config.port, '0.0.0.0', function () {
  console.log('http server listening');

});

ssdpServer.start(); // ssdpHost, upnpServer.port
