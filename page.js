// page.js - Language route module

var request = require('request');
var express = require('express');
var router = express.Router();

router.get(/^\/([a-zA-Z]{2,}(?:\-[a-zA-Z]{2,}){0,2})(\/wiki\/.*?)(?:\/.*)?$/, function(req, res){
  // Note: The above regex will catch both standard wiki links,
  // but also links that have an extra part to the url.
  // Any extras are ignored here, and processed client side

  // Grab page from wikipedia
  var lang = req.params[0];
  var ref = req.params[1];
  var uri = encodeURI("https://" + lang + ".m.wikipedia.org" + ref);

  request({uri: uri}, function(err, response, body){
    res.send(body);
  })
})

router.get('/:lang', function(req, res){
  // Grab daily article from wikipedia
  var lang = req.params.lang;
  var uri = encodeURI("https://" + lang + ".m.wikipedia.org");
  request({uri: uri}, function(err, response, body){
    res.send(body);
  })
})

module.exports = router;
