// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Cx from "rescript-classnames/src/Cx.res.mjs";
import * as Dock from "./Dock.res.mjs";
import * as Tabs from "../../ui/Tabs.res.mjs";
import * as Hooks from "../../hooks/Hooks.res.mjs";
import * as Utils from "../../Utils.res.mjs";
import * as React from "react";
import * as Spinner from "../../ui/Spinner.res.mjs";
import * as Timeline from "./Timeline/Timeline.res.mjs";
import * as ChunksList from "./ChunksList/ChunksList.res.mjs";
import * as Belt_Option from "rescript/lib/es6/belt_Option.js";
import * as Caml_option from "rescript/lib/es6/caml_option.js";
import * as StyleEditor from "./StyleEditor/StyleEditor.res.mjs";
import * as Core__Option from "@rescript/core/src/Core__Option.res.mjs";
import * as EditorCanvas from "./EditorCanvas.res.mjs";
import * as EditorContext from "./EditorContext.res.mjs";
import * as UseEditorLayout from "../../hooks/useEditorLayout.res.mjs";
import * as JsxRuntime from "react/jsx-runtime";

function a(prim) {
  return {};
}

console.log("Happy subtitles making experience!");

var make = React.memo(function (props) {
      var subtitlesManager = props.subtitlesManager;
      var match = Hooks.useToggle(false);
      var ctx = EditorContext.useEditorContext();
      var layout = Hooks.useEditorLayout(match[0]);
      var transcriptionInProgress = subtitlesManager.transcriptionState === "TranscriptionInProgress";
      var subtitlesTitle = transcriptionInProgress ? JsxRuntime.jsxs("div", {
              children: [
                JsxRuntime.jsx(Spinner.make, {}),
                JsxRuntime.jsx("span", {
                      children: "Transcribing"
                    })
              ],
              className: "gap-2 inline-flex items-center"
            }) : "Subtitles";
      var styleTitle = "Style";
      return JsxRuntime.jsxs("div", {
                  children: [
                    JsxRuntime.jsxs("div", {
                          children: [
                            Core__Option.getOr(Belt_Option.map(layout.mediaControls, (function (size) {
                                        return JsxRuntime.jsxs("div", {
                                                    children: [
                                                      JsxRuntime.jsx("div", {
                                                            children: JsxRuntime.jsx(Tabs.make, {
                                                                  tabs: [
                                                                    {
                                                                      id: "subtitles",
                                                                      name: subtitlesTitle,
                                                                      content: JsxRuntime.jsx(ChunksList.make, {
                                                                            subtitlesManager: subtitlesManager
                                                                          })
                                                                    },
                                                                    {
                                                                      id: "style",
                                                                      name: styleTitle,
                                                                      content: JsxRuntime.jsx(StyleEditor.make, {})
                                                                    }
                                                                  ],
                                                                  defaultIndex: 0
                                                                }),
                                                            className: "@2xl:hidden overflow-auto flex-1 scrol-pb-4 flex items-center flex-col pt-1 px-4 gap-2"
                                                          }),
                                                      JsxRuntime.jsxs("div", {
                                                            children: [
                                                              JsxRuntime.jsxs("div", {
                                                                    children: [
                                                                      JsxRuntime.jsx("h2", {
                                                                            children: subtitlesTitle,
                                                                            className: Cx.cx([
                                                                                  "mx-auto text-xl",
                                                                                  transcriptionInProgress ? "sticky top-0 bg-zinc-600/5 px-2 rounded-lg backdrop-blur" : ""
                                                                                ])
                                                                          }),
                                                                      JsxRuntime.jsx(ChunksList.make, {
                                                                            subtitlesManager: subtitlesManager
                                                                          })
                                                                    ],
                                                                    className: "pr-6 flex-1 flex max-h-full overflow-auto flex-col justify-center gap-y-4"
                                                                  }),
                                                              JsxRuntime.jsxs("div", {
                                                                    children: [
                                                                      JsxRuntime.jsx("h2", {
                                                                            children: styleTitle,
                                                                            className: "mx-auto text-xl"
                                                                          }),
                                                                      JsxRuntime.jsx(StyleEditor.make, {})
                                                                    ],
                                                                    className: "pl-6 flex-1 flex flex-col gap-y-4"
                                                                  })
                                                            ],
                                                            className: "hidden @2xl:flex overflow-auto px-4 pt-2 flex-1 max-h-full divide-x divide-zinc-700"
                                                          })
                                                    ],
                                                    className: "@container col-span-2 pt-2 h-full flex flex-col border-r border-zinc-800",
                                                    style: UseEditorLayout.sizeToStyle(size)
                                                  });
                                      })), null),
                            JsxRuntime.jsxs("div", {
                                  children: [
                                    JsxRuntime.jsx("canvas", {
                                          ref: Caml_option.some(ctx.dom.canvasRef),
                                          className: "bg-black origin-top-left absolute left-0 top-0",
                                          id: "editor-preview",
                                          style: {
                                            height: ctx.videoMeta.height.toString() + "px",
                                            width: ctx.videoMeta.width.toString() + "px",
                                            transform: "scale(" + layout.preview.scale.toString() + ")"
                                          },
                                          height: ctx.videoMeta.height.toString(),
                                          width: ctx.videoMeta.width.toString()
                                        }),
                                    JsxRuntime.jsx("canvas", {
                                          ref: Caml_option.some(props.rendererPreviewCanvasRef),
                                          className: "origin-top-left absolute left-0 top-0",
                                          style: {
                                            height: ctx.videoMeta.height.toString() + "px",
                                            width: ctx.videoMeta.width.toString() + "px",
                                            transform: "scale(" + layout.preview.scale.toString() + ")"
                                          },
                                          height: ctx.videoMeta.height.toString(),
                                          width: ctx.videoMeta.width.toString()
                                        }),
                                    JsxRuntime.jsx(EditorCanvas.make, {
                                          transcriptionInProgress: transcriptionInProgress,
                                          width: ctx.videoMeta.width,
                                          height: ctx.videoMeta.height,
                                          style: {
                                            height: ctx.videoMeta.height.toString() + "px",
                                            width: ctx.videoMeta.width.toString() + "px",
                                            transform: "scale(" + layout.preview.scale.toString() + ")"
                                          },
                                          className: "bg-transparent origin-top-left absolute left-0 top-0",
                                          subtitles: subtitlesManager.activeSubtitles
                                        })
                                  ],
                                  className: "relative",
                                  style: UseEditorLayout.sizeToStyle(layout.preview)
                                })
                          ],
                          className: "overflow-auto flex justify-center w-full"
                        }),
                    Utils.$$Option.unwrapOr(Belt_Option.map(layout.timeLine, (function (sectionSize) {
                                return JsxRuntime.jsx("div", {
                                            children: JsxRuntime.jsx(Timeline.make, {
                                                  sectionSize: sectionSize
                                                }),
                                            className: "shadow-lg w-screen bg-zinc-800",
                                            style: UseEditorLayout.sizeToStyle(sectionSize)
                                          });
                              })), null),
                    JsxRuntime.jsx(Dock.make, {
                          subtitlesManager: subtitlesManager,
                          render: props.render,
                          fullScreenToggler: match[1]
                        })
                  ],
                  className: "w-screen h-screen bg-zinc-900 overflow-hidden relative",
                  id: "fframes-editor"
                });
    });

export {
  a ,
  make ,
}
/*  Not a pure module */
