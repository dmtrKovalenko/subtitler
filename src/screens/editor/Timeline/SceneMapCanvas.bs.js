// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Curry from "rescript/lib/es6/curry.js";
import * as Utils from "../../Utils.bs.js";
import * as React from "react";
import * as Belt_Array from "rescript/lib/es6/belt_Array.js";
import * as Belt_Range from "rescript/lib/es6/belt_Range.js";
import * as Caml_int32 from "rescript/lib/es6/caml_int32.js";
import * as CanvasSize from "./canvasSize.bs.js";
import * as Pervasives from "rescript/lib/es6/pervasives.js";
import * as Belt_Option from "rescript/lib/es6/belt_Option.js";
import * as Caml_option from "rescript/lib/es6/caml_option.js";
import * as MediaLoader from "../../services/mediaLoader.bs.js";
import * as EditorContext from "../../EditorContext.bs.js";
import * as Belt_MapString from "rescript/lib/es6/belt_MapString.js";
import * as Webapi__Canvas__Canvas2d from "bs-webapi/src/Webapi/Canvas/Webapi__Canvas__Canvas2d.bs.js";

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
  Webapi__Canvas__Canvas2d.setFillStyle(ctx, /* String */ 0, fill);
  ctx.fillRect(32, y, width, 120);
}

var sceneColors = [
  "#f87171",
  "#fbbf24",
  "#4ade80",
  "#2dd4bf",
  "#38bdf8",
  "#818cf8",
  "#c084fc",
  "#f472b6",
  "#fb7185",
];

function renderScenes(ctx, size, editorContext) {
  Belt_Option.forEach(
    Caml_option.nullable_to_opt(editorContext.videoMeta.scenesTimeline),
    function (array) {
      array.forEach(function (scene, i) {
        var sceneColor = Belt_Array.get(
          sceneColors,
          Caml_int32.mod_(i, sceneColors.length),
        );
        Webapi__Canvas__Canvas2d.setFillStyle(
          ctx,
          /* String */ 0,
          Utils.$$Option.unwrapOr(sceneColor, "#fbbf24"),
        );
        var x1 = CanvasSize.frameToX(scene.start, size);
        var x2 = CanvasSize.frameToX(scene.end, size);
        var overflowSafeX = Utils.$$Option.unwrapOr(
          Belt_Option.map(array[(i - 1) | 0], function (prev) {
            return CanvasSize.frameToX(Math.max(prev.end, scene.start), size);
          }),
          x1,
        );
        var width = x2 - x1;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x2, 24);
        ctx.lineTo(x2 - 12, 24);
        ctx.lineTo(x2, 36);
        ctx.fill();
        ctx.globalAlpha = 0.8;
        ctx.fillRect(overflowSafeX, 24, x2 - overflowSafeX, 4);
        ctx.closePath();
        ctx.save();
        ctx.rect(x1, 24, width - 4, 20);
        ctx.clip();
        Belt_Option.forEach(
          Utils.$$Array.last(scene.name.split("::")),
          function (name) {
            ctx.fillText(name, overflowSafeX + 4, 40, undefined);
          },
        );
        ctx.restore();
        ctx.globalAlpha = 0.25;
        ctx.fillRect(x1, 24, width, size.scaledHeight);
      });
    },
  );
  ctx.globalAlpha = 1;
}

function renderMainScene(ctx, size, editorContext) {
  var aspectRatio =
    editorContext.videoMeta.width / editorContext.videoMeta.height;
  var width = Math.floor(120 * aspectRatio);
  clipOverTimeLineElement(ctx, 64, size.maxSceneWidth, "#000");
  var maxFramesInScene = Caml_int32.div(size.maxSceneWidth | 0, width);
  var framesBreak = Caml_int32.div(
    editorContext.videoMeta.durationInFrames,
    maxFramesInScene,
  );
  Belt_Range.forEach(0, maxFramesInScene, function (i) {
    var svg = Curry._1(
      editorContext.wasmController.render_preview_frame,
      BigInt(Math.imul(i, framesBreak)),
    );
    var image = new Image(width, 120);
    image.src = "data:image/svg+xml;base64,".concat(window.btoa(svg));
    image.onload = function (param) {
      ctx.save();
      ctx.drawImage(image, (32 + Math.imul(i, width)) | 0, 64, width, 120);
      ctx.restore();
    };
  });
}

function renderAudioWaveForm(
  ctx,
  endFrame,
  startFrame,
  x0,
  y0,
  audioSpaceWidth,
  audioName,
  editorContext,
) {
  var media = Belt_MapString.get(
    Curry._1(MediaLoader.MediaLoaderObserver.get, undefined).mediaList,
    audioName,
  );
  var audioInfo;
  var exit = 0;
  if (media !== undefined) {
    switch (media.TAG | 0) {
      case /* Media */ 1:
        var audioInfo$1 = media._0;
        if (audioInfo$1.TAG === /* Audio */ 3) {
          audioInfo = audioInfo$1._0;
        } else {
          exit = 1;
        }
        break;
      case /* Loading */ 0:
      case /* Error */ 2:
        exit = 1;
        break;
    }
  } else {
    exit = 1;
  }
  if (exit === 1) {
    audioInfo = Pervasives.failwith(
      "Unknown audio file " +
        audioName +
        ". Did you forget to add it to your media folder?",
    );
  }
  var positionEnd =
    ((((endFrame - startFrame) | 0) / editorContext.videoMeta.fps) *
      audioInfo.sampleRate) |
    0;
  var length = (positionEnd - 0) | 0;
  var sector = (length / audioSpaceWidth) * 1;
  var position = 0;
  var mid = (CanvasSize.audio_height / 2) | 0;
  var x = x0;
  ctx.beginPath();
  Webapi__Canvas__Canvas2d.setStrokeStyle(ctx, /* String */ 0, "#e2e8f0");
  while (x < audioSpaceWidth || position < positionEnd) {
    var pcm = Utils.$$Option.unwrapOr(audioInfo.fltpData.at(position), 0.0);
    var y = mid + y0 + pcm * mid;
    ctx.lineTo(x, y);
    position = Math.floor(position + sector);
    x = Math.floor(x + 1);
  }
  ctx.stroke();
}

