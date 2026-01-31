import { style } from "../screens/editor/Style.gen";
import { wordChunk } from "../screens/editor/WordTimestamps.gen";

export type WordPosition = {
  word: wordChunk;
  x: number;
  y: number;
  width: number;
  index: number;
};

export function findActiveWordIndex(
  wordChunks: wordChunk[],
  currentTs: number
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

export function calculateAnimationProgress(
  wordChunks: wordChunk[],
  activeWordIndex: number,
  currentTs: number
): number {
  if (activeWordIndex < 0) return 0;
  const word = wordChunks[activeWordIndex];
  const [start, end] = word.timestamp;
  const endTs = end ?? wordChunks[activeWordIndex + 1]?.timestamp[0] ?? start + 0.5;
  const duration = endTs - start;
  if (duration <= 0) return 1;
  return Math.min(1, Math.max(0, (currentTs - start) / duration));
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function calculatePopScale(
  animationProgress: number,
  targetScale: number
): number {
  if (animationProgress < 0.2) {
    const t = animationProgress / 0.2;
    return 1 + (targetScale - 1) * easeOutCubic(t);
  } else if (animationProgress > 0.8) {
    const t = (animationProgress - 0.8) / 0.2;
    return targetScale - (targetScale - 1) * easeOutCubic(t);
  }
  return targetScale;
}

export function calculateWordPositions(
  wordChunks: wordChunk[],
  style: style,
  measureText: (text: string) => number
): WordPosition[] {
  const positions: WordPosition[] = [];
  const blockWidth = style.blockSize.width;
  const lineHeight = style.fontSizePx * 1.2;

  const testWord = "a";
  const spaceWidth = measureText(testWord + " " + testWord) - measureText(testWord + testWord);

  let lineWords: { word: wordChunk; width: number; index: number }[] = [];
  let lineWidth = 0;

  // First pass: group words into lines
  const lines: { word: wordChunk; width: number; index: number }[][] = [];

  for (let i = 0; i < wordChunks.length; i++) {
    const word = wordChunks[i];
    const wordText = word.text.trim();
    const wordWidth = measureText(wordText);

    // Check if word fits on current line (with space before if not first word)
    const neededWidth = lineWords.length > 0 ? spaceWidth + wordWidth : wordWidth;

    if (lineWidth + neededWidth > blockWidth && lineWords.length > 0) {
      // Start new line
      lines.push(lineWords);
      lineWords = [{ word, width: wordWidth, index: i }];
      lineWidth = wordWidth;
    } else {
      lineWords.push({ word, width: wordWidth, index: i });
      lineWidth += neededWidth;
    }
  }

  // Don't forget the last line
  if (lineWords.length > 0) {
    lines.push(lineWords);
  }

  // Second pass: calculate positions with alignment
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineY = lineIdx * lineHeight;

    // Calculate total line width for alignment
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

/**
 * Calculate the total height of word positions
 */
export function calculateTotalHeight(
  positions: WordPosition[],
  fontSizePx: number
): number {
  const lineHeight = fontSizePx * 1.2;
  return positions.length > 0
    ? Math.max(...positions.map((p) => p.y)) + lineHeight
    : lineHeight;
}

/**
 * Calculate the actual width of text based on word positions (widest line)
 */
export function calculateActualWidth(
  positions: WordPosition[],
  fontSizePx: number
): number {
  if (positions.length === 0) return 0;
  
  const lineHeight = fontSizePx * 1.2;
  
  // Group positions by line (same y value within tolerance)
  const lineWidths: number[] = [];
  let currentLineY = positions[0].y;
  let currentLineMaxX = 0;
  let currentLineMinX = Infinity;
  
  for (const pos of positions) {
    // Check if this is a new line (y position changed significantly)
    if (Math.abs(pos.y - currentLineY) > lineHeight * 0.5) {
      // Save previous line's width
      if (currentLineMinX !== Infinity) {
        lineWidths.push(currentLineMaxX - currentLineMinX);
      }
      // Start new line
      currentLineY = pos.y;
      currentLineMinX = pos.x;
      currentLineMaxX = pos.x + pos.width;
    } else {
      currentLineMinX = Math.min(currentLineMinX, pos.x);
      currentLineMaxX = Math.max(currentLineMaxX, pos.x + pos.width);
    }
  }
  
  // Don't forget the last line
  if (currentLineMinX !== Infinity) {
    lineWidths.push(currentLineMaxX - currentLineMinX);
  }
  
  return lineWidths.length > 0 ? Math.max(...lineWidths) : 0;
}

export function interpolateBackgroundPosition(
  activePos: { x: number; y: number; width: number },
  prevPos: { x: number; y: number; width: number } | null | undefined,
  animationProgress: number,
  isNewWord: boolean
): { x: number; y: number; width: number } {
  if (prevPos && isNewWord) {
    // Animate from previous word position to current
    const t = easeOutCubic(Math.min(animationProgress * 3, 1)); // Complete in ~33% of word duration
    return {
      x: prevPos.x + (activePos.x - prevPos.x) * t,
      y: prevPos.y + (activePos.y - prevPos.y) * t,
      width: prevPos.width + (activePos.width - prevPos.width) * t,
    };
  }
  return activePos;
}

/**
 * Slide transition state to track continuous background animation
 */
export type SlideTransitionState = {
  // Position we're animating FROM (captured when word changed)
  fromPos: { x: number; y: number; width: number };
  // Which word we're animating to
  toWordIndex: number;
  // Animation progress (within the word) when we started this transition
  startProgress: number;
};

/**
 * Calculate slide animation position with continuous interpolation.
 * This function tracks the transition state and smoothly animates the background
 * from the previous word position to the current active word position.
 * 
 * @param activePos - Current active word position (target)
 * @param activeWordIndex - Index of the current active word
 * @param animationProgress - Progress through the current word (0-1)
 * @param transitionState - Current transition state
 * @param prevActivePos - Position of the PREVIOUS active word (needed when word changes)
 * @param slideDuration - Duration of slide as fraction of word duration (default 0.3 = 30%)
 * @returns Interpolated position for the background
 */
export function calculateSlidePosition(
  activePos: { x: number; y: number; width: number },
  activeWordIndex: number,
  animationProgress: number,
  transitionState: SlideTransitionState | null,
  prevActivePos: { x: number; y: number; width: number } | null,
  slideDuration: number = 0.3
): {
  position: { x: number; y: number; width: number };
  newTransitionState: SlideTransitionState | null;
} {
  // No active word - return as-is
  if (activeWordIndex < 0) {
    return { position: activePos, newTransitionState: null };
  }

  // First word or no previous state - snap to position, no animation
  if (!transitionState) {
    const newState: SlideTransitionState = {
      fromPos: { ...activePos },
      toWordIndex: activeWordIndex,
      startProgress: 0,
    };
    return { position: activePos, newTransitionState: newState };
  }

  // Word has changed - start a new transition
  if (transitionState.toWordIndex !== activeWordIndex) {
    // Use the previous active position as our starting point
    // If we don't have it, use where we currently are based on old transition
    let fromPos: { x: number; y: number; width: number };
    
    if (prevActivePos) {
      // We have the previous word's position - start from there
      fromPos = { ...prevActivePos };
    } else {
      // Fallback: calculate where we were in the old transition
      // This uses the old fromPos as an approximation
      fromPos = { ...transitionState.fromPos };
    }

    const newState: SlideTransitionState = {
      fromPos,
      toWordIndex: activeWordIndex,
      startProgress: animationProgress,
    };

    // Calculate position for this frame
    const position = interpolateSlideProgress(
      newState.fromPos,
      activePos,
      newState.startProgress,
      animationProgress,
      slideDuration
    );

    return { position, newTransitionState: newState };
  }

  // Same word - continue the transition
  const position = interpolateSlideProgress(
    transitionState.fromPos,
    activePos,
    transitionState.startProgress,
    animationProgress,
    slideDuration
  );

  return { position, newTransitionState: transitionState };
}

/**
 * Interpolate between two positions based on animation progress.
 */
function interpolateSlideProgress(
  fromPos: { x: number; y: number; width: number },
  toPos: { x: number; y: number; width: number },
  startProgress: number,
  currentProgress: number,
  slideDuration: number
): { x: number; y: number; width: number } {
  // Calculate how far through the transition we are
  const elapsed = currentProgress - startProgress;
  const t = Math.min(1, Math.max(0, elapsed / slideDuration));
  const easedT = easeOutCubic(t);

  return {
    x: fromPos.x + (toPos.x - fromPos.x) * easedT,
    y: fromPos.y + (toPos.y - fromPos.y) * easedT,
    width: fromPos.width + (toPos.width - fromPos.width) * easedT,
  };
}

export function calculateScaledBackground(
  bgWidth: number,
  fontSizePx: number,
  paddingX: number,
  paddingY: number,
  popScale: number
): {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
} {
  const bgBaseWidth = bgWidth + paddingX * 2;
  const bgBaseHeight = fontSizePx + paddingY * 2;
  const bgScaledWidth = bgBaseWidth * popScale;
  const bgScaledHeight = bgBaseHeight * popScale;
  return {
    width: bgScaledWidth,
    height: bgScaledHeight,
    offsetX: (bgScaledWidth - bgBaseWidth) / 2,
    offsetY: (bgScaledHeight - bgBaseHeight) / 2,
  };
}
