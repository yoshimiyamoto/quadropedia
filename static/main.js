// GLOBALS //
var DEBUG = 0;
var transcode = "translation";
var translations = {};
// Set some initial frame languages
// Could be replaced by a cookie
var frameLangs = ['en', 'de', 'ru', 'ar'];

// LISTENERS //
document.addEventListener("DOMContentLoaded", function(){
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (this.readyState == 4 && this.status == 200) {
      populateLanguageSelects(JSON.parse(this.responseText));
      if (frameLangs) initLanguageSelects();
    }
  }
  xhr.open("GET", "languages", true);
  xhr.send();

  context = window.top;
  for (i = 0; i < context.frames.length; i++){
    context.frames[i].frameElement.addEventListener("load", function(e){
      // Scroll to (hopefully) opening descriptive paragraph
      scrollToDescription(e.target.contentDocument);
    });
  }
});

document.addEventListener("DOMFrameContentLoaded", function(event){
  var frame = event.target;
  var path = frame.contentWindow.location.pathname;

  if (DEBUG) {
    frame.parentElement.getElementsByClassName("frameURL")[0].innerText = frame.id + ' frame: ' + frame.contentWindow.location.href + '\n';
  }

  // Only grab translations if page is itself not a grabbed translation
  res = path.match( /^\/page\/[a-zA-Z]{2,}(?:\-[a-zA-Z]{2,}){0,2}\/wiki\/.*?(?:\/(.*))?$/ );
  if ( res && res[1] != transcode ) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
      if (this.readyState == 4 && this.status == 200) {
        translations = JSON.parse(this.responseText);
        loadTranslations(frame.id);
      }
    };
    var transURL = "transget" + path;
    xhttp.open("GET", transURL, true);
    xhttp.send();
  }

  bubbleIframeMouseMove(frame);
  bubbleIframeKeys(frame);
});

var x, y = null;
document.addEventListener("mousemove", function(e){
  x = e.clientX;
  y = e.clientY;
  if (frameLangs.includes(document.elementFromPoint(x, y).id)) {
    document.elementFromPoint(x, y).focus();
  }
  if ( DEBUG && (doc = document.getElementById("debug")) ) {
    doc.innerText = document.elementFromPoint(x, y).id + ': ' + x + 'x' + y;
  }
}, false);

var keyCmds = {
  alt: { '+': fontSize,
         '-': fontSize }
};
document.addEventListener("keydown", function(e){
  if (e.altKey && (k = e.key) && k != 'Alt') {
    if (keyCmds.alt[k]) {
      keyCmds.alt[k](k, e.target.id);
    }
  }
}, false);

// FUNCTIONS //
function populateLanguageSelects(langs){
  var html = '';
  for (var k in langs) {
    html += '<option value="' + k + '">';
    html += langs[k].original + ' (' + langs[k].romanized + ')';
    html += '</option>\n';
  }
  var frameCount = window.top.frames.length;
  for (var i = 0; i < frameCount; i++) {
    document.getElementById("langSelect_" + i).innerHTML += '\n' + html;
  }
};

function initLanguageSelects(){
  for (var i = 0; i < frameLangs.length; i++) {
    var dropdown = document.getElementById("langSelect_" + i);
    for (j = 0; j < dropdown.options.length; j++) {
      if (dropdown.options[j].value == frameLangs[i]) {
        dropdown.options[j].selected = true;
        dropdown.onchange();
      }
    }
  }
};

function loadTranslations(id){
  for (i = 0; i < frameLangs.length; i++){
    chkLang = frameLangs[i];
    // For all other frame id's
    if (chkLang != id){
      // Check if translation available
      if (translations[chkLang]){
        // Load translation in appropriate frame
        var url = "page/" + chkLang + "/wiki/" + translations[chkLang] + "/" + transcode;
        newFrameSrc(chkLang, url);
      } else {
        // Display placeholder
        var url = "page/unavailable";
        newFrameSrc(chkLang, url);
      }
    }
  }
  // Tidy up
  // i.e. empty translations array ??
};

function changeFrameLang(obj){
  var sectionId = obj.id.split('_')[1];
  var newLang = obj.value;
  // Alter relevant frame and select object id's
  obj.parentNode.getElementsByTagName("iframe")[0].id = newLang;
  // Update frame reference
  frameLangs[sectionId] = newLang;
  // Prep new frame src
  var url = "page/" + newLang;
  if (translations[newLang]) {
    url += "/wiki/" + translations[newLang] + '/' + transcode;
  }
  newFrameSrc(newLang, url);
};

function newFrameSrc(lang, url){
  document.getElementById(lang).src = url;
};

function scrollToDescription(doc){
  if (doc.getElementById("mf-section-0")) {
    var desc;
    for (p of doc.getElementById("mf-section-0").getElementsByTagName("p")) {
      if ( p.parentElement.id == "mf-section-0" && !(p.classList.contains("mw-empty-elt")) && p.textContent != "" ) {
        desc = p;
        console.log(desc);
        break;
      }
    }
    if (desc) {
      //desc.scrollIntoView();
      doc.documentElement.scrollTop = desc.offsetTop;
    }
  }
};

function bubbleIframeMouseMove(iframe){
  iframe.contentDocument.addEventListener("mousemove", function(event){
    var boundingClientRect = iframe.getBoundingClientRect();
    var evt = new CustomEvent("mousemove", {bubbles: true, cancelable: false})
    evt.pageX = event.pageX + boundingClientRect.left;
    evt.pageY = event.pageY + boundingClientRect.top;
    evt.clientX = event.clientX + boundingClientRect.left;
    evt.clientY = event.clientY + boundingClientRect.top;
    iframe.dispatchEvent(evt);
  }, false);
};

function bubbleIframeKeys(iframe){
  iframe.contentDocument.addEventListener("keydown", function(event){
    var evt = new CustomEvent("keydown", {bubbles: true, cancelable: false})
    evt.altKey = event.altKey;
    evt.key = event.key;
    evt.keyCode = event.keyCode;
    evt.which = event.which;
    iframe.dispatchEvent(evt);
  }, false);
};

function fontSize(direction, frameId){
  frame = document.getElementById(frameId);
  var elem = frame.contentDocument.getElementsByTagName("body")[0];
  var styleSize = frame.contentWindow.getComputedStyle(elem, null).getPropertyValue('font-size');
  var size = parseFloat(styleSize);
  if (direction == '+') {
      elem.style.fontSize = (++size) + 'px';
  } else if (direction == '-') {
      elem.style.fontSize = (--size) + 'px';
  //} else {
  //    elem.style.fontSize = default;
  }
};
