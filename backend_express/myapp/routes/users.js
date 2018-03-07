var express = require('express');
var db = require('../services/mydb').getInstance();
var router = express.Router();
var mongoose = require('mongoose');
var bd_handler = require('../handlers/bd_handler')



/* GET users listing. */
router.get('/', bd_handler.properties_components);

module.exports = router;
