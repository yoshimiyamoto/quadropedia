// hbs-helpers.js

module.exports = {
  iter: function(context, options){
    var ret = "";
    if (context) {
      for (var i = 0; i < context; i++) {
        ret = ret + options.fn(i);
      }
    } else {
      ret = "No iteration limit provided.";
    }
    return ret;
  }
};
