import * as React from "react";
import { Layer, Line, Stage, Rect, StageProps, Text, Transformer, Group } from "react-konva";
import { subtitleCue } from "./Subtitles.gen";
import { useEditorContext } from "./EditorContext.gen";
import type Konva from "konva";
import { WelcomeScreen } from "./WelcomeScreen";
import clsx from "clsx";
import { subtitlesManager } from "./ChunksList/ChunksList.gen";
import { wordChunk } from "./WordTimestamps.gen";
import { style as StyleType } from "./Style.gen";

type EditorCanvasProps = {
  width: number;
  height: number;
  transcriptionInProgress: boolean;
  subtitles: Array<subtitleCue>;
  subtitlesManager?: subtitlesManager;
} & StageProps;

// Helper to find the active word based on current timestamp
function findActiveWordIndex(
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

// Calculate word positions with line wrapping
type WordPosition = {
  word: wordChunk;
  x: number;
  y: number;
  width: number;
  index: number;
};

function calculateWordPositions(
  wordChunks: wordChunk[],
  style: StyleType,
  measureText: (text: string) => number
): WordPosition[] {
  const positions: WordPosition[] = [];
  const blockWidth = style.blockSize.width;
  const lineHeight = style.fontSizePx * 1.2;
  
  // Measure space width more accurately by comparing text with/without space
  // This accounts for font kerning and natural word spacing
  const testWord = "a";
  const spaceWidth = measureText(testWord + " " + testWord) - measureText(testWord + testWord);

  let lineWords: { word: wordChunk; width: number; index: number }[] = [];
  let lineWidth = 0;

  // First pass: group words into lines
  const lines: { word: wordChunk; width: number; index: number }[][] = [];

  for (let i = 0; i < wordChunks.length; i++) {
    const word = wordChunks[i];
    const wordText = word.text.trim(); // Trim spaces from word
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

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  width,
  height,
  className,
  subtitles,
  subtitlesManager,
  transcriptionInProgress,
  style,
}) => {
  const editorContext = useEditorContext();
  const [player, _] = editorContext.usePlayer();
  const [subtitleStyle, styleDispatch] = editorContext.useStyle();

  const lineHelperXRef = React.useRef<Konva.Line | null>(null);
  const lineHelperYRef = React.useRef<Konva.Line | null>(null);

  const backgroundRef = React.useRef<Konva.Rect | null>(null);
  const textRef = React.useRef<Konva.Text | null>(null);
  const groupRef = React.useRef<Konva.Group | null>(null);
  const transformerRef = React.useRef<Konva.Transformer | null>(null);

  // Measure text width using a temporary canvas
  const measureTextRef = React.useRef<(text: string) => number>(() => 0);
  React.useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    measureTextRef.current = (text: string) => {
      if (!ctx) return 0;
      const fontStyle = subtitleStyle.fontWeight >= 700 ? "bold" : "normal";
      ctx.font = `${fontStyle} ${subtitleStyle.fontSizePx}px "${subtitleStyle.fontFamily}"`;
      return ctx.measureText(text).width;
    };
  }, [subtitleStyle.fontFamily, subtitleStyle.fontSizePx, subtitleStyle.fontWeight]);

  React.useEffect(() => {
    lineHelperXRef.current?.hide();
    lineHelperYRef.current?.hide();

    updateBackground();
    const nodeForTransformer = subtitleStyle.showWordAnimation ? groupRef.current : textRef.current;
    if (nodeForTransformer) {
      transformerRef.current?.nodes([nodeForTransformer]);
      transformerRef.current?.getLayer()?.batchDraw();
    }
  });

  const updateBackground = React.useCallback(() => {
    if (backgroundRef.current && subtitleStyle.showBackground) {
      const node = subtitleStyle.showWordAnimation ? groupRef.current : textRef.current;
      if (!node) return;
      const backgroundNode = backgroundRef.current;

      // Get text dimensions
      const nodeWidth = node.width() * node.scaleX();
      const nodeHeight = node.height() * node.scaleY();

      // Update background position and size
      backgroundNode.setAttrs({
        x: node.x() - subtitleStyle.background.paddingX,
        y: node.y() - subtitleStyle.background.paddingY,
        width: nodeWidth + (subtitleStyle.background.paddingX * 2),
        height: nodeHeight + (subtitleStyle.background.paddingY * 2),
      });
    }
  }, [subtitleStyle.background, subtitleStyle.showBackground, subtitleStyle.showWordAnimation]);

  function handleResize() {
    const node = subtitleStyle.showWordAnimation ? groupRef.current : textRef.current;
    if (node !== null) {
      const newWidth = Math.round(node.width() * node.scaleX());
      const newHeight = Math.round(node.height() * node.scaleY());
      node.setAttrs({
        width: newWidth,
        scaleX: 1,
      });

      styleDispatch({
        TAG: "Resize",
        _0: { width: newWidth, height: newHeight },
      });
    }
  }

  const cueIndexToShow = transcriptionInProgress
    ? 0
    : player.currentPlayingCue?.currentIndex ?? 0;

  const currentSubtitle = player.currentPlayingCue
    ? subtitles[cueIndexToShow]?.text ?? ""
    : "";

  // Get word chunks for current cue if word animation is enabled
  const wordChunks = React.useMemo(() => {
    if (!subtitleStyle.showWordAnimation || !subtitlesManager || !player.currentPlayingCue) {
      return null;
    }
    return subtitlesManager.getWordChunksForCue(cueIndexToShow) ?? null;
  }, [subtitleStyle.showWordAnimation, subtitlesManager, player.currentPlayingCue, cueIndexToShow]);

  // Calculate word positions
  const wordPositions = React.useMemo(() => {
    if (!wordChunks) return null;
    return calculateWordPositions(wordChunks, subtitleStyle, measureTextRef.current);
  }, [wordChunks, subtitleStyle]);

  // Find active word index and calculate animation progress for smooth background movement
  const activeWordIndex = React.useMemo(() => {
    if (!wordChunks) return -1;
    return findActiveWordIndex(wordChunks, player.ts);
  }, [wordChunks, player.ts]);

  // Track previous active word for smooth animation
  const prevActiveWordRef = React.useRef<{ index: number; x: number; y: number; width: number } | null>(null);
  
  // Calculate animation progress within current word (0-1)
  const animationProgress = React.useMemo(() => {
    if (!wordChunks || activeWordIndex < 0) return 0;
    const word = wordChunks[activeWordIndex];
    const [start, end] = word.timestamp;
    const endTs = end ?? wordChunks[activeWordIndex + 1]?.timestamp[0] ?? start + 0.5;
    const duration = endTs - start;
    if (duration <= 0) return 1;
    return Math.min(1, Math.max(0, (player.ts - start) / duration));
  }, [wordChunks, activeWordIndex, player.ts]);

  const handleDragMove = React.useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    let centerX = width / 2 - e.target.width() / 2;
    let centerY = height / 2 - e.target.height() / 2;

    let isCenterX = Math.abs(e.target.x() - centerX) < width * 0.04;
    let isCenterY = Math.abs(e.target.y() - centerY) < height * 0.04;

    if (isCenterX) {
      e.target.x(centerX);
      lineHelperXRef.current?.show();
    } else {
      lineHelperXRef.current?.hide();
    }

    if (isCenterY) {
      e.target.y(centerY);
      lineHelperYRef.current?.show();
    } else {
      lineHelperYRef.current?.hide();
    }

    updateBackground()
  }, [width, height, updateBackground])

  React.useEffect(() => {
    document.fonts
      .load(
        `${subtitleStyle.fontSizePx}px ${subtitleStyle.fontFamily}`,
        currentSubtitle,
      )
      .then(() => {
        textRef.current?.fontFamily(subtitleStyle.fontFamily);
        textRef.current?.fontStyle(subtitleStyle.fontWeight.toString());
        textRef.current?.draw();
        textRef.current?.getLayer()?.batchDraw();
      });
  }, [subtitleStyle.fontFamily, subtitleStyle.fontWeight, currentSubtitle]);

  if (player.playState === "Idle") {
    return <WelcomeScreen />;
  }

  // Render word-level animation
  const renderWordAnimation = () => {
    if (!wordPositions || !subtitleStyle.showWordAnimation) return null;

    const wordAnim = subtitleStyle.wordAnimation;
    const lineHeight = subtitleStyle.fontSizePx * 1.2;
    const totalHeight = wordPositions.length > 0
      ? Math.max(...wordPositions.map(p => p.y)) + lineHeight
      : lineHeight;

    // Get current active word position for background animation
    const activePos = activeWordIndex >= 0 ? wordPositions.find(p => p.index === activeWordIndex) : null;
    
    // Calculate pop scale for active word (used for both text and background)
    let popScale = 1;
    if (wordAnim.showPop && activePos) {
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const popProgress = animationProgress;
      
      if (popProgress < 0.2) {
        const t = popProgress / 0.2;
        popScale = 1 + (wordAnim.pop.scale - 1) * easeOutCubic(t);
      } else if (popProgress > 0.8) {
        const t = (popProgress - 0.8) / 0.2;
        popScale = wordAnim.pop.scale - (wordAnim.pop.scale - 1) * easeOutCubic(t);
      } else {
        popScale = wordAnim.pop.scale;
      }
    }
    
    // Calculate interpolated background position for smooth animation
    let bgX = 0, bgY = 0, bgWidth = 0;
    if (activePos && wordAnim.showBackground) {
      const prevWord = prevActiveWordRef.current;
      
      if (prevWord && prevWord.index !== activeWordIndex) {
        // Animate from previous word position to current
        // Use easeOutCubic for smooth deceleration
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const t = easeOutCubic(Math.min(animationProgress * 3, 1)); // Speed up transition (complete in ~33% of word duration)
        
        bgX = prevWord.x + (activePos.x - prevWord.x) * t;
        bgY = prevWord.y + (activePos.y - prevWord.y) * t;
        bgWidth = prevWord.width + (activePos.width - prevWord.width) * t;
      } else {
        bgX = activePos.x;
        bgY = activePos.y;
        bgWidth = activePos.width;
      }
      
      // Update ref for next frame
      prevActiveWordRef.current = {
        index: activeWordIndex,
        x: activePos.x,
        y: activePos.y,
        width: activePos.width,
      };
    }
    
    // Calculate scaled background dimensions
    const bgPadX = wordAnim.background.paddingX;
    const bgPadY = wordAnim.background.paddingY;
    const bgBaseWidth = bgWidth + bgPadX * 2;
    const bgBaseHeight = subtitleStyle.fontSizePx + bgPadY * 2;
    const bgScaledWidth = bgBaseWidth * popScale;
    const bgScaledHeight = bgBaseHeight * popScale;
    // Offset to scale from center
    const bgOffsetX = (bgScaledWidth - bgBaseWidth) / 2;
    const bgOffsetY = (bgScaledHeight - bgBaseHeight) / 2;

    return (
      <Group
        ref={groupRef}
        draggable
        x={subtitleStyle.x}
        y={subtitleStyle.y}
        width={subtitleStyle.blockSize.width}
        height={totalHeight}
        onDragMove={handleDragMove}
        onDragEnd={(e) => {
          styleDispatch({
            TAG: "SetPosition",
            _0: Math.floor(e.target.x()),
            _1: Math.floor(e.target.y()),
          });
        }}
        onTransform={handleResize}
      >
        {/* Animated background highlight - rendered first so it's behind text */}
        {activePos && wordAnim.showBackground && (
          <Rect
            x={bgX - bgPadX - bgOffsetX}
            y={bgY - bgPadY - bgOffsetY}
            width={bgScaledWidth}
            height={bgScaledHeight}
            fill={wordAnim.background.color}
            opacity={wordAnim.background.opacity}
            cornerRadius={wordAnim.background.borderRadius}
          />
        )}
        
        {/* Render all words */}
        {wordPositions.map((pos, i) => {
          const isActive = pos.index === activeWordIndex;
          const wordText = pos.word.text.trim(); // Trim spaces

          // Start with base styles
          let fillColor = subtitleStyle.color;
          let fontWeight = subtitleStyle.fontWeight;
          let scale = 1;
          let offsetX = 0;
          let offsetY = 0;

          // Apply all enabled effects for active word (effects can combine)
          if (isActive) {
            // Font effect: change text color and/or font weight (fallback to main style)
            if (wordAnim.showFont) {
              fillColor = wordAnim.font.color ?? subtitleStyle.color;
              fontWeight = wordAnim.font.fontWeight ?? subtitleStyle.fontWeight;
            }
            
            // Pop effect: scale animation (reuse pre-calculated popScale)
            if (wordAnim.showPop) {
              scale = popScale;
              // Offset to scale from center of the word
              offsetX = (pos.width * (scale - 1)) / 2;
              offsetY = (subtitleStyle.fontSizePx * (scale - 1)) / 2;
            }
          }

          return (
            <Text
              key={i}
              x={pos.x - offsetX}
              y={pos.y - offsetY}
              scaleX={scale}
              scaleY={scale}
              text={wordText}
              fill={fillColor}
              fontSize={subtitleStyle.fontSizePx}
              fontStyle={fontWeight >= 700 ? "bold" : "normal"}
              fontFamily={`"${subtitleStyle.fontFamily}"`}
              stroke={subtitleStyle.strokeColor}
              strokeWidth={subtitleStyle.strokeWidth}
              strokeEnabled={subtitleStyle.strokeColor !== subtitleStyle.color}
              fillAfterStrokeEnabled
            />
          );
        })}
      </Group>
    );
  };

  // Decide whether to use word-level or single text rendering
  const useWordAnimation = subtitleStyle.showWordAnimation && wordPositions && wordPositions.length > 0;

  return (
    <Stage
      className={clsx(
        className,
        player.playState === "StoppedForRender" && "hidden",
      )}
      width={width}
      height={height}
      style={style}
    >
      <Layer>
        {subtitleStyle.showBackground && currentSubtitle.trim().length > 0 && (
          <Rect
            ref={backgroundRef}
            fill={subtitleStyle.background.color}
            stroke={subtitleStyle.background.strokeColor}
            strokeWidth={subtitleStyle.background.strokeWidth}
            fillAfterStrokeEnabled={true}
            opacity={subtitleStyle.background.opacity}
            cornerRadius={subtitleStyle.background.borderRadius}
            shadowForStrokeEnabled={false}
            perfectDrawEnabled={false}
          />
        )}

        {useWordAnimation ? (
          renderWordAnimation()
        ) : (
          <Text
            ref={textRef}
            draggable
            fillAfterStrokeEnabled
            fontStyle={subtitleStyle.fontWeight.toString()}
            text={currentSubtitle.trim()}
            x={subtitleStyle.x}
            y={subtitleStyle.y}
            width={subtitleStyle.blockSize.width}
            fill={subtitleStyle.color}
            fontSize={subtitleStyle.fontSizePx}
            stroke={subtitleStyle.strokeColor}
            strokeWidth={subtitleStyle.strokeWidth}
            strokeEnabled={subtitleStyle.strokeColor !== subtitleStyle.color}
            onTransform={handleResize}
            align={subtitleStyle.align.toLowerCase()}
            fontFamily={`"${subtitleStyle.fontFamily}"`}
            onDragMove={handleDragMove}
            onDragEnd={(e) => {
              styleDispatch({
                TAG: "SetPosition",
                _0: Math.floor(e.target.x()),
                _1: Math.floor(e.target.y()),
              });
            }}
          />
        )}

        <Line
          ref={lineHelperXRef}
          points={[width / 2, 0, width / 2, height]}
          stroke="red"
          strokeWidth={2}
        />

        <Line
          ref={lineHelperYRef}
          points={[0, height / 2, width, height / 2]}
          stroke="red"
          strokeWidth={2}
        />

        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          flipEnabled={false}
          enabledAnchors={["middle-left", "middle-right"]}
          boundBoxFunc={(_, newBox) => {
            newBox.width = Math.max(30, newBox.width);
            return newBox;
          }}
        />
      </Layer>
    </Stage>
  );
};
