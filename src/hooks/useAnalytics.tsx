export function createLogger(): (
  label: string,
  options?: { props?: any; callback?: () => void },
) => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  return (
    // @ts-expect-error analytics types
    window.plausible || console.log
  );
}

export function logException(
  error: unknown,
  info?: React.ErrorInfo | undefined,
) {
  // @ts-expect-error analytics types
  if (!window.plausible) {
    return console.error(error, info);
  }

  createLogger()("error", {
    props: {
      error,
      info,
    },
  });
}
