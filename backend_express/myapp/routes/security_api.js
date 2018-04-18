var express = require('express');
var router = express.Router();
var path = require('path');
var sec_handler = require('../controllers/sec_controller')

router.post('/',sec_handler.postSecurity);
module.exports = router;