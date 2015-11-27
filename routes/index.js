var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

router.get('/maps/:id', function(req, res, next) {
  res.sendFile(path.join(__dirname,'../public/index.html'));
});

router.get('/search/:query', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = router;
