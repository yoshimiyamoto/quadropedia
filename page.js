// page.js - Language route module

var request = require('request');
var express = require('express');
var router = express.Router();

router.get(/^\/([a-zA-Z]{2,3})(\/wiki\/.*?)(?:\/.*)?$/, function(req, res){
  // Grab page from wikipedia
  var id = req.params[0];
  var ref = req.params[1];
  var uri = "https://" + id + ".m.wikipedia.org" + ref;

  request({uri: uri}, function(err, response, body){
    res.send(body);
  })
})

router.get('/:id', function(req, res){
  // Grab daily article from wikipedia
  var id = req.params.id;
  var uri = "https://" + id + ".m.wikipedia.org";
  request({uri: uri}, function(err, response, body){
    res.send(body);
  })
})

module.exports = router;
