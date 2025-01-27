// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Cx from "rescript-classnames/src/Cx.res.mjs";
import * as Web from "../../../bindings/Web.res.mjs";
import * as Hooks from "../../../hooks/Hooks.res.mjs";
import * as Input from "../../../ui/Input.res.mjs";
import * as Utils from "../../../Utils.res.mjs";
import * as React from "react";
import * as Js_dict from "rescript/lib/es6/js_dict.js";
import * as Caml_option from "rescript/lib/es6/caml_option.js";
import * as Core__Option from "@rescript/core/src/Core__Option.res.mjs";
import * as EditorContext from "../EditorContext.res.mjs";
import * as Mask from "@react-input/mask";
import * as Js_null_undefined from "rescript/lib/es6/js_null_undefined.js";
import * as JsxRuntime from "react/jsx-runtime";
import * as Outline from "@heroicons/react/24/outline";
import * as Webapi__Dom__HtmlInputElement from "rescript-webapi/src/Webapi/Dom/Webapi__Dom__HtmlInputElement.res.mjs";

function useEditorInputHandler() {
  var ctx = EditorContext.useEditorContext();
  return Hooks.useEvent(function ($$event) {
              var key = $$event.key;
              switch (key) {
                case " " :
                    if ($$event.shiftKey || $$event.ctrlKey || $$event.metaKey) {
                      return ctx.playerImmediateDispatch("Play");
                    } else {
                      return ;
                    }
                case "Escape" :
                    return $$event.target.blur();
                default:
                  return ;
              }
            });
}

function ChunkEditor$TimestampEditor(props) {
  var onChange = props.onChange;
  var allowEmpty = props.allowEmpty;
  var inProgress = props.inProgress;
  var ts = props.ts;
  var inputRef = Mask.useMask({
        mask: "__:__,___",
        replacement: Js_dict.fromArray([[
                "_",
                new RegExp("\\d")
              ]])
      });
  var match = React.useState(function () {
        
      });
  var setParseError = match[1];
  var parseError = match[0];
  var parsedValue = Core__Option.getOr(Core__Option.map(ts, Utils.Duration.formatMillis), "");
  React.useEffect((function () {
          Core__Option.forEach(Utils.$$Option.zip(Caml_option.nullable_to_opt(inputRef.current), ts), (function (param) {
                  var timestamp = param[1];
                  Core__Option.forEach(Webapi__Dom__HtmlInputElement.ofElement(param[0]), (function (input) {
                          input.value = Utils.Duration.formatMillis(timestamp);
                        }));
                }));
        }), [ts]);
  var adornment = React.useMemo((function () {
          return Core__Option.map(parseError, (function (message) {
                        return JsxRuntime.jsx("span", {
                                    children: JsxRuntime.jsx(Outline.ExclamationTriangleIcon, {
                                          className: "text-red-500 size-6"
                                        }),
                                    title: message
                                  });
                      }));
        }), [parseError]);
  return JsxRuntime.jsx(Input.make, {
              defaultValue: parsedValue,
              inputRef: Caml_option.some(inputRef),
              placeholder: inProgress ? "transcribing" : "till the next cue",
              onKeyDown: useEditorInputHandler(),
              readOnly: props.readonly,
              label: props.label,
              className: Cx.cx([
                    "w-full",
                    inProgress ? "animate-pulse pointer-events-none" : "",
                    Core__Option.isSome(parseError) ? "ring-red-500 rounded-lg ring-2 focus:ring-0" : ""
                  ]),
              labelHidden: true,
              adornment: adornment,
              adornmentPosition: "Right",
              onChange: (function (value) {
                  var value$1 = value.trim() === "" ? undefined : value;
                  var match = Core__Option.map(value$1, Utils.Duration.parseMillisInputToSeconds);
                  if (match === undefined) {
                    if (allowEmpty) {
                      onChange(undefined);
                      return setParseError(function (param) {
                                  
                                });
                    } else {
                      return setParseError(function (param) {
                                  return "Timestamp is required";
                                });
                    }
                  }
                  if (match.TAG === "Ok") {
                    onChange(match._0);
                    return setParseError(function (param) {
                                
                              });
                  }
                  var message = match._0;
                  setParseError(function (param) {
                        return message;
                      });
                })
            });
}

var TimestampEditor = {
  make: ChunkEditor$TimestampEditor
};

var globalCurrentCueTextAreaRef = {
  contents: undefined
};

