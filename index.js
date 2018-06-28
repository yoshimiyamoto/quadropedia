const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
const request = require('request');

var app = express();
//var router = express.Router();
var port = 3000;

var page = require('./page.js');
var transget = require('./transget.js');

var langs = ["en", "de", "fr", "es"];

app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts')
}))
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use( (req, res, next) => {
  //console.log(req.url);
  //console.log(req.headers)
  next();
})

app.get('/', (req, res) => {
  res.render('home', {langs: langs});
})

app.get('/page/unavailable', (req, res) => {
  res.render('unavailable');
})

app.get('/wiki/*', function(req, res){
  // Extract language from referer
  //var referer = req.headers.referer.match( /^(?:https?):\/\/.+(\/page\/.*?)(?:\/.*)*$/ );
  var referer = req.headers.referer.match( /^(?:https?):\/\/.+(\/page\/[a-zA-Z]{2,3})(?:\/.*)?$/ );
  var uri = referer[1] + req.url;

  //console.log(req.headers.referer);

  res.redirect(uri);
})

app.get('/w/*', grabStatic);
app.get('/static/*', grabStatic);

app.use('/page', page);
app.use('/transget', transget);

app.use( (err, req, res, next) => {
  // Log any error, for now just console.log
  console.log('Error:', err);
  res.status(err.status).send(`${err.status}: Something broke!`);
})

var server = app.listen(port, function() {
  console.log('Express is listening to http://localhost:' + port);
})

function grabStatic(req, res){
  // Grab static content from wikipedia
  var uri = "https://www.wikipedia.org" + req.url;
  request({uri: uri}, function(err, response, body){
    res.set({
      'date' : response.headers['date'],
      'connection' : response.headers['connection'],
      'content-type' : response.headers['content-type'],
      'content-length' : Buffer.byteLength(body), //response.headers['content-length'],
      'etag' : response.headers['etag']
    })
    res.send(body);
  })
}
