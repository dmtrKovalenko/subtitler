import * as React from "react";
import { shortcuts } from "./Dock.gen";
import { formatAction, shortcut, action } from "./Shortcut.gen";

const GROUPED_SHORTCUTS = shortcuts.reduce(
  (result, currentValue) => {
    const groupKey = currentValue.action;
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(currentValue);
    return result;
  },
  {} as { [key: string]: shortcut<action>[] },
);

function formatKey(key: string) {
  switch (key) {
    case " ":
      return "Space";
    case "Meta":
      if (navigator.platform.includes("Mac")) {
        return "⌘";
      } else {
        return "Ctrl";
      }
    case "ArrowLeft":
      return "←";
    case "ArrowRight":
      return "→";
    case "ArrowUp":
      return "↑";
    case "ArrowDown":
      return "↓";
    default:
      return key;
  }
}

export function WelcomeScreen() {
  return (
    <div className="@container origin-top-left size-full flex items-center justify-center flex-col absolute left-0 top-0">
      <h2 className="text-center text-2xl font-medium">
        Welcome to the editor!
      </h2>
      <p className="mb-4 text-center text-balance text-sm text-gray-300">
        Here are some keyboard shortcuts that might help:
      </p>
      <ul className="max-h-full p-4 min-w-2/3 grid @xl:grid-cols-2 gap-y-1 gap-x-8 overflow-auto rounded-lg bg-white/10 backdrop-blur-xl">
        {Object.keys(GROUPED_SHORTCUTS).map((action) => {
          const shortcuts = GROUPED_SHORTCUTS[action as action];
          return (
            <li className="flex items-center gap-2" key={action}>
              <dd className="text-sm whitespace-nowrap">
                {formatAction(action as action)}
              </dd>
              <dt className="flex items-center gap-2">
                {shortcuts.map((shortcut: shortcut<action>, i) => (
                  <React.Fragment key={shortcut.key}>
                    <kbd className="whitespace-nowrap text-xs bg-slate-700 py-1 px-2 shadow-lg rounded-lg">
                      {shortcut.modifier !== "NoModifier" &&
                        formatKey(shortcut.modifier) + " + "}
                      {formatKey(shortcut.key)}
                    </kbd>
                    {i < shortcuts.length - 1 && (
                      <span className="text-gray-300 text-xs">or</span>
                    )}
                  </React.Fragment>
                ))}
              </dt>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
