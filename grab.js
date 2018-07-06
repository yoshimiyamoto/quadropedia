// grab.js - some Wikipedia grab functions

var fs = require('fs');
var request = require('request');

var grab = module.exports = {};

grab.static = function(req, res){
  var referer = res.locals.referer;
  var uri_lang;

  if (req.query.lang == null) {
    if (referer) {
      uri_lang = referer[2];
    } else {
      console.log("Error - Language Missing: ", referer);
    }
  } else {
    uri_lang = req.query.lang;
  }

  var uri_protocol = "https://"
  var uri_base = uri_lang + ".m.wikipedia.org";
  var uri = uri_protocol + uri_base + req.url;

  // Grab static content directly from wikipedia
  var options = {
    url : uri,
    headers : {
      'host' : uri_base,
      'referer' : uri_base + referer[3]
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
  var files = fs.readdirSync(dir);
  for (var i = 0; i < files.length; i++){
    // Warning: Grabs only the first match if any
    file = files[i].match(/^languages\_([0-9]{4})\-([0-9]{2})\-([0-9]{2})\.json$/);
    if (file) break;
  }

  if (file) {
    file_date = new Date(Date.UTC(file[1], file[2]-1, file[3]));
    if ( curr_date.getTime() - file_date.getTime() > (7 * (24 * 60 * 60 * 1000)) ) {
      console.log("Language list older the 1 week - updating...");
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
          if (elem.name == "td" && elem.children.length > 1 && elem.children[0].attribs && elem.children[0].attribs.id) {
            return true;
          }
        }, dom);
        for (cell of cells) {
          available[cell.children[0].attribs.id] = { 'original' : cell.children[1].children[0].children[0].data, 'romanized' : cell.children[1].attribs.title };
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
