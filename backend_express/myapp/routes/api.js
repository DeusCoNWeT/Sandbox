var express = require('express');
var router = express.Router();
var path = require('path');
var api_handler = require('../handlers/api_handler')

router.get('/',api_handler.getComponents);

module.exports = router;
