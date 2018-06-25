// lang.js - Language route module

var request = require('request');
var express = require('express');
var router = express.Router();

function isTranslation (elem) {
  if (typeof elem.attribs.class !== "undefined") {
    var re = new RegExp(/^.*interwiki-([a-zA-Z]{2,3})$/);
    var arrMatches = elem.attribs.class.match(re);
    if (arrMatches) {
      //console.log(arrMatches[1]);
      return true;
    }
  }
}

function getTranslations(id, ref, callback) {
  var transLinks = {};
  var options = {
    url : "https://" + id + ".wikipedia.org" + ref,
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
        var re = new RegExp(/^(?:https?):\/\/([a-zA-Z]{2,3})\..+\/wiki\/(.*)$/);
        var match = item.children[0].attribs.href.match(re);
        if (match) {
          transLinks[match[1]] = match[2];
        }
      }
    }
    //console.log(transLinks);
    callback(transLinks);
  })
}

var htmlparser = require('htmlparser2');
var transhandler = new htmlparser.DomHandler(function (err, dom){
  if (err) {
    console.log(err);
  }
  else {
    //console.log(dom);
  }
}, {
  normalizeWhitespace: true
})
var transparser = new htmlparser.Parser(transhandler, {decodeEntities: true});

//router.get(/^\/(.*)(\/wiki\/.*)$/, function(req, res){
router.get(/^\/([a-zA-Z]{2,3})(\/wiki\/.*)$/, function(req, res){
  var id = req.params[0];
  var ref = req.params[1];
  var uri = "https://" + id + ".m.wikipedia.org" + ref;
  // Check for translations
  getTranslations(id, ref, function(transLinks){
    request({uri: uri}, function(err, response, body){
      // Append translation url's to enable frame update client-side
      //translationsDiv = "\n<div id=\"translations\" data-available='{\"en\":\"https://en.wikipedia.org/\"}'></div>\n";
      translationsDiv = `\n<div id=\"translations\" data-available='${JSON.stringify(transLinks)}'></div>\n`;
      var i = body.lastIndexOf('</body>');
      // RegEx version of above: '/\<\/html\>(?=[^\<\/html\>]*$)/gi'
      if (i != -1) {
        body = body.substr(0, i) + translationsDiv + body.substr(i);
      } else {
        console.log('Error: Could not append translation links');
      }
      res.send(body);
    })
  })
})

// Fix this shit - to clearly recognise a translation list request
router.get(/^\/lang\/([a-zA-Z]{2,3})(\/wiki\/.*)$/, function(req, res){
  var id = req.params[0];
  var ref = req.params[1];
  var transLinks = {};
  var options = {
    url : "https://" + id + ".wikipedia.org" + ref,
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
        var re = new RegExp(/^(?:https?):\/\/([a-zA-Z]{2,3})\..+\/wiki\/(.*)$/);
        var match = item.children[0].attribs.href.match(re);
        if (match) {
          transLinks[match[1]] = match[2];
        }
      }
    }
    console.log(transLinks);
    res.send(JSON.stringify(transLinks));
  })
})

router.get('/:id', function(req, res){
  // Grab content from wikipedia
  var id = req.params.id;
  var uri = "https://" + id + ".m.wikipedia.org";
  request({uri: uri}, function(err, response, body){
    // Set a language identity header
    //res.setHeader('Language', id);
    //var self = this;
    res.send(body);
  })
  //res.send(`Requesting ${uri}`);
})

module.exports = router;
