// grab.js - some Wikipedia grab functions

var fs = require('fs');
var request = require('request');
var log = require('./log-extras.js');

var grab = module.exports = {};

grab.static = function(req, res){
  var referer = res.locals.referer;
  var uri_lang;

//  if (!referer) console.log('ERROR - NO LOCAL REFERER FOR STATIC REQ:', req.headers);

  if (req.query.lang == null) {
    if (referer) {
      uri_lang = referer[2];
    } else {
      console.log("Error - Language Missing:", referer, "(Setting to default EN)");
      uri_lang = "en";
    }
  } else {
    uri_lang = req.query.lang;
  }

  var uri_protocol = "https://"
  var uri_base = uri_lang + ".m.wikipedia.org";
  var uri = uri_protocol + uri_base + req.url;
  var pg = "";
  if (referer && referer[3]) pg = referer[3];

  // Grab static content directly from wikipedia
  //console.warn(log.colours.FgYellow + 'GRABBING STATIC:' + log.colours.Reset, uri);
  var options = {
    url : uri,
    encoding : null,
    headers : {
      'host' : uri_base,
      'referer' : uri_base + pg
    }
  }
  request(options, function(err, response, body){
    if (err) {
      console.log("Error:", err);
    } else {
      res.set(response.headers);
      res.send(body);
    }
  });
};

grab.allLanguages = function(req, res){
  var UPDATE = false;
  var curr_date = new Date();
  var dir = "./data/";
  var file;
  var files;

  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }

  files = fs.readdirSync(dir);

  for (var i = 0; i < files.length; i++){
    // Warning: Grabs only the first match if any
    file = files[i].match(/^languages\_([0-9]{4})\-([0-9]{2})\-([0-9]{2})\.json$/);
    if (file) break;
  }

  if (file) {
    file_date = new Date(Date.UTC(file[1], file[2]-1, file[3]));
    if ( curr_date.getTime() - file_date.getTime() > (28 * (24 * 60 * 60 * 1000)) ) {
      console.log("Language list older the 4 weeks - updating...");
      UPDATE = true;
    } else {
      res.send(fs.readFileSync(dir + file[0]));
    }
  } else {
    console.log("No languages file found - creating...");
    UPDATE = true;
  }

  if (UPDATE) {
    var available = {};
    var htmlparser = require('htmlparser2');
    var parsehandler = new htmlparser.DomHandler(function (err, dom){
      if (err) {
        console.log(err);
      }
      else {
        cells = htmlparser.DomUtils.findAll(function (elem){
          if (elem.name == "td" && elem.attribs && elem.attribs.id) {
            //console.log(elem);
            return true;
          }
        }, dom);
        for (cell of cells) {
          available[cell.attribs.id] = { 'original' : cell.children[0].children[0].children[0].data, 'romanized' : cell.children[0].attribs.title };
        }
      }
    }, {normalizeWhitespace: true})
    var parser = new htmlparser.Parser(parsehandler, {decodeEntities: true});

    var options = {
      url : 'https://meta.wikimedia.org/wiki/Special:SiteMatrix',
      headers : {
        'Accept' : 'text/html'
      }
    }
    request(options, function(err, response, body){
      // Parse all available Wikipedia languages
      parser.parseComplete(body);

      // Save results and return object
      let str_available = JSON.stringify(available);
      fs.writeFile('data/languages_' + curr_date.toISOString().substr(0,10) + '.json', str_available, (err) => {
        if (err) throw err;
        console.log('Available languages written to file');
        if (file) {
          // Delete old file
          fs.unlink(dir + file[0], (err) => {
            if (err) throw err;
            console.log('Successfully deleted previous file:', file[0]);
          });
        }
        res.send(JSON.stringify(available));
      });
    })
  }
};
