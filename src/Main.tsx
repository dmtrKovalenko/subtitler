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
  ignoreErrors: [
    // Browser extension errors (password managers, etc.)
    "ControlLooksLikePasswordCredentialField",
    "Cannot read properties of null (reading 'ControlLooksLikePasswordCredentialField')",
    // Other common extension-related errors
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Extensions injecting scripts
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
  ],
  beforeSend(event) {
    // Filter out errors from browser extensions
    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
      (frame) => frame.filename?.includes("extension") || 
                 frame.filename?.startsWith("chrome-extension://") ||
                 frame.filename?.startsWith("moz-extension://")
    )) {
      return null;
    }
    return event;
  },
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
