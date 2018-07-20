// transget.js - Translation route module

var request = require('request');
var express = require('express');
var router = express.Router();

router.get(/^\/page\/([a-zA-Z]{2,}(?:\-[a-zA-Z]{2,}){0,2})(\/wiki\/(.*?)?)(?:\/.*)?$/, function(req, res){
  var id = req.params[0];
  var ref = req.params[1];
  var transLinks = {};

  // Store the language initiating the request an available translation
  transLinks[id] = req.params[2];

  var options = {
    url : encodeURI("https://" + id + ".wikipedia.org" + ref),
    headers : {
      'Accept' : 'text/html'
    }
  }
  request(options, function(err, response, body){
    // Parse available languages
    transparser.parseComplete(body);
    var translations = htmlparser.DomUtils.findAll(isTranslation, transparser._cbs.dom)
    for (item of translations) {
      if (item.children[0].name == "a") {
        var re = new RegExp(/^(?:https?):\/\/([a-zA-Z]{2,}(?:\-[a-zA-Z]{2,}){0,2})\..+\/wiki\/(.*)$/);
        var match = item.children[0].attribs.href.match(re);
        if (match) {
          // Store any translations found
          transLinks[match[1]] = match[2];
        }
      }
    }
    res.send(JSON.stringify(transLinks));
  })
})

var htmlparser = require('htmlparser2');
var transhandler = new htmlparser.DomHandler(function (err, dom){
  if (err) {
    console.log('ERROR (transhandler):', err);
  }
  else {
    //console.log(dom);
  }
}, {
  normalizeWhitespace: true
})
var transparser = new htmlparser.Parser(transhandler, {decodeEntities: true});

function isTranslation (elem) {
  if (elem.attribs.class) {
    var re = new RegExp(/^.*interwiki-([a-zA-Z]{2,}(?:\-[a-zA-Z]{2,}){0,2}).*$/);
    var arrMatches = elem.attribs.class.match(re);
    if (arrMatches) {
      return true;
    }
  }
}

module.exports = router;
