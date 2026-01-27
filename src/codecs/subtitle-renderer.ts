import {
  currentPlayingCue,
  getOrLookupCurrentCue,
  subtitleCue,
} from "../screens/editor/Subtitles.gen";
import { style } from "../screens/editor/Style.gen";
import { wordChunk } from "../screens/editor/WordTimestamps.gen";
import KonvaCore from "konva/lib/Core";
import type Konva from "konva";
import { Text } from "konva/lib/shapes/Text";
import { Rect } from "konva/lib/shapes/Rect";
import { Group } from "konva/lib/Group";

// Word animation data for export
export type WordAnimationData = {
  wordChunks: wordChunk[];
  cueRanges: Array<[number, number]>;
};

export type RendererContext = {
  stage: Konva.Stage;
  layer: Konva.Layer;
  text: Konva.Text;
  background: Konva.Rect | null;
  lastPlayedCue: currentPlayingCue | undefined;
  style: style;
  videoCanvasContext: OffscreenCanvasRenderingContext2D | null;
  // Word animation support
  wordAnimationData?: WordAnimationData;
  wordGroup?: Konva.Group;
  wordTexts?: Konva.Text[];
  wordBackgrounds?: Konva.Rect[];
  lastActiveWordIndex?: number;
  // For smooth background animation
  prevWordPosition?: { x: number; y: number; width: number };
  animatedBgRect?: Konva.Rect;
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

function findActiveWordIndex(
  wordChunks: wordChunk[],
  currentTs: number,
): number {
  for (let i = 0; i < wordChunks.length; i++) {
    const [start, end] = wordChunks[i].timestamp;
    const endTs = end ?? wordChunks[i + 1]?.timestamp[0] ?? start + 0.5;
    if (currentTs >= start && currentTs < endTs) {
      return i;
    }
  }
  return -1;
}

function getWordChunksForCue(
  wordAnimationData: WordAnimationData,
  cueIndex: number,
): wordChunk[] | null {
  const cueRange = wordAnimationData.cueRanges[cueIndex];
  if (!cueRange) return null;
  const [startIdx, endIdx] = cueRange;
  return wordAnimationData.wordChunks.slice(startIdx, endIdx + 1);
}

type WordPosition = {
  word: wordChunk;
  x: number;
  y: number;
  width: number;
  index: number;
};

function measureTextWidth(text: string, style: style): number {
  const tempText = new Text({
    text,
    fontSize: style.fontSizePx,
    fontFamily: style.fontFamily,
    fontStyle: style.fontWeight >= 700 ? "bold" : "normal",
  });
  return tempText.width();
}

function calculateWordPositions(
  wordChunks: wordChunk[],
  style: style,
): WordPosition[] {
  const positions: WordPosition[] = [];
  const blockWidth = style.blockSize.width;
  const lineHeight = style.fontSizePx * 1.2;

  const spaceWidth = measureTextWidth(" ", style);
  let lineWords: { word: wordChunk; width: number; index: number }[] = [];
  let lineWidth = 0;

  // First pass: group words into lines
  const lines: { word: wordChunk; width: number; index: number }[][] = [];

  for (let i = 0; i < wordChunks.length; i++) {
    const word = wordChunks[i];
    const wordText = word.text.trim();
    const wordWidth = measureTextWidth(wordText, style);

    const neededWidth =
      lineWords.length > 0 ? spaceWidth + wordWidth : wordWidth;

    if (lineWidth + neededWidth > blockWidth && lineWords.length > 0) {
      // start new line
      lines.push(lineWords);
      lineWords = [{ word, width: wordWidth, index: i }];
      lineWidth = wordWidth;
    } else {
      lineWords.push({ word, width: wordWidth, index: i });
      lineWidth += neededWidth;
    }
  }

  // last line
  if (lineWords.length > 0) {
    lines.push(lineWords);
  }

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineY = lineIdx * lineHeight;

    let totalLineWidth = 0;
    for (let i = 0; i < line.length; i++) {
      totalLineWidth += line[i].width;
      if (i < line.length - 1) totalLineWidth += spaceWidth;
    }

    // Calculate starting X based on alignment
    let startX = 0;
    if (style.align === "Center") {
      startX = (blockWidth - totalLineWidth) / 2;
    } else if (style.align === "Right") {
      startX = blockWidth - totalLineWidth;
    }

    let currentX = startX;
    for (const { word, width, index } of line) {
      positions.push({
        word,
        x: currentX,
        y: lineY,
        width,
        index,
      });
      currentX += width + spaceWidth;
    }
  }

  return positions;
}

