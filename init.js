
var http = require('http');
var handlers = require('./lib/handlers');
var StringDecoder = require('string_decoder').StringDecoder;
var helpers = require('./lib/helpers');
var url = require('url');



var server = http.createServer(function(req, res){
    var pu = url.parse(req.url, true);

    var p = pu.pathname;
    var tp = p.replace(/^\/+|\/+$/g, '');
    var qso = pu.query;

    var decoder = new StringDecoder('utf-8');
      var buffer = '';
      
    // Get the HTTP method
    var method = req.method.toLowerCase();
      
    var headers = req.headers;

    req.on('data', function(data){
        buffer += decoder.write(data);
    });

    req.on('end', function(){

        var handler = typeof(router[tp]) !== 'undefined' ? router[tp] : handler.NotFound;

        var userdata = {
            'trimmedPath' : tp,
            'queryStringObject' : qso,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };
        handler(userdata, function(statusCode, payload){

             // Use the payload returned from the handler, or set the default payload to an empty object
             payload = typeof(payload) == 'object'? payload : {};

             // Convert the payload to a string
             var payloadString = JSON.stringify(payload);
    
             // Return the response
             res.setHeader('Content-Type', 'application/json');
             res.writeHead(statusCode);
             res.end(payloadString);            
        });
        
    });
});

server.listen(3000, function(){console.log("Server is listening on port 3000")});

var router = {
    'users' : handlers.users,
    'login': handlers.login,
    'logout': handlers.logout,
    'items': handlers.items,
    'checkout' : handlers.checkout
};

