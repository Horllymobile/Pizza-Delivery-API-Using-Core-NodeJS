var fs = require('fs');
var path = require('path');

var lib = {};

lib.baseDir = path.join(__dirname,'/../data/');

lib.create = function(dir, file, data, callback){
    var fileName = lib.baseDir+dir+'/'+file+'.json';

    fs.open(fileName, 'wx', function(err, fileDescription){     

        if(!err && fileDescription){            
            var stringData = JSON.stringify(data);
            fs.writeFile(fileDescription, stringData, 'utf-8', function(err){
                if(!err){
                    fs.close(fileDescription, function(err){
                        if(!err){
                            callback(false);
                        }
                        else
                        {
                            callback('error closing new file');
                        }
                    });
                }
                else{
                    console.log(err);
                    callback('Error writing to new file');
                }
            });
        }
        else{
            console.log(err);
            callback('Could not create new file, it may already exist');
        }
    });
};

lib.read = function(dir, file, callback){
    var fileName = lib.baseDir+dir+'/'+file+'.json';
    fs.readFile(fileName, 'utf-8', function(err, data){
        if(!err && data){
            var parsedData = JSON.parse(data);
            callback(false, parsedData);
        }
        else{
            callback(err,data);
        }
    })
};

lib.delete = function(dir, file, callback){
    var fileName = lib.baseDir+dir+'/'+file+'.json';
    fs.unlink(fileName, function(err){
        callback(err);
    });
}

module.exports = lib;
