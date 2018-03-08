var express = require('express');
var db = require('../services/mydb').getInstance();
var router = express.Router();
var mongoose = require('mongoose');
var bd_controller = require('../controllers/bd_controller')


/* GET users listing. */
router.get('/', bd_controller.properties_components);

module.exports = router;
