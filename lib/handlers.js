
var _data = require('./data');
var helpers = require('./helpers');

var handlers = {};

//This is the list of Menu Items offered to the customer
var menuItems = {
    'LargePizza': {
      'Name' : 'LargePizza',
      'UnitPrice' : 80
    },
    'SmallPizza' : {
      'Name': 'SmallPizza',
      'UnitPrice' : 40
    },
    'MediumPizza' : {
      'Name': 'MediumPizza',
      'UnitPrice' : 60
    },
    'Coke' : {
       'Name': 'Coke',
      'UnitPrice' : 40
    },
    'Pepsi' : {
      'Name': 'Pepsi',
      'UnitPrice' : 40
    }
};

handlers.users = function(data, callback){
    var acceptableMethods = ['get' , 'put' , 'post', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1)
    {
        handlers._users[data.method](data, callback);
    }
    else{
        callback(405);
    }
};

handlers._users = {};

handlers._users.post = function(userdata, callback){
   
    var payload = userdata.payload;
   
    var firstName = typeof(payload.firstName) == 'string'&& payload.firstName.trim().length > 0 ? payload.firstName.trim() : false;
    var lastName = typeof(payload.lastName) == 'string'&& payload.lastName.trim().length > 0 ? payload.lastName.trim() : false;
    var email = typeof(payload.email) == 'string'&& payload.email.trim().length > 0 ? payload.email.trim() : false;
    var streetAddress = typeof(payload.streetAddress) == 'string'&& payload.streetAddress.trim().length > 0 ? payload.streetAddress.trim() : false;    
    var password = typeof(payload.password) == 'string'&& payload.password.trim().length > 0 ? payload.password.trim() : false;
   
    if(helpers.validateEmail(email))
    {      
        if(firstName && lastName && email && streetAddress && password)
        {
            _data.read('users', email, function(err){
                if(err)                {
                    var hashedPassword = helpers.hash(password);

                    if(hashedPassword)
                    {
                        var userobject = {
                            'firstName': firstName,
                            'lastName' : lastName,
                            'email' : email,
                            'streeAddress' : streetAddress,
                            'password' : hashedPassword
                        }              

                        if(err){                      
                            _data.create('users', email, userobject, function(err){
                                if(!err)
                                {
                                    callback(200, {'Message' : 'User created successfully'});
                                }
                                else{
                                    callback(500, {'Error' : 'Could not create the new user'});
                                }
                            });                              
                        }                        
                    }
                    else{
                        callback(500,{'Error' : 'Could not hash the user\'s password.'});
                    }
                }
                else{
                    callback(400, {'Error': 'User alredy exists'});
                }
            });        
        }
    }
    else{
        callback(500,{'Error' : 'Please enter the valid email.'});
    }
};

// Required data: email
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function(userdata, callback){
   
    var payload = userdata.payload;
   
    var firstName = typeof(payload.firstName) == 'string'&& payload.firstName.trim().length > 0 ? payload.firstName.trim() : false;
    var lastName = typeof(payload.lastName) == 'string'&& payload.lastName.trim().length > 0 ? payload.lastName.trim() : false;
    var email = typeof(payload.email) == 'string'&& payload.email.trim().length > 0 ? payload.email.trim() : false;
       
    var password = typeof(payload.password) == 'string'&& payload.password.trim().length > 0 ? payload.password.trim() : false;

    if(helpers.validateEmail(email))
    {      
        if(email){
            if(firstName || lastName || password){

                // Get token from headers
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

                 // Verify that the given token is valid for the phone number
                handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
                if(tokenIsValid){

                // Lookup the user
                _data.read('users',phone,function(err,userData){
                    if(!err && userData){
                    // Update the fields if necessary
                    if(firstName){
                        userData.firstName = firstName;
                    }
                    if(lastName){
                        userData.lastName = lastName;
                    }
                    if(password){
                        userData.hashedPassword = helpers.hash(password);
                    }
                    // Store the new updates
                    _data.update('users',phone,userData,function(err){
                        if(!err){
                        callback(200);
                        } else {
                        callback(500,{'Error' : 'Could not update the user.'});
                        }
                    });
                    } else {
                    callback(400,{'Error' : 'Specified user does not exist.'});
                    }
                });
                } else {
                callback(403,{"Error" : "Missing required token in header, or token is invalid."});
                }
                });
            }
            else{
                callback(400,{'Error' : 'Missing fields to update.'});
            }
        }
        else{
            callback(400,{'Error' : 'Missing required field (email).'});
        }
    }
    else{
        callback(500,{'Error' : 'Please enter the valid email.'});
    }
};

