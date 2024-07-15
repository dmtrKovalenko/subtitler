import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import LolApp from "./LolApp";
import { BrowserNotSupported, isBrowserSupported } from "./BrowserNotSupported";
import { ErrorBoundary } from "./ErrorBoundary";

const rootElement = document.querySelector("#root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  const browserFeatures = isBrowserSupported();
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        {browserFeatures === true ? (
          <LolApp />
        ) : (
          <BrowserNotSupported features={browserFeatures} />
        )}
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
