// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Hooks from "../hooks/Hooks.res.mjs";
import * as React from "react";
import * as Caml_option from "rescript/lib/es6/caml_option.js";
import * as Core__Array from "@rescript/core/src/Core__Array.res.mjs";
import * as Core__Option from "@rescript/core/src/Core__Option.res.mjs";
import * as JsxRuntime from "react/jsx-runtime";
import ReactFontpickerTs from "react-fontpicker-ts";

function parseVariantString(variant) {
  var match = variant.split(",");
  if (match[0] !== "0") {
    return ;
  }
  var match$1 = match[1];
  if (match$1 === undefined) {
    return ;
  }
  switch (match$1) {
    case "100" :
        return 100;
    case "200" :
        return 200;
    case "300" :
        return 300;
    case "400" :
        return 400;
    case "500" :
        return 500;
    case "600" :
        return 600;
    case "700" :
        return 700;
    case "800" :
        return 800;
    case "900" :
        return 900;
    default:
      return ;
  }
}

var ReactFontPicker = {};

var make = React.memo(function (props) {
      var onFontVariantInfo = props.onFontVariantInfo;
      var onFontLoad = props.onFontLoad;
      var match = React.useState(function () {
            
          });
      var setFontToLoad = match[1];
      var fontToLoad = match[0];
      return JsxRuntime.jsx(ReactFontpickerTs, {
                  inputId: props.inputId,
                  autoLoad: false,
                  loadFonts: Core__Option.getOr(Core__Option.map(fontToLoad, (function (font) {
                              return [font];
                            })), []),
                  defaultValue: "Inter",
                  loading: Caml_option.some(JsxRuntime.jsx("div", {
                            children: "Inter",
                            className: "py-0.5 pl-3 font-light text-white text-base"
                          })),
                  value: Hooks.useEvent(function (val) {
                        setFontToLoad(function (param) {
                              return val;
                            });
                      }),
                  loadAllVariants: true,
                  fontsLoaded: Hooks.useEvent(function (param) {
                        setTimeout((function () {
                                Core__Option.forEach(fontToLoad, onFontLoad);
                              }), 100);
                      }),
                  localFonts: [{
                      name: "Virgil",
                      sane: "virgil",
                      cased: "Virgil",
                      variants: [
                        "0,400",
                        "0,500",
                        "0,600",
                        "0,700",
                        "0,800",
                        "0,900"
                      ]
                    }],
                  fontVariants: Hooks.useEvent(function (info) {
                        onFontVariantInfo(Core__Array.filterMap(info.variants, parseVariantString));
                      })
                });
    });

export {
  parseVariantString ,
  ReactFontPicker ,
  make ,
}
/* make Not a pure module */
