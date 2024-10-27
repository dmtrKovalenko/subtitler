import * as React from "react";
import pandaImage from "./assets/fail-panda.gif";
import { logException } from "./hooks/useAnalytics";
import * as Sentry from "@sentry/react";

type ErrorBoundaryProps = {
  children?: React.ReactNode;
};

export class UserFacingError extends Error {
  originalError: unknown;
  stack: string | undefined;

  constructor(message: string, originalError: unknown) {
    super(message);
    this.originalError = originalError;
    this.stack =
      originalError instanceof Error ? originalError.stack : undefined;
  }
}

type ErrorBoundaryState = {
  error: UserFacingError | unknown;
};

export const ShowErrorContext = React.createContext<(error: unknown) => void>(
  () => { },
);

export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: unknown) {
    return {
      error,
    };
  }

  logError = (error: unknown, additionalInfo?: React.ErrorInfo) => {
    logException(error, additionalInfo);

    Sentry.captureException(error,
      {
        contexts: {
          react: {
            ...additionalInfo
          },
        }
      }
    );
  };

  componentDidCatch(e: unknown, additionalInfo: React.ErrorInfo) {
    if (!this.state.error) {
      return;
    }

    this.logError(e, additionalInfo as any);
  }

  getErrorDetails = () => {
    if (this.state.error instanceof UserFacingError) {
      if (this.state.error.originalError instanceof Error) {
        return (
          this.state.error.message +
          "\n" +
          this.state.error.originalError.message +
          "\n" +
          this.state.error.originalError.stack
        );
      }

      return this.state.error.stack;
    }

    let anyError = this.state.error as any;
    if (anyError.RE_EXN_ID) {
      return anyError.RE_EXN_ID + "\n" + anyError.Error.stack;
    }

    if (this.state.error instanceof Error) {
      return this.state.error.message + "\n" + this.state.error.stack;
    }

    return "Unknown error";
  };

  render() {
    if (this.state.error === null) {
      return (
        <ShowErrorContext.Provider
          value={(error) => {
            this.setState({ error });
            this.logError(error);
          }}
        >
          {this.props.children}
        </ShowErrorContext.Provider>
      );
    }

    return (
      <main className="relative isolate w-screen">
        <img
          alt="Panda falling from the stump"
          src={pandaImage}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="-z-10 absolute bg-black/40 h-screen w-screen" />

        <div className="w-screen h-screen mx-auto max-w-7xl px-6 py-32 text-center sm:py-40 lg:px-8">
          <p className="text-base font-semibold leading-8 text-white">
            oops we have a failure
          </p>
          <h1 className="text-5xl font-bold stroke text-shadow drop-shadow-xl tracking-tight text-white sm:text-7xl">
            {this.state.error instanceof UserFacingError
              ? this.state.error.message
              : "Unknown error"}
          </h1>
          <p className="mt-4 text-base text-white/70 sm:mt-6">
            more info for smelly nerds
          </p>

          <div className="max-w-2xl select-all max-h-[20.8rem] bg-white/10 font-medium mx-auto backdrop-blur-3xl whitespace-pre text-left font-mono p-4 rounded-xl overflow-auto">
            {this.getErrorDetails()}
          </div>

          <div className="mt-10 flex justify-center">
            <a href="/" className="text-lg font-semibold leading-7 text-white">
              <span aria-hidden="true">&larr;</span> Retry
            </a>
          </div>
        </div>
      </main>
    );
  }
}
