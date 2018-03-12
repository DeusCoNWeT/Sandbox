var express = require('express');
var router = express.Router();
var path = require('path');
var api_handler = require('../controllers/component_controller')

router.get('/',api_handler.getComponents);
router.get('/:name', api_handler.getComponent);
router.post('/',api_handler.postProperties);
module.exports = router;