export function createCtx(
  videoConfig: VideoDecoderConfig,
  canvas: OffscreenCanvas,
  style: style,
  wordAnimationData?: WordAnimationData,
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

  let background = style.showBackground
    ? new Rect({
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
        width: text.width() + style.background.paddingX * 2,
        height: text.height() + style.background.paddingY * 2,
      })
    : null;

  let layer = new KonvaCore.Layer();
  if (background) {
    layer.add(background);
  }

  layer.add(text);
  stage.add(layer);

  let wordGroup: Konva.Group | undefined;
  let wordTexts: Konva.Text[] | undefined;
  let wordBackgrounds: Konva.Rect[] | undefined;

  if (style.wordAnimation && wordAnimationData) {
    wordGroup = new Group({
      x: style.x,
      y: style.y,
      visible: false,
    });

    wordTexts = [];
    wordBackgrounds = [];

    // Pre-create text and background elements for word animation
    // These will be repositioned and shown/hidden dynamically
    layer.add(wordGroup);
  }

  return {
    stage,
    layer,
    text,
    style,
    background,
    lastPlayedCue: undefined,
    videoCanvasContext: canvas.getContext("2d"),
    wordAnimationData,
    wordGroup,
    wordTexts,
    wordBackgrounds,
    lastActiveWordIndex: -1,
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

function updateWordAnimationLayer(
  ctx: RendererContext,
  currentCue: currentPlayingCue | undefined,
  timestamp: number,
): void {
  if (
    !ctx.wordAnimationData ||
    !ctx.style.showWordAnimation ||
    !ctx.wordGroup
  ) {
    return;
  }

  const wordAnim = ctx.style.wordAnimation;

  // If no current cue, hide the word group
  if (!currentCue) {
    ctx.wordGroup.hide();
    ctx.text.show();
    ctx.layer.draw();
    return;
  }

  const cueWordChunks = getWordChunksForCue(
    ctx.wordAnimationData,
    currentCue.currentIndex,
  );

  if (!cueWordChunks || cueWordChunks.length === 0) {
    ctx.wordGroup.hide();
    ctx.text.show();
    ctx.layer.draw();
    return;
  }

  // if we need to render a group just show the layer
  ctx.text.hide();
  ctx.wordGroup.show();

  const positions = calculateWordPositions(cueWordChunks, ctx.style);

  const activeWordIndex = findActiveWordIndex(cueWordChunks, timestamp);
  const activePos =
    activeWordIndex >= 0
      ? positions.find((p) => p.index === activeWordIndex)
      : null;

  // Calculate animation progress within current word (0-1)
  let animationProgress = 0;
  if (activeWordIndex >= 0) {
    const word = cueWordChunks[activeWordIndex];
    const [start, end] = word.timestamp;
    const endTs =
      end ?? cueWordChunks[activeWordIndex + 1]?.timestamp[0] ?? start + 0.5;
    const duration = endTs - start;
    if (duration > 0) {
      animationProgress = Math.min(
        1,
        Math.max(0, (timestamp - start) / duration),
      );
    }
  }

  ctx.wordGroup.destroyChildren();

  let popScale = 1;
  if (wordAnim.showPop && activePos) {
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const popProgress = animationProgress;

    if (popProgress < 0.2) {
      const t = popProgress / 0.2;
      popScale = 1 + (wordAnim.pop.scale - 1) * easeOutCubic(t);
    } else if (popProgress > 0.8) {
      const t = (popProgress - 0.8) / 0.2;
      popScale =
        wordAnim.pop.scale - (wordAnim.pop.scale - 1) * easeOutCubic(t);
    } else {
      popScale = wordAnim.pop.scale;
    }
  }

  // for background calcualte interpolated position
  if (activePos && wordAnim.showBackground) {
    const prevPos = ctx.prevWordPosition;
    let bgX = activePos.x;
    let bgY = activePos.y;
    let bgWidth = activePos.width;

    if (prevPos && ctx.lastActiveWordIndex !== activeWordIndex) {
      // Smooth transition from previous to current position
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const t = easeOutCubic(Math.min(animationProgress * 3, 1)); // Complete in ~33% of word duration

      bgX = prevPos.x + (activePos.x - prevPos.x) * t;
      bgY = prevPos.y + (activePos.y - prevPos.y) * t;
      bgWidth = prevPos.width + (activePos.width - prevPos.width) * t;
    }

    // Calculate scaled background dimensions
    const bgPadX = wordAnim.background.paddingX;
    const bgPadY = wordAnim.background.paddingY;
    const bgBaseWidth = bgWidth + bgPadX * 2;
    const bgBaseHeight = ctx.style.fontSizePx + bgPadY * 2;
    const bgScaledWidth = bgBaseWidth * popScale;
    const bgScaledHeight = bgBaseHeight * popScale;
    // Offset to scale from center
    const bgOffsetX = (bgScaledWidth - bgBaseWidth) / 2;
    const bgOffsetY = (bgScaledHeight - bgBaseHeight) / 2;

    const bgRect = new Rect({
      x: bgX - bgPadX - bgOffsetX,
      y: bgY - bgPadY - bgOffsetY,
      width: bgScaledWidth,
      height: bgScaledHeight,
      fill: wordAnim.background.color,
      opacity: wordAnim.background.opacity,
      cornerRadius: wordAnim.background.borderRadius,
    });
    ctx.wordGroup.add(bgRect);

    ctx.prevWordPosition = {
      x: activePos.x,
      y: activePos.y,
      width: activePos.width,
    };
  }

  for (const pos of positions) {
    const isActive = pos.index === activeWordIndex;

    let fillColor = ctx.style.color;
    let fontWeight = ctx.style.fontWeight;
    let offsetX = 0;
    let offsetY = 0;

    if (isActive) {
      // Font effect: change text color and/or font weight (fallback to main style)
      if (wordAnim.showFont) {
        fillColor = wordAnim.font.color ?? ctx.style.color;
        fontWeight = wordAnim.font.fontWeight ?? ctx.style.fontWeight;
      }

      if (wordAnim.showPop) {
        // Offset to scale from center of the word
        offsetX = (pos.width * (popScale - 1)) / 2;
        offsetY = (ctx.style.fontSizePx * (popScale - 1)) / 2;
      }
    }

    const wordText = new Text({
      x: pos.x - offsetX,
      y: pos.y - offsetY,
      scaleX: popScale,
      scaleY: popScale,
      text: pos.word.text.trim(),
      fill: fillColor,
      fontSize: ctx.style.fontSizePx,
      fontStyle: fontWeight >= 700 ? "bold" : "normal",
      fontFamily: ctx.style.fontFamily,
      stroke: ctx.style.strokeColor,
      strokeWidth: ctx.style.strokeWidth,
      strokeEnabled: ctx.style.strokeColor !== ctx.style.color,
      fillAfterStrokeEnabled: true,
    });
    ctx.wordGroup.add(wordText);
  }

  // redraw background for the whole block
  if (ctx.background) {
    const lineHeight = ctx.style.fontSizePx * 1.2;
    const totalHeight =
      positions.length > 0
        ? Math.max(...positions.map((p) => p.y)) + lineHeight
        : lineHeight;

    ctx.background.setAttrs({
      x: ctx.style.x - ctx.style.background.paddingX,
      y: ctx.style.y - ctx.style.background.paddingY,
      width: ctx.style.blockSize.width + ctx.style.background.paddingX * 2,
      height: totalHeight + ctx.style.background.paddingY * 2,
    });
    ctx.background.show();
  }

  ctx.lastActiveWordIndex = activeWordIndex;
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

  const timestampSeconds = timestamp / 1e6;
  const currentCue = getOrLookupCurrentCue(
    timestampSeconds,
    cues,
    ctx.lastPlayedCue,
  );

  const useWordAnimation = ctx.style.showWordAnimation && ctx.wordAnimationData;

  // when we do word aniamtion we rerender on every frame just because we never know
  // if we need to animate withing a word group or not so we just render on every frame
  if (useWordAnimation) {
    updateWordAnimationLayer(ctx, currentCue, timestampSeconds);
  } else if (
    currentCue?.currentCue?.text !== ctx.lastPlayedCue?.currentCue?.text
  ) {
    updateTextLayer(ctx, currentCue);
  }

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

  const currentCue = getOrLookupCurrentCue(timestamp, cues, ctx.lastPlayedCue);

  // Check if we should use word animation
  const useWordAnimation = ctx.style.showWordAnimation && ctx.wordAnimationData;

  if (useWordAnimation) {
    // Word animation mode - need to update on every frame for word highlighting
    updateWordAnimationLayer(ctx, currentCue, timestamp);
  } else {
    // Standard mode - only update when cue changes
    if (currentCue?.currentCue?.text !== ctx.lastPlayedCue?.currentCue?.text) {
      updateTextLayer(ctx, currentCue);
    }
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
