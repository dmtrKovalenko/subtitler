import * as RadixProgress from "@radix-ui/react-progress";

type ProgressDemoProps = {
  progress: number;
  name: string;
};

export function Progress({ progress, name }: ProgressDemoProps) {
  return (
    <RadixProgress.Root
      className="relative overflow-hidden border-2 border-white rounded-full w-full h-8"
      style={{
        // Fix overflow clipping in Safari
        // https://gist.github.com/domske/b66047671c780a238b51c51ffde8d3a0
        transform: "translateZ(0)",
      }}
      value={progress}
    >
      <RadixProgress.Indicator
        className="bg-white w-full h-full transition-transform duration-[660ms] ease-[cubic-bezier(0.65, 0, 0.35, 1)]"
        style={{ transform: `translateX(-${100 - progress}%)` }}
      />
      <span className="absolute top-0.5 left-4 mix-blend-exclusion">
        {name}
      </span>
      <span className="absolute right-4 top-0.5 mix-blend-exclusion">
        {progress.toFixed(0)}%
      </span>
    </RadixProgress.Root>
  );
}
