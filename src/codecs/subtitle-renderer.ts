import {
  currentPlayingCue,
  getOrLookupCurrentCue,
  subtitleCue,
} from "../screens/editor/Subtitles.gen";
import { style } from "../screens/editor/Style.gen";
import KonvaCore from "konva/lib/Core";
import type Konva from "konva";
import { Text } from "konva/lib/shapes/Text";
import { Rect } from "konva/lib/shapes/Rect";
export type RendererContext = {
  stage: Konva.Stage;
  layer: Konva.Layer;
  text: Konva.Text;
  background: Konva.Rect | null;
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
    strokeWidth: style.strokeWidth,
    strokeEnabled: style.strokeColor !== style.color,
  });

  let background = style.showBackground ? new Rect({
    fill: style.background.color,
    stroke: style.background.strokeColor,
    strokeWidth: style.background.strokeWidth,
    opacity: style.background.opacity,
    shadowForStrokeEnabled: false,
    perfectDrawEnabled: false,
    cornerRadius: style.background.borderRadius,
    fillAfterStrokeEnabled: true,
    visible: style.showBackground,
    x: text.x() - style.background.paddingX,
    y: text.y() - style.background.paddingY,
    width: text.width() + (style.background.paddingX * 2),
    height: text.height() + (style.background.paddingY * 2),
  }) : null;

  let layer = new KonvaCore.Layer();
  if (background) {
    layer.add(background);
  }

  layer.add(text);
  stage.add(layer);

  return {
    stage,
    layer,
    text,
    style,
    background,
    lastPlayedCue: undefined,
    videoCanvasContext: canvas.getContext("2d"),
  };
}

/**
 * Updates the text layer with the current cue and redraws if changed.
 * Handles text content, background visibility, and positioning.
 */
function updateTextLayer(
  ctx: RendererContext,
  currentCue: currentPlayingCue | undefined,
): void {
  ctx.text.setAttr("text", currentCue?.currentCue?.text ?? "");

  if (ctx.background) {
    if (!currentCue) {
      ctx.background.hide();
    } else {
      ctx.background.show();
    }

    ctx.background.setAttrs({
      x: ctx.text.x() - ctx.style.background.paddingX,
      y: ctx.text.y() - ctx.style.background.paddingY,
      width: ctx.text.width() + ctx.style.background.paddingX * 2,
      height: ctx.text.height() + ctx.style.background.paddingY * 2,
    });
  }

  ctx.layer.draw();
}

/**
 * Checks if the current cue has non-empty text content.
 */
function hasVisibleCue(currentCue: currentPlayingCue | undefined): boolean {
  return !!(currentCue && currentCue.currentCue?.text?.trim() !== "");
}

export function renderCue(
  cues: subtitleCue[],
  frame: VideoFrame,
  ctx: RendererContext,
): VideoFrame {
  if (!ctx.videoCanvasContext) {
    throw new Error("Can't access video canvas context");
  }

  const timestamp = frame.timestamp;
  const frameOptions = {
    alpha: "discard" as const,
    timestamp: frame.timestamp,
    displayWidth: frame.displayWidth,
    displayHeight: frame.displayHeight,
    colorSpace: frame.colorSpace,
    format: frame.format,
  };

  // render the video frame itself
  ctx.videoCanvasContext.drawImage(
    frame,
    0,
    0,
    frame.displayWidth,
    frame.displayHeight,
  );
  frame.close();

  const currentCue = getOrLookupCurrentCue(
    timestamp / 1e6,
    cues,
    ctx.lastPlayedCue,
  );

  // update the text layer canvas if needed
  if (currentCue?.currentCue?.text !== ctx.lastPlayedCue?.currentCue?.text) {
    updateTextLayer(ctx, currentCue);
  }

  // render text layer if current cue is not empty
  if (hasVisibleCue(currentCue)) {
    ctx.videoCanvasContext.drawImage(
      ctx.layer.getCanvas()._canvas,
      0,
      0,
      frameOptions.displayWidth,
      frameOptions.displayHeight,
    );
  }

  ctx.lastPlayedCue = currentCue;
  return new VideoFrame(ctx.videoCanvasContext.canvas, frameOptions);
}

/**
 * Renders subtitle cue onto canvas from a source canvas.
 * @param cues - Array of subtitle cues
 * @param sourceCanvas - Source canvas containing the video frame
 * @param ctx - Renderer context (must be created with the target canvas)
 * @param timestamp - Time in seconds (not microseconds)
 */
export function renderCueOnCanvas(
  cues: subtitleCue[],
  sourceCanvas: HTMLCanvasElement | OffscreenCanvas,
  ctx: RendererContext,
  timestamp: number,
): void {
  if (!ctx.videoCanvasContext) {
    throw new Error("Can't access video canvas context");
  }

  const canvas = ctx.videoCanvasContext.canvas;

  // Draw source video frame to target canvas
  ctx.videoCanvasContext.drawImage(
    sourceCanvas,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const currentCue = getOrLookupCurrentCue(
    timestamp,
    cues,
    ctx.lastPlayedCue,
  );

  // Update the text layer canvas if needed
  if (currentCue?.currentCue?.text !== ctx.lastPlayedCue?.currentCue?.text) {
    updateTextLayer(ctx, currentCue);
  }

  // Render text layer if current cue is not empty
  if (hasVisibleCue(currentCue)) {
    ctx.videoCanvasContext.drawImage(
      ctx.layer.getCanvas()._canvas,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }

  ctx.lastPlayedCue = currentCue;
}
