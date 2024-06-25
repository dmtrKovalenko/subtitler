// Generated by ReScript, PLEASE EDIT WITH CARE


var $$Window = {};

var $$Document = {};

var targetAsElement = (_ => _);

function isFocusable(el) {
  var match = el.tagName;
  switch (match) {
    case "A" :
    case "BUTTON" :
    case "INPUT" :
    case "SELECT" :
    case "TEXTAREA" :
        return true;
    default:
      var match$1 = el.getAttribute("role");
      if (match$1 == null) {
        return false;
      }
      switch (match$1) {
        case "button" :
        case "checkbox" :
        case "input" :
        case "link" :
        case "slider" :
            return true;
        default:
          return false;
      }
  }
}

var $$Element = {
  targetAsElement: targetAsElement,
  isFocusable: isFocusable
};

function onSeeked(video, cb) {
  video.addEventListener("seeked", (function (param) {
          cb();
        }));
}

var Video = {
  onSeeked: onSeeked
};

export {
  $$Window ,
  $$Document ,
  $$Element ,
  Video ,
}
/* No side effect */
