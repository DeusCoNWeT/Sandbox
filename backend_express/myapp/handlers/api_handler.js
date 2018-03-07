var express = require('express');
var api_controller = express();
api_controller.get('/', function(req,res){
    //Comprobar parametros
    res.send('HOLA');
});

module.exports = handler;