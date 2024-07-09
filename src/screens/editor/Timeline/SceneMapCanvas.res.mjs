// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Web from "../../../bindings/Web.res.mjs";
import * as Utils from "../../../Utils.res.mjs";
import * as React from "react";
import * as Js_math from "rescript/lib/es6/js_math.js";
import * as Belt_Range from "rescript/lib/es6/belt_Range.js";
import * as Caml_int32 from "rescript/lib/es6/caml_int32.js";
import * as CanvasSize from "./canvasSize.res.mjs";
import * as Belt_Option from "rescript/lib/es6/belt_Option.js";
import * as Caml_option from "rescript/lib/es6/caml_option.js";
import * as Core__Option from "@rescript/core/src/Core__Option.res.mjs";
import * as EditorContext from "../EditorContext.res.mjs";
import * as JsxRuntime from "react/jsx-runtime";

function renderRoundedRect(ctx, x, y, width, height, radius, param) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.stroke();
}

function clipOverTimeLineElement(ctx, y, width, fill) {
  renderRoundedRect(ctx, 32, y, width, 120, 12.0, undefined);
  ctx.clip();
  ctx.fillStyle = fill;
  ctx.fillRect(32, y, width, 120);
}

var sceneRerenderCount = {
  contents: 0
};

function renderMainScene(ctx, size, editorContext) {
  var aspectRatio = editorContext.videoMeta.width / editorContext.videoMeta.height;
  var width = Math.floor(120 * aspectRatio);
  clipOverTimeLineElement(ctx, 48, size.maxSceneWidth, "#000");
  var maxFramesInScene = Caml_int32.div(size.maxSceneWidth | 0, width);
  var framesBreak = editorContext.videoMeta.duration / maxFramesInScene;
  var seekAndRenderAsync = function (i, renderId) {
    if (renderId === sceneRerenderCount.contents) {
      editorContext.dom.timelineVideoElement.currentTime = i * framesBreak;
      return Web.Video.onSeekedOnce(editorContext.dom.timelineVideoElement, (function () {
                    ctx.drawImage(editorContext.dom.timelineVideoElement, 32 + Math.imul(i, width) | 0, 48, width, 120);
                    if (i < maxFramesInScene) {
                      return seekAndRenderAsync(i + 1 | 0, renderId);
                    }
                    
                  }));
    }
    
  };
  if (editorContext.dom.timelineVideoElement.readyState > 1) {
    sceneRerenderCount.contents = sceneRerenderCount.contents + 1 | 0;
    return seekAndRenderAsync(0, sceneRerenderCount.contents);
  } else {
    return Web.Video.onLoadedDataOnce(editorContext.dom.timelineVideoElement, (function () {
                  sceneRerenderCount.contents = sceneRerenderCount.contents + 1 | 0;
                  seekAndRenderAsync(0, sceneRerenderCount.contents);
                }));
  }
}

function renderAudioWaveForm(ctx, startTs, endTs, x0, y0, audioSpaceWidth, editorContext) {
  var Ctx = editorContext.ctx;
  return Core__Option.map(Ctx.audioBuffer, (function (audioBuffer) {
                var positionEnd = (endTs - startTs) * audioBuffer.sampleRate | 0;
                var length = positionEnd - 0 | 0;
                var sector = length / audioSpaceWidth * 1;
                var position = 0;
                var mid = CanvasSize.audio_height / 2 | 0;
                var x = x0;
                ctx.beginPath();
                ctx.strokeStyle = "#e2e8f0";
                var fltpData = audioBuffer.getChannelData(0);
                while(x < audioSpaceWidth || position < positionEnd) {
                  var pcm = Core__Option.getOr(fltpData[position], 0.0);
                  var y = mid + y0 + pcm * mid;
                  ctx.lineTo(x, y);
                  position = Math.floor(position + sector);
                  x = Math.floor(x + 1);
                };
                ctx.stroke();
              }));
}

function renderAudio(ctx, size, editorContext) {
  var x = CanvasSize.tsToFrame(0, size);
  var width = editorContext.videoMeta.duration * size.frameToPxRatio;
  ctx.beginPath();
  renderRoundedRect(ctx, x, 180, width, 60, 8.0, undefined);
  ctx.clip();
  ctx.fillStyle = "#059669";
  ctx.fillRect(x, 180, width, 60);
  renderAudioWaveForm(ctx, 0, editorContext.videoMeta.duration, x, 180, width, editorContext);
  ctx.closePath();
  ctx.restore();
}

function renderTimeSlots(ctx, size, editorContext) {
  var stepsCount = Js_math.floor(Utils.$$Math.divideFloat(size.maxSceneWidth, 100));
  var stepDuration = editorContext.videoMeta.duration / stepsCount;
  Belt_Range.forEach(0, stepsCount, (function (i) {
          var x = Math.imul(i, 100) + 32 | 0;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 18);
          ctx.strokeStyle = "#52525b";
          ctx.stroke();
          if (i % 2 !== 0) {
            return ;
          }
          ctx.font = "12px sans-serif";
          ctx.fillStyle = "#52525b";
          var a = Utils.Duration.formatSeconds(i * stepDuration);
          ctx.fillText(a, x + 8, 14, 100);
        }));
}

var make = React.memo(function (props) {
      var size = props.size;
      var canvasRef = React.useRef(null);
      var editorContext = EditorContext.useEditorContext();
      CanvasSize.useCanvasScale(canvasRef, size);
      React.useEffect((function () {
              Belt_Option.map(Caml_option.nullable_to_opt(canvasRef.current), (function (element) {
                      var ctx = element.getContext("2d");
                      renderTimeSlots(ctx, size, editorContext);
                      ctx.save();
                      renderAudio(ctx, size, editorContext);
                      ctx.restore();
                      renderMainScene(ctx, size, editorContext);
                    }));
            }), [size]);
      return JsxRuntime.jsx("canvas", {
                  ref: Caml_option.some(canvasRef),
                  className: "absolute inset-0",
                  style: {
                    height: size.height.toString() + "px",
                    width: size.width.toString() + "px"
                  },
                  height: Js_math.floor(size.scaledHeight).toString() + "px",
                  width: Js_math.floor(size.scaledWidth).toString() + "px"
                });
    });

var Canvas;

var Canvas2d;

export {
  Canvas ,
  Canvas2d ,
  renderRoundedRect ,
  clipOverTimeLineElement ,
  sceneRerenderCount ,
  renderMainScene ,
  renderAudioWaveForm ,
  renderAudio ,
  renderTimeSlots ,
  make ,
}
/* make Not a pure module */
