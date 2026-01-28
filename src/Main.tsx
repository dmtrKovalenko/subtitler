/// <reference types="vite-plugin-pwa/client" />
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import LolApp from "./LolApp";
import { BrowserNotSupported, isBrowserSupported } from "./BrowserNotSupported";
import { ErrorBoundary } from "./ErrorBoundary";
import { registerSW } from "virtual:pwa-register";
import * as Sentry from "@sentry/react";

// Only register service worker in production
if (import.meta.env.PROD) {
  registerSW({ 
    immediate: false,
    onRegisteredSW(swUrl, _registration) {
      console.log('SW registered:', swUrl);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    }
  });
}

Sentry.init({
  dsn: "https://c0ff8dd14d638c4e77dfa9c25e4bd42d@o464504.ingest.us.sentry.io/4508197084725248",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/subtitles\.fframes\.studio/
  ],
  enabled: process.env.NODE_ENV !== 'development',
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
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
