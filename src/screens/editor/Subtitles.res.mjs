// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Utils from "../../Utils.res.mjs";
import * as Caml_int32 from "rescript/lib/es6/caml_int32.js";
import * as Caml_option from "rescript/lib/es6/caml_option.js";
import * as Core__Array from "@rescript/core/src/Core__Array.res.mjs";
import * as Core__Option from "@rescript/core/src/Core__Option.res.mjs";

function start(chunk) {
  return chunk.timestamp[0];
}

function end(chunk) {
  return chunk.timestamp[1];
}

function isChunkDisplayed(range, ts, nextRange) {
  var match = range.timestamp[0];
  var match$1 = range.timestamp[1];
  var match$2 = Core__Option.map(nextRange, start);
  if (!(match$1 === null || match$1 === undefined)) {
    if (match <= ts) {
      return ts < match$1;
    } else {
      return false;
    }
  }
  match$1 === null;
  if (match$2 !== undefined) {
    if (match <= ts) {
      return ts < match$2;
    } else {
      return false;
    }
  } else {
    return ts >= match;
  }
}

function lookupCurrentCue(subtitles, timestamp) {
  return Core__Option.map((function (index) {
                  if (index < 0) {
                    return ;
                  } else {
                    return index;
                  }
                })(subtitles.findIndex(function (subtitle, i) {
                      return isChunkDisplayed(subtitle, timestamp, subtitles[i + 1 | 0]);
                    })), (function (currentIndex) {
                var currentCue = subtitles[currentIndex];
                return {
                        currentIndex: currentIndex,
                        currentCue: currentCue
                      };
              }));
}

function lookUpLastPlayedCue(subtitles, timestamp) {
  return Core__Array.reduceRightWithIndex(subtitles, undefined, (function (acc, subtitle, index) {
                if (acc !== undefined || !isChunkDisplayed(subtitle, timestamp, subtitles[index + 1 | 0])) {
                  return acc;
                } else {
                  return {
                          currentIndex: index,
                          currentCue: subtitle
                        };
                }
              }));
}

function getOrLookupCurrentCue(timestamp, subtitles, prevCue) {
  if (prevCue !== undefined) {
    if (isChunkDisplayed(prevCue.currentCue, timestamp, subtitles[prevCue.currentIndex + 1 | 0])) {
      return prevCue;
    } else {
      return Core__Option.flatMap(subtitles[prevCue.currentIndex + 1 | 0], (function (nextCue) {
                    if (isChunkDisplayed(nextCue, timestamp, subtitles[prevCue.currentIndex + 2 | 0])) {
                      return {
                              currentIndex: prevCue.currentIndex + 1 | 0,
                              currentCue: nextCue
                            };
                    } else {
                      return lookupCurrentCue(subtitles, timestamp);
                    }
                  }));
    }
  } else {
    return lookupCurrentCue(subtitles, timestamp);
  }
}

function averageChunkLength(subtitles) {
  var totalCharacters = Core__Array.reduce(subtitles, 0, (function (acc, subtitle) {
          return acc + subtitle.text.length | 0;
        }));
  return Caml_int32.div(totalCharacters, subtitles.length);
}

function addChunkId(chunk) {
  return {
          id: Math.random(),
          text: chunk.text,
          isInProgress: chunk.isInProgress,
          timestamp: chunk.timestamp
        };
}

function fillChunksIds(subtitles) {
  return subtitles.map(addChunkId);
}

function splitChunksByPauses(wordChunks) {
  var splitChunks = [];
  wordChunks.forEach(function (chunk, i) {
        var prevWordChunk = wordChunks[i - 1 | 0];
        var prevChunkGroup = Utils.$$Array.last(splitChunks);
        if (prevWordChunk !== undefined) {
          if (prevChunkGroup !== undefined) {
            if (Core__Option.getOr(Core__Option.map(Caml_option.nullable_to_opt(prevWordChunk.timestamp[1]), (function (prevEnd) {
                          return chunk.timestamp[0] - prevEnd > 0.2;
                        })), false)) {
              splitChunks.push([chunk]);
            } else {
              prevChunkGroup.push(chunk);
            }
          } else {
            splitChunks.push([chunk]);
          }
        } else {
          splitChunks.push([chunk]);
        }
      });
  return splitChunks;
}

var trim_syntax_ending_punctuation_regexp = /[.,!?。！？]$/;

