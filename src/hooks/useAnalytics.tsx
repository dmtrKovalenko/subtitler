export function log(
  label: string,
  options?: { props?: any; callback?: () => void },
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const logFn =
    // @ts-expect-error analytics types
    window.plausible || console.log;

  logFn(label, options);
}

export function logException(
  error: unknown,
  info?: React.ErrorInfo | undefined,
) {
  // @ts-expect-error analytics types
  if (!window.plausible) {
    return console.error(error, info);
  }

  log("error", {
    props: {
      error,
      info,
    },
  });
}
