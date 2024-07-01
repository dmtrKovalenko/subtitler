import {
  currentPlayingCue,
  getOrLookupCurrentCue,
  subtitleCue,
} from "../screens/editor/Subtitles.gen";
import { style } from "../screens/editor/Style.gen";
import KonvaCore from "konva/lib/Core";
import type Konva from "konva";
import { Text } from "konva/lib/shapes/Text";

export type RendererContext = {
  stage: Konva.Stage;
  layer: Konva.Layer;
  text: Konva.Text;
  lastPlayedCue: currentPlayingCue | undefined;
  style: style;
  videoCanvasContext: OffscreenCanvasRenderingContext2D | null;
};

// monkeypatch Konva for offscreen canvas usage
KonvaCore.Util.createCanvasElement = () => {
  const canvas = new OffscreenCanvas(1, 1);
  // @ts-ignore
  canvas.style = {};
  return canvas as any;
};

export async function loadGoogleFont(
  family: string,
  weight = 400,
  style = "normal",
) {
  // Base URL for Google Fonts
  const baseURL = "https://fonts.googleapis.com/css";

  // Create the URL for the desired font family and style
  const url = `${baseURL}?family=${encodeURI(family)}:wght@${weight}&display=swap`;
  // Fetch the CSS file that includes the font-face rules
  const response = await fetch(url);
  const cssText = await response.text();

  // because google fonts might have different font files for different languages
  // we need to extract and load all of them
  const fontUrlMatch = cssText.matchAll(/url\((https:\/\/[^)]+)\)/g);
  if (!fontUrlMatch) {
    throw new Error("Failed to load font URL from Google Fonts CSS");
  }

  for (const [cssUrl, _fullUrl] of fontUrlMatch) {
    // Create a new FontFace object
    const font = new FontFace(family, cssUrl, {
      style,
      weight: weight.toString(),
    });

    font.load();
    // @ts-expect-error not properly typed `self` for some reason
    self.fonts.add(font);
  }

  // @ts-expect-error not properly typed `self` for some reason
  await self.fonts.ready;
}

export function createCtx(
  videoConfig: VideoDecoderConfig,
  canvas: OffscreenCanvas,
  style: style,
): RendererContext {
  // @ts-expect-error
  let stage = new KonvaCore.Stage({
    width: videoConfig.codedWidth,
    height: videoConfig.codedHeight,
  });

  let text = new Text({
    fillAfterStrokeEnabled: true,
    fontStyle: style.fontWeight.toString(),
    x: style.x,
    y: style.y,
    fontSize: style.fontSizePx,
    fontFamily: style.fontFamily,
    fill: style.color,
    stroke: style.strokeColor,
    align: style.align.toLowerCase(),
    width: style.blockSize.width,
  });

  let layer = new KonvaCore.Layer();
  layer.add(text);
  stage.add(layer);

  return {
    stage,
    layer,
    text,
    style,
    lastPlayedCue: undefined,
    videoCanvasContext: canvas.getContext("2d"),
  };
}

export function renderCue(
  cues: subtitleCue[],
  frame: VideoFrame,
  ctx: RendererContext,
) {
  const timestamp = frame.timestamp;
  const currentCue = getOrLookupCurrentCue(
    timestamp / 1e6,
    cues,
    ctx.lastPlayedCue,
  );

  if (!currentCue || currentCue.currentCue.text.trim() === "") {
    return frame;
  }

  if (currentCue?.currentCue?.text !== ctx.lastPlayedCue?.currentCue?.text) {
    ctx.text.setAttr("text", currentCue?.currentCue?.text ?? "");
    ctx.layer.draw();
  }
  ctx.lastPlayedCue = currentCue;

  if (!ctx.videoCanvasContext) {
    throw new Error("Can't access video canvas context");
  }

  ctx.videoCanvasContext.drawImage(
    frame,
    0,
    0,
    frame.displayWidth,
    frame.displayHeight,
  );
  ctx.videoCanvasContext.drawImage(
    ctx.layer.getCanvas()._canvas,
    0,
    0,
    frame.displayWidth,
    frame.displayHeight,
  );

  frame.close();

  return new VideoFrame(ctx.videoCanvasContext.canvas, { timestamp });
}
