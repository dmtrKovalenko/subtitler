import * as React from "react";
import { Layer, Stage, StageProps, Text, Transformer } from "react-konva";
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

  const textRef = React.useRef<Konva.Text | null>(null);
  const transformerRef = React.useRef<Konva.Transformer | null>(null);

  React.useEffect(() => {
    if (textRef.current) {
      transformerRef.current?.nodes([textRef.current]);
      transformerRef.current?.getLayer()?.batchDraw();
    }
  });

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
          onTransform={handleResize}
          align={subtitleStyle.align.toLowerCase()}
          verticalAlign="middle"
          fontFamily={`"${subtitleStyle.fontFamily}"`}
          onDragEnd={(e) => {
            styleDispatch({
              TAG: "SetPosition",
              _0: Math.floor(e.target.x()),
              _1: Math.floor(e.target.y()),
            });
          }}
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
