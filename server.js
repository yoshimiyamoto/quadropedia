const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
const request = require('request');
var page = require('./page.js');
var transget = require('./transget.js');

var app = express();
var port = 3000;

app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts')
}))
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

var referer;
app.use( (req, res, next) => {
  if (req.headers.referer) {
    // Extract language from referer
    referer = req.headers.referer.match( /^https?\:\/\/.+(\/page\/([a-zA-Z]{2,}(?:\-[a-zA-Z]{2,}){0,2}))(?:\/wiki)?(\/.*?)?(?:\/.*)?$/ );
  }
  next();
})

var langs = ["fr", "ru", "ar", "en"];
app.get('/', (req, res) => {
  res.render('home', {langs: langs});
});

app.get('/page/unavailable', (req, res) => {
  res.render('unavailable');
});

app.get('/wiki/*', function(req, res){
  // Redirect so that the requested url now contains language identifier
  // Note: Ideally find a way to avoid this extra server request
  var uri = referer[1] + req.url;
  res.redirect(uri);
});

app.get('/w/*', grabStatic);
app.get('/static/*', grabStatic);

app.use('/page', page);
app.use('/transget', transget);

app.use( (err, req, res, next) => {
  // Log any error, for now this is rather basic
  console.log('Error:', err);
  res.status(err.status).send(`${err.status}: Something broke!`);
});

var server = app.listen(port, function() {
  console.log('Express is listening to http://localhost:' + port);

  // Handle exit neatly on Linux and Windows
  if (process.platform === "win32") {
    var rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.on("SIGINT", function () {
      process.emit("SIGINT");
    });
  }
  process.on('SIGINT', function() {
    process.exit(0);
  });
  process.on('SIGTERM', function() {
    process.exit(0);
  });
});

function grabStatic(req, res){
  var uri_lang;
  if (req.query.lang == null) {
    if (referer) {
      uri_lang = referer[2];
    } else {
      console.log("Error Language Missing:", referer);
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
}
