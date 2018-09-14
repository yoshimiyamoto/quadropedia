// GLOBALS //
var DEBUG = 0;
var transcode = "translation";
var translations = {};

var settings = {'frame': {}}; //, 'lang': {}, 'volatile': {}};
// frame    - per frame settings
// lang     - per language settings
// volatile - settings that must be implemented after every frame load - NECESSARY???
// e.g. settings.frame = {0:{'enabled':'1', 'lang':''}, 1:{'enabled':'1', 'lang':''}, 2:{'enabled':'1', 'lang':''}, 3:{'enabled':'1', 'lang':''}};
// e.g. settings.lang = {'en':{'fsize':12}, 'fr':{'fsize':12}, 'ru':{'fsize':12}, 'ar':{'fsize':14}, ...};
// e.g. settings.volatile = ['lang', ...]

// LISTENERS //
document.addEventListener("DOMContentLoaded", function(){
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (this.readyState == 4 && this.status == 200) {
      populateLanguageSelects(JSON.parse(this.responseText));
      initStorage();
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
    frame.parentElement.getElementsByClassName("frameURL")[0].innerText = frame.lang + ' frame: ' + frame.contentWindow.location.href + '\n';
  }

  loadVolatileSettings(frame.id);

  // Only grab translations if page is itself not a grabbed translation
  res = path.match( /^\/page\/[a-zA-Z]{2,}(?:\-[a-zA-Z]{2,}){0,2}\/wiki\/.*?(?:\/(.*))?$/ );
  if ( res && res[1] != transcode ) {
    var head = {"id": frame.id, "url": path};
    update(settings, "HEAD", head);
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
      if (this.readyState == 4 && this.status == 200) {
        translations = JSON.parse(this.responseText);
        loadTranslations(frame.lang);
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
//  if (frameLangs.includes(document.elementFromPoint(x, y).lang)) {
  document.elementFromPoint(x, y).focus();
//  }
  if ( DEBUG && (doc = document.getElementById("debug")) ) {
    doc.innerText = document.elementFromPoint(x, y).lang + ': ' + x + 'x' + y;
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

function setLanguageSelect(id){
  var dropdown = document.getElementById("langSelect_" + id);
  if (dropdown.value != settings.frame[id]['lang']) {
    dropdown.value = settings.frame[id]['lang'];
    dropdown.onchange();
  }
};

function loadTranslations(lang){
  for (var id in settings.frame){
    if (settings.frame[id]['enabled'] == 1) {
      chk = settings.frame[id]['lang'];
      // For all other frame id's
      if (chk != lang){
        // Check if translation available
        if (translations[chk]){
          // Load translation in appropriate frame
          var url = "page/" + chk + "/wiki/" + translations[chk] + "/" + transcode;
          newFrameSrc(id, url);
        } else {
          // Display placeholder
          var url = "page/unavailable";
          newFrameSrc(id, url);
        }
      }
    }
  }
  // Tidy up
  // i.e. empty translations array ??
};

function toggleFrame(id){
  if (settings.frame[id].enabled) {
    update(settings.frame[id], "enabled", 0);
  } else {
    update(settings.frame[id], "enabled", 1);
  }
  setFrame(id);
}
function setFrame(id){
  if (settings.frame[id].enabled) {
    document.getElementById("frameToggle_" + id).classList.remove("frameToggleOff");
    document.getElementById("langSelect_" + id).removeAttribute("disabled");
    document.getElementsByTagName("iframe")[id].classList.remove("frameFilter");
    document.getElementById("blocker_" + id).style.display = "none";
  } else {
    document.getElementById("frameToggle_" + id).classList.add("frameToggleOff");
    document.getElementById("langSelect_" + id).setAttribute("disabled", "");
    document.getElementsByTagName("iframe")[id].classList.toggle("frameFilter");
    document.getElementById("blocker_" + id).style.display = "block";
  }
};

function changeFrameLang(obj){
  var id = obj.id.split('_')[1];
  var newLang = obj.value;
  // Alter relevant frame and select object id's
  document.getElementsByTagName("iframe")[id].lang = newLang;
  // Update frame reference
  update(settings.frame[id], 'lang', newLang);
  // Prep new frame src
  var url = "page/" + newLang;
  if (translations[newLang]) {
    url += "/wiki/" + translations[newLang] + '/' + transcode;
  }
  newFrameSrc(id, url);
};

function newFrameSrc(id, url){
  document.getElementById(id).src = url;
};

function scrollToDescription(doc){
  if (doc.getElementById("mf-section-0")) {
    var desc;
    for (p of doc.getElementById("mf-section-0").getElementsByTagName("p")) {
      if ( p.parentElement.id == "mf-section-0" && !(p.classList.contains("mw-empty-elt")) && p.textContent != "" ) {
        desc = p;
        break;
      }
    }
    if (desc) {
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

function fontSize(direction, id){
  frame = document.getElementById(id);
  var elem = frame.contentDocument.getElementsByTagName("body")[0];
  var styleSize = frame.contentWindow.getComputedStyle(elem, null).getPropertyValue('font-size');
  var size = parseFloat(styleSize);
  if (direction == '+') {
    size++;
  } else if (direction == '-') {
    size--;
  } // else {
//    elem.style.fontSize = default;
//  }
  elem.style.fontSize = size + 'px';
  update(settings.frame[id], 'fontSize', size);
};

// FUNCTIONS - LOCAL STORAGE //
// localStorage methods ref: setItem, getItem, removeItem, key, length, clear
function storageAvailable(type) {
  try {
    var storage = window[type],
      x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch(e) {
    return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage.length !== 0;
  }
}

function initStorage() {
  if (storageAvailable('localStorage')) {
    if (!localStorage.getItem('settings')) {
      // Set up some defaults
      update(settings, 'frame', { 0:{'enabled':'1', 'lang':''},
                                  1:{'enabled':'1', 'lang':''},
                                  2:{'enabled':'1', 'lang':''},
                                  3:{'enabled':'1', 'lang':''} });
    }
    loadSettings();
  } //else {
    // No localStorage available. Fall back to cookies?
//  }
}

function update(obj, prop, val) {
  obj[prop] = val;
  updateStorage();
}

function updateStorage() {
  localStorage.setItem('settings', JSON.stringify(settings));
}

function loadSettings() {
  settings = JSON.parse(localStorage.getItem('settings'));

  for (var id in settings.frame) {
    frame = document.getElementById(id);
    // [SET enabled/disabled]
    setLanguageSelect(id);
    setFrame(id);
//    loadVolatileSettings(id);
//    for (var i in settings.frame[id]) {
//      console.log(i, settings.frame[id][i]);
//    }
  }
  if (settings.HEAD) {
    newFrameSrc(settings.HEAD.id, settings.HEAD.url);
  }
}

function loadVolatileSettings(id) {
  frame = document.getElementById(id);
  if (settings.frame[id] && settings.frame[id]['fontSize']) {
    frame.contentDocument.getElementsByTagName("body")[0].style.fontSize = settings.frame[id]['fontSize'] + 'px';
  }
}
