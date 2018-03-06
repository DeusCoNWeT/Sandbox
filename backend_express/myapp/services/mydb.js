const config = require('../config.json');
var mongoose = require('mongoose');
const host = config.mongodb.host;
const user = config.mongodb.user;
const password = config.mongodb.password;
const name = config.mongodb.name;
const port = config.mongodb.port;


module.exports = (function () {
    var db;
 
    function createInstance() {
        var conn = 'mongodb://' + user + ":" + password + "@" + host + ":" + port + "/" + name;
        return conn;
    }
 
    return {
        getInstance: function () {
            if (!db) {
                db = createInstance();
            }
            return db;
        }
    };
})();
  //Set up default mongoose connection