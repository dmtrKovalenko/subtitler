import * as React from "react";
import { Layer, Line, Stage, Rect, StageProps, Text, Transformer } from "react-konva";
import { subtitleCue } from "./Subtitles.gen";
import { useEditorContext } from "./EditorContext.gen";
import type Konva from "konva";
import { WelcomeScreen } from "./WelcomeScreen";
import clsx from "clsx";

type EditorCanvasProps = {
  width: number;
  height: number;
  transcriptionInProgress: boolean;
  subtitles: Array<subtitleCue>;
} & StageProps;

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  width,
  height,
  className,
  subtitles,
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
  const transformerRef = React.useRef<Konva.Transformer | null>(null);

  React.useEffect(() => {
    lineHelperXRef.current?.hide();
    lineHelperYRef.current?.hide();

    updateBackground();
    if (textRef.current) {
      transformerRef.current?.nodes([textRef.current]);
      transformerRef.current?.getLayer()?.batchDraw();
    }
  });

  const updateBackground = React.useCallback(() => {
    if (textRef.current && backgroundRef.current && subtitleStyle.showBackground) {
      const textNode = textRef.current;
      const backgroundNode = backgroundRef.current;

      // Get text dimensions
      const textWidth = textNode.width() * textNode.scaleX();
      const textHeight = textNode.height() * textNode.scaleY();

      // Update background position and size
      backgroundNode.setAttrs({
        x: textNode.x() - subtitleStyle.background.paddingX,
        y: textNode.y() - subtitleStyle.background.paddingY,
        width: textWidth + (subtitleStyle.background.paddingX * 2),
        height: textHeight + (subtitleStyle.background.paddingY * 2),
      });
    }
  }, [subtitleStyle.background, subtitleStyle.showBackground]);

  function handleResize() {
    if (textRef.current !== null) {
      const textNode = textRef.current;
      const newWidth = Math.round(textNode.width() * textNode.scaleX());
      const newHeight = Math.round(textNode.height() * textNode.scaleY());
      textNode.setAttrs({
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
  }, [width, updateBackground])

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
  }, [subtitleStyle.fontFamily, subtitleStyle.fontWeight]);

  if (player.playState === "Idle") {
    return <WelcomeScreen />;
  }

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
            stroke="red"
            strokeWidth={subtitleStyle.background.strokeWidth}
            fillAfterStrokeEnabled={true}
            opacity={subtitleStyle.background.opacity}
            cornerRadius={subtitleStyle.background.borderRadius}
            shadowForStrokeEnabled={false}
            perfectDrawEnabled={false}
          />
        )}

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
