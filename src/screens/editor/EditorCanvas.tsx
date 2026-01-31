import * as React from "react";
import {
  Layer,
  Line,
  Stage,
  Rect,
  StageProps,
  Text,
  Transformer,
  Group,
} from "react-konva";
import { subtitleCue } from "./Subtitles.gen";
import { useEditorContext } from "./EditorContext.gen";
import type Konva from "konva";
import { WelcomeScreen } from "./WelcomeScreen";
import clsx from "clsx";
import { subtitlesManager } from "./ChunksList/ChunksList.gen";
import { TextUtils_stripPunctuation as stripPunctuation } from "../../Utils.gen";
import {
  findActiveWordIndex,
  calculateAnimationProgress,
  calculatePopScale,
  calculateWordPositions,
  calculateTotalHeight,
  calculateActualWidth,
  interpolateBackgroundPosition,
  calculateScaledBackground,
} from "../../codecs/active-word";

type EditorCanvasProps = {
  width: number;
  height: number;
  transcriptionInProgress: boolean;
  subtitles: Array<subtitleCue>;
  subtitlesManager?: subtitlesManager;
} & StageProps;

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
  const [textDimensions, setTextDimensions] = React.useState({
    width: 0,
    height: 0,
  });

  const measureText = React.useMemo(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    return (text: string) => {
      if (!ctx) return 0;
      const fontStyle = subtitleStyle.fontWeight >= 700 ? "bold" : "normal";
      ctx.font = `${fontStyle} ${subtitleStyle.fontSizePx}px "${subtitleStyle.fontFamily}"`;
      return ctx.measureText(text).width;
    };
  }, [
    subtitleStyle.fontFamily,
    subtitleStyle.fontSizePx,
    subtitleStyle.fontWeight,
  ]);

  const cueIndexToShow = transcriptionInProgress
    ? 0
    : (player.currentPlayingCue?.currentIndex ?? 0);

  const hasActiveCue =
    transcriptionInProgress || player.currentPlayingCue !== undefined;
  const rawSubtitle = hasActiveCue
    ? (subtitles[cueIndexToShow]?.text ?? "")
    : "";
  
  const currentSubtitle = subtitleStyle.hidePunctuation 
    ? stripPunctuation(rawSubtitle)
    : rawSubtitle;

  const wordChunks = React.useMemo(() => {
    if (
      !subtitleStyle.showWordAnimation ||
      !subtitlesManager ||
      !hasActiveCue
    ) {
      return null;
    }
    return subtitlesManager.getWordChunksForCue(cueIndexToShow) ?? null;
  }, [
    subtitleStyle.showWordAnimation,
    subtitlesManager,
    hasActiveCue,
    cueIndexToShow,
  ]);

  const wordPositions = React.useMemo(() => {
    if (!wordChunks) return null;
    return calculateWordPositions(wordChunks, subtitleStyle, measureText);
  }, [wordChunks, subtitleStyle, measureText]);

  const activeWordIndex = React.useMemo(() => {
    if (!wordChunks) return -1;
    return findActiveWordIndex(wordChunks, player.ts);
  }, [wordChunks, player.ts]);

  const prevActiveWordRef = React.useRef<{
    index: number;
    x: number;
    y: number;
    width: number;
  } | null>(null);

  const animationProgress = React.useMemo(() => {
    if (!wordChunks || activeWordIndex < 0) return 0;
    return calculateAnimationProgress(wordChunks, activeWordIndex, player.ts);
  }, [wordChunks, activeWordIndex, player.ts]);

  const useWordAnimation =
    subtitleStyle.showWordAnimation &&
    wordPositions &&
    wordPositions.length > 0;

  const actualTextDimensions = React.useMemo(() => {
    if (useWordAnimation && wordPositions && wordPositions.length > 0) {
      const totalHeight = calculateTotalHeight(wordPositions, subtitleStyle.fontSizePx);
      const actualWidth = calculateActualWidth(wordPositions, subtitleStyle.fontSizePx);
      return { width: actualWidth, height: totalHeight };
    }
    
    // For regular text, calculate from the text content
    if (!currentSubtitle.trim()) {
      return { width: 0, height: 0 };
    }

    const blockWidth = subtitleStyle.blockSize.width;
    const lineHeight = subtitleStyle.fontSizePx * 1.2;
    
    // Split text into words and calculate line wrapping
    const words = currentSubtitle.trim().split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = measureText(testLine);
      
      if (testWidth > blockWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // Find the widest line
    let maxWidth = 0;
    for (const line of lines) {
      const lineWidth = measureText(line);
      maxWidth = Math.max(maxWidth, lineWidth);
    }
    
    return {
      width: maxWidth,
      height: lines.length * lineHeight,
    };
  }, [currentSubtitle, subtitleStyle.blockSize.width, subtitleStyle.fontSizePx, measureText, useWordAnimation, wordPositions]);

  React.useEffect(() => {
    const node = useWordAnimation ? groupRef.current : textRef.current;
    if (node) {
      const newWidth = node.width() * node.scaleX();
      const newHeight = node.height() * node.scaleY();

      if (
        newWidth !== textDimensions.width ||
        newHeight !== textDimensions.height
      ) {
        setTextDimensions({ width: newWidth, height: newHeight });
      }
    }
  }, [
    useWordAnimation,
    currentSubtitle,
    wordPositions,
    subtitleStyle.fontSizePx,
    subtitleStyle.fontFamily,
    subtitleStyle.fontWeight,
    subtitleStyle.blockSize.width,
  ]);

  const backgroundDimensions = React.useMemo(() => {
    // Use actual measured text dimensions for the background
    const nodeWidth = actualTextDimensions.width || subtitleStyle.blockSize.width;
    const nodeHeight = actualTextDimensions.height || subtitleStyle.fontSizePx * 1.2;
    
    // Calculate x position based on alignment
    let bgX = subtitleStyle.x - subtitleStyle.background.paddingX;
    if (subtitleStyle.align === "Center") {
      // Center the background around the text center
      bgX = subtitleStyle.x + (subtitleStyle.blockSize.width - nodeWidth) / 2 - subtitleStyle.background.paddingX;
    } else if (subtitleStyle.align === "Right") {
      // Align background to the right
      bgX = subtitleStyle.x + subtitleStyle.blockSize.width - nodeWidth - subtitleStyle.background.paddingX;
    }
    
    return {
      x: bgX,
      y: subtitleStyle.y - subtitleStyle.background.paddingY,
      width: nodeWidth + subtitleStyle.background.paddingX * 2,
      height: nodeHeight + subtitleStyle.background.paddingY * 2,
    };
  }, [
    actualTextDimensions,
    subtitleStyle.x,
    subtitleStyle.y,
    subtitleStyle.align,
    subtitleStyle.background.paddingX,
    subtitleStyle.background.paddingY,
    subtitleStyle.blockSize.width,
    subtitleStyle.fontSizePx,
  ]);

  React.useEffect(() => {
    lineHelperXRef.current?.hide();
    lineHelperYRef.current?.hide();

    const nodeForTransformer = useWordAnimation
      ? groupRef.current
      : textRef.current;
    if (nodeForTransformer) {
      transformerRef.current?.nodes([nodeForTransformer]);
      transformerRef.current?.getLayer()?.batchDraw();
    }
  });

  const updateBackgroundPosition = React.useCallback(() => {
    if (backgroundRef.current && subtitleStyle.showBackground) {
      const node = useWordAnimation ? groupRef.current : textRef.current;
      if (!node) return;
      backgroundRef.current.setAttrs({
        x: node.x() - subtitleStyle.background.paddingX,
        y: node.y() - subtitleStyle.background.paddingY,
      });
    }
  }, [
    subtitleStyle.background.paddingX,
    subtitleStyle.background.paddingY,
    subtitleStyle.showBackground,
    useWordAnimation,
  ]);

  function handleResize() {
    const node = useWordAnimation ? groupRef.current : textRef.current;
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

  const handleDragMove = React.useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
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

      updateBackgroundPosition();
    },
    [width, height, updateBackgroundPosition],
  );

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

  // Show welcome screen when:
  // 1. Player is idle AND transcription is in progress (waiting for first frame)
  // 2. Player is idle AND transcription has NOT started yet (no subtitles, never transcribed)
  // Do NOT show welcome screen after transcription completes (when we have subtitles)
  const hasSubtitles = subtitles.length > 0;
  const showWelcomeScreen =
    player.playState === "Idle" && (transcriptionInProgress || !hasSubtitles);

  if (showWelcomeScreen) {
    return <WelcomeScreen />;
  }

  const renderWordAnimation = () => {
    if (!wordPositions || !subtitleStyle.showWordAnimation) return null;

    const wordAnim = subtitleStyle.wordAnimation;
    const totalHeight = calculateTotalHeight(
      wordPositions,
      subtitleStyle.fontSizePx,
    );
    const activePos =
      activeWordIndex >= 0
        ? wordPositions.find((p) => p.index === activeWordIndex)
        : null;
    const popScale =
      wordAnim.showPop && activePos
        ? calculatePopScale(animationProgress, wordAnim.pop.scale)
        : 1;

    const prevWord = prevActiveWordRef.current;
    const isNewWord = prevWord !== null && prevWord.index !== activeWordIndex;
    const bgPos =
      activePos && wordAnim.showBackground
        ? interpolateBackgroundPosition(
            activePos,
            prevWord,
            animationProgress,
            isNewWord,
          )
        : { x: 0, y: 0, width: 0 };

    if (activePos && wordAnim.showBackground) {
      prevActiveWordRef.current = {
        index: activeWordIndex,
        x: activePos.x,
        y: activePos.y,
        width: activePos.width,
      };
    }

    const bgPadX = wordAnim.background.paddingX;
    const bgPadY = wordAnim.background.paddingY;
    const scaledBg = calculateScaledBackground(
      bgPos.width,
      subtitleStyle.fontSizePx,
      bgPadX,
      bgPadY,
      popScale,
    );

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
        {/* Render non-active words first (below) */}
        {wordPositions
          .filter((pos) => pos.index !== activeWordIndex)
          .map((pos) => {
            const wordText = subtitleStyle.hidePunctuation
              ? stripPunctuation(pos.word.text.trim())
              : pos.word.text.trim();

            return (
              <Text
                key={pos.index}
                x={pos.x}
                y={pos.y}
                text={wordText}
                fill={subtitleStyle.color}
                fontSize={subtitleStyle.fontSizePx}
                fontStyle={subtitleStyle.fontWeight >= 700 ? "bold" : "normal"}
                fontFamily={`"${subtitleStyle.fontFamily}"`}
                stroke={subtitleStyle.strokeColor}
                strokeWidth={subtitleStyle.strokeWidth}
                strokeEnabled={subtitleStyle.strokeColor !== subtitleStyle.color}
                fillAfterStrokeEnabled
              />
            );
          })}

        {/* Render active word background and text last (on top) */}
        {activePos && wordAnim.showBackground && (
          <Rect
            x={bgPos.x - bgPadX - scaledBg.offsetX}
            y={bgPos.y - bgPadY - scaledBg.offsetY}
            width={scaledBg.width}
            height={scaledBg.height}
            fill={wordAnim.background.color}
            opacity={wordAnim.background.opacity}
            cornerRadius={wordAnim.background.borderRadius}
          />
        )}

        {activePos &&
          (() => {
            const wordText = subtitleStyle.hidePunctuation
              ? stripPunctuation(activePos.word.text.trim())
              : activePos.word.text.trim();

            let fillColor = subtitleStyle.color;
            let fontWeight = subtitleStyle.fontWeight;
            let scale = 1;
            let offsetX = 0;
            let offsetY = 0;

            // Font effect: change text color and/or font weight (fallback to main style)
            if (wordAnim.showFont) {
              fillColor = wordAnim.font.color ?? subtitleStyle.color;
              fontWeight = wordAnim.font.fontWeight ?? subtitleStyle.fontWeight;
            }

            // Pop effect: scale animation (reuse pre-calculated popScale)
            if (wordAnim.showPop) {
              scale = popScale;
              // Offset to scale from center of the word
              offsetX = (activePos.width * (scale - 1)) / 2;
              offsetY = (subtitleStyle.fontSizePx * (scale - 1)) / 2;
            }

            return (
              <Text
                key={activePos.index}
                x={activePos.x - offsetX}
                y={activePos.y - offsetY}
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
          })()}
      </Group>
    );
  };

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
            x={backgroundDimensions.x}
            y={backgroundDimensions.y}
            width={backgroundDimensions.width}
            height={backgroundDimensions.height}
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
