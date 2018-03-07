var express = require('express');
var router = express.Router();
var path = require('path');

var paths = ['/', '/contact', '/instructions'];

var controller = function (req, res, next) {
  res.sendFile('index.html', { root: path.join(__dirname, '../../../app') });
}

paths.forEach(function (path) {
  router.get(path, controller);
});
module.exports = router;