handlers._users.get = function(userdata, callback){
    var email = typeof userdata.queryStringObject.email == 'string' && userdata.queryStringObject.email.trim().length > 0 ? userdata.queryStringObject.email.trim() : false;

    if(email)
    {
        if(helpers.validateEmail(email)){
            _data.read('users', email, function(err, data){
                if(!err && data){
                    var token = typeof userdata.headers.token == 'string'? userdata.headers.token : false;
                    handlers._tokens.verifyToken(token, email, function(verified){
                        if(verified){
                            _data.read('users', email, function(err, data){
                                if(!err && data){
                                    delete data.password;
                                    callback(200, data);
                                }
                                else{
                                callback(404);
                                }
                            });
                        }
                        else{
                            callback(403, {'Error': 'Missing token in the header, or token is invalid'});
                        }
                    });
                }
                else{
                    callback(404, {'Error': 'The user does not exist.'})
                }              
            });

         
        }
        else{
            callback(403, {'Error': 'Email is not valid'});
        }
    }else{
        callback(400, {'Error' : 'Missing email field'});
    }

};

// Required data: email
handlers._users.delete = function(data,callback){
    // Check that phone number is valid
    var email = typeof(data.queryStringObject.email) == 'string' && helpers.validateEmail(email) ? data.queryStringObject.email.trim() : false;
    var password = typeof(data.headers.password) == 'string' ? data.headers.password.trim() : false;
    if(email){
      // Lookup the user
      _data.read('users',email,function(err,data){
        if(!err && data){
                var hashedPassword = data.hashedPassword;
                if(hashedPassword == helpers.hashedPassword(password)){
                _data.delete('users',email,function(err){
                if(!err){
                    callback(200);
                } else {
                    callback(500,{'Error' : 'Could not delete the specified user'});
                }
                });
            }
            else
            {
                callback(400,{'Error' : 'Provide the correct password.'});
            }
        } else {
                callback(400,{'Error' : 'Could not find the specified user.'});
        }
      });      
     
    } else {
      callback(400,{'Error' : 'Missing required field'})
    }
};

handlers.login = function(data, callback){
    var acceptableMethods = ['post'];
    if(acceptableMethods.indexOf(data.method) > -1)
    {
        handlers._login[data.method](data, callback);
    }
    else{
        callback(405);
    }
};

handlers._login = {};

// Login - post
// Required Data: email, password
// Optional Data: none
handlers._login.post = function(data, callback){
    var payload = data.payload;
    var email = typeof payload.email == 'string' && payload.email.trim().length > 0 ? payload.email : false;
    var password = typeof payload.password == 'string' && payload.password.trim().length > 5 ? payload.password : false;
    if(email){
        if(helpers.validateEmail(email))
        {
            //First we need to check if the user exists in the system for the provided email
            handlers._users.get(data, function(code, userdata){

                //If the user does not exist we need to send not found error
                if(typeof code == 'number' && code == 404)
                {
                    callback(404, {'Error': 'There is no user with this email address'});
                }
                else{
                    //If the user exists we need to validate the user against the provided password.
                    _data.read('users', email, function(err, userdata){

                        if(!err && userdata){

                            var hashedPassword = helpers.hash(password);

                            //If the password provided while login is same as the hashed password in the file. Allow the user to
                            //login and create a token for 1 hour
                            if(hashedPassword == userdata.password){

                                //create the object to be sent to token post method
                                var userdata = {}
                                userdata.payload = {
                                    'email': email,
                                    'password': password
                                };

                                handlers._tokens.post(userdata, function(code, data){
                                    if(typeof code == 'number' && code == 200 && data){
                                       
                                        var returnedObject = {
                                            'data': data,
                                            'menuItems': menuItems
                                        }

                                        callback('200', returnedObject);
                                    }
                                    else{
                                        callback(400, {'Error' : 'There was an error creating the token'} );
                                    }
                                });
                            }
                            else{
                                callback(400, {'Error' : 'The password is not valid'} );
                            }
                        }
                    });
                }
            });
        }
        else{
            callback(400, {'Error': 'Please provide the valid email Address'})
        }

    }
    else{
        callback(400, {'Error': 'Please provide the email of the user'});
    }
};

