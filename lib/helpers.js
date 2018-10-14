
var config = require('./config');
var crypto = require('crypto');
var querystring = require('querystring');
var https = require('https');

var helpers = {};

helpers.hash = function(password){
    if(typeof password == 'string' && password.length > 0){
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(password).digest('hex');
        return hash;
    }
};

helpers.parseJsonToObject = function(payload){
    try{
        var object = JSON.parse(payload);
        return object;
    }
    catch(e){
        return {};
    }
};

helpers.validateEmail = function(email){    
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
    {
        return (true)
    }
    return (false);
}

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength){
      // Define all the possible characters that could go into a string
      var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
 
      // Start the final string
      var str = '';
      for(i = 1; i <= strLength; i++) {
          // Get a random charactert from the possibleCharacters string
          var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
          // Append this character to the string
          str+=randomCharacter;
      }
      // Return the final string
      return str;
    } else {
      return false;
    }
  };

helpers.makePayment = function(amount, email, callback){
    var amount = typeof amount == 'number' && amount > 0 ? amount : false;
    var email1 = typeof email == 'string' && this.validateEmail(email) ? email : false;

    if(amount && email1){
        // Configure the request payload
        var payload = {
          'amount' : amount,
          'currency' : 'usd',
          'source' : 'tok_visa',
          'description' : 'Charge for ' + email1
        };
        var stringPayload = querystring.stringify(payload);
   
   
        console.log("Sstripe" + config.stripeKey);
        // Configure the request details
        var requestDetails = {
          'protocol' : 'https:',
          'hostname' : 'api.stripe.com',
          'method' : 'POST',
          'path' : '/v1/charges',
          'auth' : config.stripeKey,
          'headers' : {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload)
          }
        };

         // Instantiate the request object
        var req = https.request(requestDetails,function(res){          
            // Grab the status of the sent request
            var status =  res.statusCode;
            // Callback successfully if the request went through          
            if(status == 200 || status == 201){
                callback(false);
            } else {
                console.log(status);
                callback('Status code returned was '+ status);
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on('error',function(e){
            console.log(e);
        });

        // Add the payload
        req.write(stringPayload);

        // End the request
        req.end();
    }
    else {
        callback('Given parameters were missing or invalid');
      }

};

helpers.sendMail = function(amount, orderID, email, callback){
    var amount = typeof amount == 'number' && amount > 0 ? amount : false;
    var toEmail = typeof email == 'string' && this.validateEmail(email) ? email : false;

    var text = 'Hi, We Have recieved an amount of ' + amount + ' for you order ' + orderID + ' Thank you';
 
    if(amount && toEmail){
          // Configure the request payload
        var payload = {
            'from' : config.mailgun.sender,
            'to' : toEmail,
            'subject' : 'Payment Recieved for Your Order' + orderID,
            'text' : text
        }
        var stringPayload = querystring.stringify(payload);
   
        // Configure the request details
        var requestDetails = {
          'protocol' : 'https:',
          'hostname' : 'api.mailgun.net',
          'method' : 'POST',
          'path' : '/v3/'+config.mailgun.domainName+'/messages',
          'auth' : config.mailgun.apiKey,
          'headers' : {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload)
          }
        };

         // Instantiate the request object
        var req = https.request(requestDetails,function(res){          
            // Grab the status of the sent request
            var status =  res.statusCode;
            // Callback successfully if the request went through          
            if(status == 200 || status == 201){
                callback(false);
            } else {
                callback('Status code returned was '+status);
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on('error',function(e){
           callback(e);
        });

        // Add the payload
        req.write(stringPayload);

        // End the request
        req.end();
    }
    else {
        callback('Given parameters were missing or invalid');
      }

};

module.exports = helpers;

