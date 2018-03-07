var express = require('express');
var api_controller = express();
var handler = {
    getComponents: function(req, res){
        // hacer comprobaciones
        res.send("hola");
    }
}

module.exports = handler;