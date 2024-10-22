// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Utils from "../Utils.res.mjs";
import * as React from "react";

function Pubsub(Init) {
  var mutableState = {
    contents: Init.initial
  };
  var listeners = [];
  var get = function () {
    return mutableState.contents;
  };
  var set = function (newState) {
    mutableState.contents = newState;
    listeners.forEach(function (param) {
          param.listener(mutableState.contents);
        });
  };
  var nextId = {
    contents: 0
  };
  var subscribe = function (listener) {
    var id = nextId.contents;
    nextId.contents = id + 1 | 0;
    listeners.push({
          id: id,
          listener: listener
        });
    return function () {
      var index = listeners.findIndex(function (li) {
            return li.id === id;
          });
      if (index >= 0) {
        Utils.$$Array.removeInPlace(listeners, index);
        return ;
      }
      
    };
  };
  var useObservable = function () {
    var match = React.useReducer((function (x, param) {
            return x + 1 | 0;
          }), 0);
    var forceUpdate = match[1];
    React.useEffect((function () {
            return subscribe(forceUpdate);
          }), []);
    return mutableState.contents;
  };
  return {
          mutableState: mutableState,
          listeners: listeners,
          get: get,
          set: set,
          nextId: nextId,
          subscribe: subscribe,
          useObservable: useObservable
        };
}

function MakeObserver(Observable) {
  var mutableState = {
    contents: Observable.initial
  };
  var listeners = [];
  var get = function () {
    return mutableState.contents;
  };
  var nextId = {
    contents: 0
  };
  var subscribe = function (listener) {
    var id = nextId.contents;
    nextId.contents = id + 1 | 0;
    listeners.push({
          id: id,
          listener: listener
        });
    return function () {
      var index = listeners.findIndex(function (li) {
            return li.id === id;
          });
      if (index >= 0) {
        Utils.$$Array.removeInPlace(listeners, index);
        return ;
      }
      
    };
  };
  var useObservable = function () {
    var match = React.useReducer((function (x, param) {
            return x + 1 | 0;
          }), 0);
    var forceUpdate = match[1];
    React.useEffect((function () {
            return subscribe(forceUpdate);
          }), []);
    return mutableState.contents;
  };
  var dispatch = function (action) {
    var newState = Observable.reducer(mutableState.contents, action);
    mutableState.contents = newState;
    listeners.forEach(function (param) {
          param.listener(mutableState.contents);
        });
  };
  return {
          dispatch: dispatch,
          get: get,
          subscribe: subscribe,
          useObservable: useObservable
        };
}

export {
  Pubsub ,
  MakeObserver ,
}
/* Utils Not a pure module */
