/// <reference types="vite-plugin-pwa/client" />
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import LolApp from "./LolApp";
import { BrowserNotSupported, isBrowserSupported } from "./BrowserNotSupported";
import { ErrorBoundary } from "./ErrorBoundary";
import { registerSW } from "virtual:pwa-register";
import * as Sentry from "@sentry/react";

registerSW({ immediate: false });

Sentry.init({
  dsn: "https://c0ff8dd14d638c4e77dfa9c25e4bd42d@o464504.ingest.us.sentry.io/4508197084725248",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/subtitles\.fframes\.studio/
  ],
  enabled: process.env.NODE_ENV !== 'development',
  replaysSessionSampleRate: 0.05, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

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