handlers.logout = function(data, callback){
    var acceptableMethods = ['get'];
    if(acceptableMethods.indexOf(data.method) > -1)
    {
        handlers._logout[data.method](data, callback);
    }
    else{
        callback(405);
    }
};

handlers._logout = {};

handlers._logout.get = function(data, callback){
    var email = typeof data.queryStringObject.email == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email : false;
    if(email){
        if(helpers.validateEmail(email))
        {
            _data.read('tokens', data.headers.token, function(err, readdata){
                if(!err && readdata){
                    _data.delete('tokens', data.headers.token, function(err){
                        if(!err){
                            callback(200, {'Message' : 'User Logged out'});
                        }
                        else{
                            callback(400,  {'Error' : 'Error logging out. Please try again'});
                        }
                    })
                }
                else{
                    callback(400, {'Error' : 'Error logging out. Please try again'});
                }
            });
        }else{
            callback(400, {'Error': 'Please provide the valid email id'});
        }
    }
}

handlers._tokens = {};

// Token - post
// Required Data: email, password
// Optional Data: none
handlers._tokens.post = function(userdata, callback){

    var payload = userdata.payload;

    var email = typeof(payload.email) == 'string'&& payload.email.trim().length > 0 ? payload.email.trim() : false;  
    var password = typeof(payload.password) == 'string'&& payload.password.trim().length > 0 ? payload.password.trim() : false;

    if(email && password){
        _data.read('users', email, function(err, userdata){
            if(!err && userdata)
            {
                var hashpwd = helpers.hash(password);
                 
                if(hashpwd == userdata.password)
                {
                    var tokenid = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;

                    var token = {
                        'email': email,
                        'id': tokenid,
                        'expires': expires
                    };

                    _data.create('tokens', tokenid, token, function(err){
                        if(!err)
                        {
                            callback(200, token)
                        }
                        else
                        {
                            callback(500, {'Error': 'Could not create the new token'});
                        }
                    });

                }else {
                    callback(400,{'Error' : 'Password did not match the specified user\'s stored password'});
                }
            }
            else {
                callback(400, {'Error': 'Could not find the specified user'});
            }
        });
    }
    else{
        callback(400, {'Error': 'Missing required fields(s)'});
    }

};

handlers._tokens.get = function(userdata, callback){
    var email = typeof userdata.queryStringObject.email == 'string' && userdata.queryStringObject.email.trim().length > 0 ? userdata.queryStringObject.email.trim() : false;

   
    if(email)
    {
        if(helpers.validateEmail(email)){
            var token = typeof userdata.headers.token == 'string'? userdata.headers.token : false;
            handlers._tokens.verifyToken(token, email, function(verified){
                if(verified){
                    _data.read('users', email, function(err, data){
                        if(!err && data){
                            delete data.hashedPassword;
                            callback(200, data);
                        }
                        else{
                        callback(400);
                        }
                    });
                }
                else{
                    callback(403, {'Error': 'Missing token in the header, or token is invalid'});
                }
            });
        }
        else{
            callback(400, {'Error': 'Email is not valid'});
        }
    }else{
        callback(400, {'Error' : 'Missing email field'});
    }

};

handlers._tokens.put = function(userdata, callback){
   
};

handlers._tokens.delete = function(data,callback){
    // Check that id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    DeleteToken(id, function(code, err){
        callback(code, err);
    })
};

//Method used to delete the token
//Required Data: id
function DeleteToken(id, callback){
    if(id){
        // Lookup the token
        _data.read('tokens',id,function(err,tokenData){
          if(!err && tokenData){
            // Delete the token
            _data.delete('tokens',id,function(err){
              if(!err){
                callback(200);
              } else {
                callback(500,{'Error' : 'Could not delete the specified token'});
              }
            });
          } else {
            callback(400,{'Error' : 'Could not find the specified token.'});
          }
        });
      } else {
        callback(400,{'Error' : 'Missing required field'})
      }
}

