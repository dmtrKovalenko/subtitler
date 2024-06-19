import { SVGProps, memo } from "react";

export const SubtitlesStrikethrough = (props: SVGProps<SVGSVGElement>) => (
  <span className="relative line-through decoration-orange-500">
    {props.children}
    <span className="absolute animate-light-swing -right-4 -top-8 text-orange-500 text-4xl font-normal font-virgin ">
      <span className="sr-only">or</span>
      subtitles
    </span>
  </span>
);
const Memo = memo(SubtitlesStrikethrough);
