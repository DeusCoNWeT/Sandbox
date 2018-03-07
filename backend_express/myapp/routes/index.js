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

// router.get('/contact', function(req, res, next) {
//   // res.senfFile(path.join(__dirname, '../../../app', 'index.html'));
//   res.sendFile('index.html', { root: path.join(__dirname, '../../../app') });
// });
// router.get('/instructions', function(req, res, next) {
//   // res.senfFile(path.join(__dirname, '../../../app', 'index.html'));
//   res.sendFile('index.html', { root: path.join(__dirname, '../../../app') });
// });
module.exports = router;