handlers._tokens.verifyToken = function(id, email, callback){
    _data.read('tokens', id, function(err, data){
        if(!err && data){
            if(data.email == email && data.expires > Date.now()){
                callback(true);
            }
            else{
                callback(false);
            }
        }
        else{
            callback(false);
        }
    });
};

handlers.items = function(data, callback){
    var acceptableMethods = ['get', 'put', 'post', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._items[data.method](data, callback);
    }
    else
    {
        callback(405);
    }  

}

handlers._items = {};

//The method is used to post the items to the Kart. The item is sent as a part of the query string. The method will be called every time an item is added to the cart.
//MandatoryData: email, token, itemName
handlers._items.post = function(userdata, callback){
    var email = typeof userdata.queryStringObject.email == 'string' && userdata.queryStringObject.email.trim().length > 0 ? userdata.queryStringObject.email.trim() : false;
    var item = typeof userdata.queryStringObject.item == 'string' && userdata.queryStringObject.item.trim().length > 0 ? userdata.queryStringObject.item.trim() : false;
    var cart = userdata.payload.cart;

   
    //If this is the first item the user is adding to the Cart.
    if(typeof cart == 'undefined')
    {
        cart = [];
    }

    if(email)
    {
        if(helpers.validateEmail(email)){
            var token = typeof userdata.headers.token == 'string' ? userdata.headers.token : false;


            handlers._tokens.verifyToken(token, email, function(verified){
                if(verified){

                    //Check if the item is present in the menu items.If present add it to Kart.
                    if(typeof menuItems[item] != 'undefined'){

                        //Add the item to the cart
                        cart.push(menuItems[item]);

                        //Crate an object to be sent back the user for reviewing
                        var cartToSendToUser = {
                            'cart' : cart
                        }

                        callback(200, cartToSendToUser);
                    }
                    else{
                        callback('400', {'Error' : 'Item Not present in the list'});
                    }
                }
                else{
                    callback(403, {'Error': 'Missing token in the header, or token is invalid'});
                }
            });
        }
        else{
            callback(403, {'Error': 'Email is not valid'});
        }
    }else{
        callback(400, {'Error' : 'Missing email field'});
    }
};



handlers.checkout = function(data, callback){
    var acceptableMethods = ['post'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._checkout[data.method](data, callback);
    }
    else
    {
        callback(405);
    }
}

handlers._checkout = {};

//Mandatory: email,token
handlers._checkout.post = function(userdata, callback){
    var email = typeof userdata.queryStringObject.email == 'string' && userdata.queryStringObject.email.trim().length > 0 ? userdata.queryStringObject.email.trim() : false;
    var cart = userdata.payload.cart;

    var orderid = helpers.createRandomString(4);

    //If this is the first item the user is adding to the Cart.
    if(typeof cart != 'undefined')
    {
        if(email)
        {
            if(helpers.validateEmail(email)){
                var token = typeof userdata.headers.token == 'string'? userdata.headers.token : false;
                handlers._tokens.verifyToken(token, email, function(verified){
                    var totalamount = 0;

                   
                    if(verified){
                        cart.forEach(element => {
                            totalamount += element.UnitPrice;
                        });

                       
                        //Make a total amount payment using stripe API
                        helpers.makePayment(totalamount, email, function(status){
                            if(!status){    
                                //If the payment is successful. Send the mail
                                helpers.sendMail(totalamount, orderid, email, function(status){
                                    if(!status){
                                        callback(200, {'Message': 'Payment recieved and message has been sent'});
                                    }
                                });
                            }
                            else{
                                callback(400, {'Error': 'There was some error receiving the payment,Please try again.'});
                            }
                        });
                    }
                    else{
                        callback(403, {'Error': 'Missing token in the header, or token is invalid'});
                    }
                });
            }
            else{
                callback(403, {'Error': 'Email is not valid'});
            }
        }else{
            callback(400, {'Error' : 'Missing email field'});
        }
    }
    else{        
        callback(400, {'Error' : 'The cart is empty'});
    }
}


module.exports = handlers;