function renderAudioMap(ctx, size, editorContext) {
  var xStack = [];
  return Belt_Option.forEach(
    Caml_option.nullable_to_opt(editorContext.videoMeta.audioMap),
    function (audioMap) {
      audioMap.reduce(function (startY, track) {
        var x = CanvasSize.frameToX(track.start, size);
        var startY$1 = Utils.$$Option.unwrapOr(
          Belt_Option.map(
            Belt_Array.getIndexBy(xStack, function (param) {
              return x > param[0];
            }),
            function (index) {
              var match = Utils.$$Option.unwrap(Belt_Array.get(xStack, index));
              xStack.length = index;
              return match[1];
            },
          ),
          startY,
        );
        var y = (184 + startY$1) | 0;
        var width = ((track.end - track.start) | 0) * size.frameToPxRatio;
        xStack.push([x + width, startY$1]);
        ctx.save();
        var textX = x + 2;
        var textY = y - 8;
        ctx.save();
        ctx.rect(textX - 10, textY - 14 + 4, width + 8.0, 14);
        ctx.clip();
        Webapi__Canvas__Canvas2d.setFillStyle(ctx, /* String */ 0, "#e2e8f0");
        ctx.fillText(track.name, textX, textY, undefined);
        ctx.restore();
        ctx.beginPath();
        renderRoundedRect(ctx, x, y, width, 60, 8.0, undefined);
        ctx.clip();
        Webapi__Canvas__Canvas2d.setFillStyle(ctx, /* String */ 0, "#059669");
        ctx.fillRect(x, y, width, 60);
        renderAudioWaveForm(
          ctx,
          track.end,
          track.start,
          x,
          y,
          width,
          track.name,
          editorContext,
        );
        ctx.closePath();
        ctx.restore();
        return (
          (((startY$1 + CanvasSize.audio_height) | 0) +
            ((CanvasSize.audio_height / 2) | 0)) |
          0
        );
      }, 32);
    },
  );
}

function renderTimeSlots(ctx, size, editorContext) {
  var stepsCount =
    Math.floor(Utils.$$Math.divideFloat(size.maxSceneWidth, 100)) | 0;
  var stepDuration = Caml_int32.div(
    editorContext.videoMeta.durationInFrames,
    stepsCount,
  );
  return Belt_Range.forEach(0, stepsCount, function (i) {
    var x = (Math.imul(i, 100) + 32) | 0;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 18);
    Webapi__Canvas__Canvas2d.setStrokeStyle(ctx, /* String */ 0, "#475569");
    ctx.stroke();
    if (i % 2 === 0) {
      ctx.font = "12px sans-serif";
      Webapi__Canvas__Canvas2d.setFillStyle(ctx, /* String */ 0, "#64748b");
      ctx.fillText(
        Utils.Duration.formatSeconds(
          Utils.$$Math.divideFloat(
            Math.imul(i, stepDuration),
            editorContext.videoMeta.fps,
          ),
        ),
        x + 8,
        14,
        undefined,
      );
      return;
    }
  });
}

function SceneMapCanvas(Props) {
  var size = Props.size;
  var canvasRef = React.useRef(null);
  var editorContext = EditorContext.useEditorContext(undefined);
  CanvasSize.useCanvasScale(canvasRef, size);
  React.useEffect(
    function () {
      Belt_Option.map(
        Caml_option.nullable_to_opt(canvasRef.current),
        function (element) {
          var ctx = element.getContext("2d");
          renderTimeSlots(ctx, size, editorContext);
          renderScenes(ctx, size, editorContext);
          ctx.save();
          renderAudioMap(ctx, size, editorContext);
          ctx.restore();
          renderMainScene(ctx, size, editorContext);
        },
      );
    },
    [size],
  );
  return React.createElement("canvas", {
    ref: canvasRef,
    className: "absolute inset-0",
    style: {
      height: String(size.height) + "px",
      width: String(size.width) + "px",
    },
    height: String(Math.floor(size.scaledHeight)) + "px",
    width: String(Math.floor(size.scaledWidth)) + "px",
  });
}

var Canvas;

var Canvas2d;

var make = SceneMapCanvas;

export {
  Canvas,
  Canvas2d,
  renderRoundedRect,
  clipOverTimeLineElement,
  sceneColors,
  renderScenes,
  renderMainScene,
  renderAudioWaveForm,
  renderAudioMap,
  renderTimeSlots,
  make,
};
/* Utils Not a pure module */