var make = React.memo(function (props) {
      var onTextChange = props.onTextChange;
      var onTimestampChange = props.onTimestampChange;
      var removeChunk = props.removeChunk;
      var chunk = props.chunk;
      var current = props.current;
      var readonly = props.readonly;
      var index = props.index;
      var match = chunk.timestamp;
      var start = match[0];
      var ctx = EditorContext.useEditorContext();
      var ref = React.useRef(null);
      var textAreaRef = React.useRef(null);
      var previousWasCurrentRef = React.useRef(current);
      React.useEffect((function () {
              if (current && !previousWasCurrentRef.current) {
                globalCurrentCueTextAreaRef.contents = textAreaRef;
                if (!Web.isFocusingInteractiveElement()) {
                  Core__Option.forEach(Caml_option.nullable_to_opt(ref.current), (function (el) {
                          el.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                              });
                        }));
                }
                
              }
              previousWasCurrentRef.current = current;
            }), [current]);
      var seekToThisCue = React.useCallback((function (param) {
              if (!readonly) {
                ctx.playerImmediateDispatch("Pause");
                return ctx.playerImmediateDispatch({
                            TAG: "NewFrame",
                            _0: start
                          });
              }
              
            }), [start]);
      var inProgress = Core__Option.getOr(chunk.isInProgress, false);
      return JsxRuntime.jsxs("div", {
                  children: [
                    JsxRuntime.jsxs("div", {
                          children: [
                            JsxRuntime.jsx(ChunkEditor$TimestampEditor, {
                                  ts: start,
                                  label: "Start time of cue " + index.toString(),
                                  inProgress: inProgress,
                                  allowEmpty: false,
                                  onChange: (function (seconds) {
                                      var seconds$1 = Utils.$$Option.unwrap(seconds);
                                      onTimestampChange(index, [
                                            seconds$1,
                                            chunk.timestamp[1]
                                          ]);
                                      ctx.playerImmediateDispatch({
                                            TAG: "NewFrame",
                                            _0: seconds$1
                                          });
                                      ctx.playerImmediateDispatch("UpdateCurrentCue");
                                    }),
                                  readonly: readonly
                                }),
                            JsxRuntime.jsx(Outline.ArrowRightIcon, {
                                  className: "text-white size-10"
                                }),
                            JsxRuntime.jsx(ChunkEditor$TimestampEditor, {
                                  ts: Caml_option.nullable_to_opt(match[1]),
                                  label: "Start time of cue " + index.toString(),
                                  inProgress: inProgress,
                                  allowEmpty: true,
                                  onChange: (function (seconds) {
                                      onTimestampChange(index, [
                                            chunk.timestamp[0],
                                            Js_null_undefined.fromOption(seconds)
                                          ]);
                                    }),
                                  readonly: readonly
                                })
                          ],
                          className: "flex items-center gap-1"
                        }),
                    JsxRuntime.jsx("textarea", {
                          ref: Caml_option.some(textAreaRef),
                          className: Cx.cx([
                                "col-span-2 block w-full resize-none rounded-lg border-none bg-white/10 py-1.5 px-3 text-sm/6 text-white",
                                "focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400"
                              ]),
                          readOnly: readonly,
                          rows: chunk.text === "" ? 2 : 3,
                          value: chunk.text,
                          onKeyDown: useEditorInputHandler(),
                          onChange: (function (e) {
                              onTextChange(index, e.target.value);
                            })
                        }),
                    chunk.text === "" ? JsxRuntime.jsxs("div", {
                            children: [
                              JsxRuntime.jsx("button", {
                                    children: "Remove cue",
                                    className: "flex-1 inline-flex justify-center items-center bg-red-700/60 hover:bg-red-500/60 transition-colors focus-visible:outline-zinc-300 focus:outline-none focus:outline-2 focus-visible:-outline-offset-2 py-1.5 rounded-lg",
                                    type: "button",
                                    onClick: (function (param) {
                                        removeChunk(index, false);
                                      })
                                  }),
                              JsxRuntime.jsx("button", {
                                    children: "Remove and join siblings",
                                    className: "flex-[1.5] inline-flex justify-center items-center bg-amber-600/80 hover:bg-amber-500/60 transition-colors focus-visible:outline-zinc-300 focus:outline-none focus:outline-2 focus-visible:-outline-offset-2 py-1.5 rounded-lg",
                                    type: "button",
                                    onClick: (function (param) {
                                        removeChunk(index, true);
                                      })
                                  })
                            ],
                            className: "flex gap-2"
                          }) : null
                  ],
                  ref: Caml_option.some(ref),
                  className: Cx.cx([
                        "gap-3 flex focus-within:border-zinc-500 transition-colors flex-col rounded-xl border-2 border-zinc-700 p-2 bg-zinc-900",
                        current ? "!border-zinc-500" : ""
                      ]),
                  onFocus: seekToThisCue
                });
    });

export {
  useEditorInputHandler ,
  TimestampEditor ,
  globalCurrentCueTextAreaRef ,
  make ,
}
/* make Not a pure module */