function resizeChunks(chunkGroups, maxSize) {
  return chunkGroups.flatMap(function (group) {
                var totalGroupCharLength = Core__Array.reduce(group, 0, (function (acc, chunk) {
                        return acc + chunk.text.length | 0;
                      }));
                if (totalGroupCharLength > maxSize) {
                  var relation = totalGroupCharLength / maxSize;
                  var subChunkSize = Math.ceil(group.length / relation) | 0;
                  var subChunks = [];
                  for(var i = 0 ,i_finish = relation | 0; i <= i_finish; ++i){
                    var subChunk = group.slice(Math.imul(i, subChunkSize), Math.imul(i + 1 | 0, subChunkSize));
                    if (subChunk.length > 0) {
                      var chunk = Core__Option.getExn(subChunk[0], "Missing original chunk when calculating subgroup");
                      var chunk$1 = Core__Option.getExn(Utils.$$Array.last(subChunk), "Missing original chunk when calculating subgroup");
                      subChunks.push({
                            id: Math.random(),
                            text: Core__Array.reduce(subChunk, "", (function (acc, chunk) {
                                    return acc + chunk.text;
                                  })),
                            isInProgress: subChunk[0].isInProgress,
                            timestamp: [
                              chunk.timestamp[0],
                              chunk$1.timestamp[1]
                            ]
                          });
                    }
                    
                  }
                  return subChunks;
                }
                var combinedText = Core__Array.reduce(group, "", (function (acc, chunk) {
                        return acc + chunk.text;
                      }));
                var chunk$2 = group[group.length - 1 | 0];
                return [{
                          id: Math.random(),
                          text: combinedText,
                          isInProgress: group[0].isInProgress,
                          timestamp: [
                            group[0].timestamp[0],
                            chunk$2.timestamp[1]
                          ]
                        }];
              }).map(function (chunk) {
              return {
                      id: chunk.id,
                      text: chunk.text.trim().replace(trim_syntax_ending_punctuation_regexp, ""),
                      isInProgress: chunk.isInProgress,
                      timestamp: chunk.timestamp
                    };
            });
}

function editChunkText(chunks, index, newText) {
  return chunks.map(function (chunk, i) {
              if (i === index) {
                return {
                        id: chunk.id,
                        text: newText,
                        isInProgress: chunk.isInProgress,
                        timestamp: chunk.timestamp
                      };
              } else {
                return chunk;
              }
            });
}

function sortChunks(chunks) {
  return chunks.toSorted(function (a, b) {
              var match = a.timestamp;
              var match$1 = b.timestamp;
              return match[0] - match$1[0];
            });
}

function editChunkTimestamp(chunks, index, newTimestamp) {
  return sortChunks(chunks.map(function (chunk, i) {
                  if (i === index) {
                    return {
                            id: chunk.id,
                            text: chunk.text,
                            isInProgress: chunk.isInProgress,
                            timestamp: newTimestamp
                          };
                  } else {
                    return chunk;
                  }
                }));
}

function removeChunk(chunks, index, joinSiblingsTimestamps) {
  var chunkToRemove = chunks[index];
  return Core__Option.getOr(Core__Option.map(chunkToRemove, (function (chunkToRemove) {
                    return Utils.$$Array.filterMapWithIndex(chunks, (function (chunk, i) {
                                  if (i === index) {
                                    return ;
                                  } else if (joinSiblingsTimestamps && i === (index - 1 | 0)) {
                                    return {
                                            id: chunk.id,
                                            text: chunk.text,
                                            isInProgress: chunk.isInProgress,
                                            timestamp: [
                                              chunk.timestamp[0],
                                              chunkToRemove.timestamp[1]
                                            ]
                                          };
                                  } else if (joinSiblingsTimestamps && i === (index + 1 | 0)) {
                                    return {
                                            id: chunk.id,
                                            text: chunk.text,
                                            isInProgress: chunk.isInProgress,
                                            timestamp: [
                                              Core__Option.getOr(Caml_option.nullable_to_opt(chunkToRemove.timestamp[1]), chunk.timestamp[0]),
                                              chunk.timestamp[1]
                                            ]
                                          };
                                  } else {
                                    return chunk;
                                  }
                                }));
                  })), chunks);
}

export {
  start ,
  end ,
  isChunkDisplayed ,
  lookupCurrentCue ,
  lookUpLastPlayedCue ,
  getOrLookupCurrentCue ,
  averageChunkLength ,
  addChunkId ,
  fillChunksIds ,
  splitChunksByPauses ,
  trim_syntax_ending_punctuation_regexp ,
  resizeChunks ,
  editChunkText ,
  sortChunks ,
  editChunkTimestamp ,
  removeChunk ,
}
/* Utils Not a pure module */
