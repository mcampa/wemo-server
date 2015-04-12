var SSDP = require('node-ssdp');
var http = require('http');
var url = require('url');
var fs = require('fs');
var express = require('express');
var Handlebars = require('handlebars');

var config = {
  ip: '192.168.1.2',
  port: 49052,
  serialNumber: '221422K01024A',
  friendlyName: 'Garage'
};

var ssdpServer = new SSDP.Server({
    log: true,
    logLevel: 'error',
    udn : 'uuid:Socket-1_0-' + config.serialNumber,
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

var parseBody = function(req, res, next) {
  var contentType = req.headers['content-type'] || ''
    , mime = contentType.split(';')[0];
  if (mime != 'text/plain') {
    // return next();
  }
  var data = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {
    req.rawBody = data;
    next();
  });
};

// httpServer.disable('etag');
// httpServer.disable('x-powered-by');
// httpServer.disable('connection');

httpServer.all('/:file', function(req, res) {
  var path = __dirname + '/public/' + req.params.file;

  console.log(path);
  // console.log(req.headers);
  console.log(req.connection.remoteAddress);

  fs.readFile(path, 'utf8', function (err, content) {
    if (err) {
      console.log('404 ' + path);
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


httpServer.post('/upnp/control/firmwareupdate1', parseBody, function(req, res) {
  console.log('------------firmwareupdate1--------------');
  console.log(req.headers);
  console.log(req.rawBody);
  var output = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body>\n'
    + '<u:GetFirmwareVersionResponse xmlns:u="urn:Belkin:service:firmwareupdate:1">\n'
    + '<FirmwareVersion>FirmwareVersion:WeMo_US_2.00.2176.PVT|SkuNo:Plugin Device</FirmwareVersion>\n'
    + '</u:GetFirmwareVersionResponse>\n'
    + '</s:Body> </s:Envelope>';

  res.setHeader('CONTENT-LENGTH', 361);
  res.setHeader('CONTENT-TYPE', 'text/xml; charset="utf-8"');
  res.setHeader('DATE', 'Sun, 12 Apr 2015 02:15:34 GMT');
  res.setHeader('EXT', '');
  res.setHeader('SERVER', 'Linux/2.6.21, UPnP/1.0, Portable SDK for UPnP devices/1.6.18');
  res.setHeader('X-User-Agent', 'redsonic');

  res.send(output);
});

// httpServer.use('*', require('express-http-proxy')('192.168.1.12', {
//   port: 49152,

//   forwardPath: function(req, res) {
//     var url = req.originalUrl;
//     console.log('proxy to' + url)
//     return url;
//   }
// }));

httpServer.all('*', function(req, res) {
  console.log('---------------------^--------------')
  console.log(req.path);
  console.log(req.headers);
});

httpServer.listen(config.port, '0.0.0.0', function () {
  console.log('listening on http://' + config.ip + ':' + config.port + '/setup.xml');
});

ssdpServer.start(); // ssdpHost, upnpServer.port
