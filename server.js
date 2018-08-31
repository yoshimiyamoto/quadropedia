const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
const request = require('request');
var page = require('./page.js');
var transget = require('./transget.js');
var grab = require('./grab.js');
var log = require('./log-extras.js');

var app = express();
var port = 3000;

app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  helpers: require('./config/hbs-helpers'),
  layoutsDir: path.join(__dirname, 'views/layouts')
}))
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use('/static', express.static(__dirname + '/static'));

app.use( (req, res, next) => {
  if (req.headers.referer) {
    // Extract language from referer
    res.locals.referer = req.headers.referer.match( /^https?\:\/\/.+(\/page\/([a-zA-Z]{2,}(?:\-[a-zA-Z]{2,}){0,2}))(?:\/wiki)?(\/.*?)?(?:\/.*)?$/ );
    //if (!res.locals.referer) {
    //  console.warn(log.colours.FgYellow + 'REFERER, BUT NOT STORED' + log.colours.Reset);
    //  console.info(log.colours.FgGreen + '\tREQUESTING:' + log.colours.Reset, req.url);
    //  console.info(log.colours.FgGreen + '\tREFERER:' + log.colours.Reset, req.headers.referer);
    //  //console.log('\t' + JSON.stringify(req.headers, null, 2).replace(/\n\r?/g, '\n\t'));
    //} else {
    //  console.warn(log.colours.FgYellow + 'REFERER STORED' + log.colours.Reset);
    //  console.info(log.colours.FgGreen + '\tREQUESTING:' + log.colours.Reset, req.url);
    //  console.info(log.colours.FgGreen + '\tREFERER:' + log.colours.Reset, req.headers.referer);
    //  //console.log('\t' + JSON.stringify(req.headers, null, 2).replace(/\n\r?/g, '\n\t'));
    //  //console.log('\t%O', req.headers);
    //}
  }
  next();
})

app.get('/', (req, res) => {
  res.render('home', {numFrames: 4});
});

app.get('/page/unavailable', (req, res) => {
  res.render('unavailable');
});

app.get('/wiki/*', function(req, res){
  // Redirect so that the requested url now contains language identifier
  // Note: Ideally find a way to avoid this extra server request
  var uri = res.locals.referer[1] + req.url;
  res.redirect(uri);
});

app.get('/languages', grab.allLanguages);

app.get('/w/*', grab.static);
app.get('/static/*', grab.static);

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
