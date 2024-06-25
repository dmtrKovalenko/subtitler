import * as React from "react";
import { Layer, Stage, StageProps, Text, Transformer } from "react-konva";
import * as Renderer from "./Renderer.gen";
import { subtitleCue } from "./Subtitles.gen";
import type Konva from "konva";
import { useEditorContext } from "./EditorContext.gen";

type EditorCanvasProps = {
  width: number;
  height: number;
  subtitles: Array<subtitleCue>;
} & StageProps;

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  width,
  height,
  className,
  subtitles,
  style,
}) => {
  const editorContext = useEditorContext();
  const [player, _] = editorContext.usePlayer();

  const subtitleStyle = Renderer.useStyle();

  const textRef = React.useRef<Konva.Text | null>(null);
  const transformerRef = React.useRef<Konva.Transformer | null>(null);

  React.useEffect(() => {
    if (textRef.current) {
      transformerRef.current?.nodes([textRef.current]);
      transformerRef.current?.getLayer()?.batchDraw();
    }
  }, []);

  function handleResize() {
    if (textRef.current !== null) {
      const textNode = textRef.current;
      const newWidth = Math.round(textNode.width() * textNode.scaleX());
      const newHeight = Math.round(textNode.height() * textNode.scaleY());
      textNode.setAttrs({
        width: newWidth,
        scaleX: 1,
      });

      Renderer.dispatch({
        TAG: "Resize",
        _0: { width: newWidth, height: newHeight },
      });
    }
  }

  const currentSubtitle = player.currentPlayingCue
    ? subtitles[player.currentPlayingCue.currentIndex].text
    : "";

  return (
    <Stage width={width} height={height} className={className} style={style}>
      <Layer>
        <Text
          ref={textRef}
          draggable
          fontStyle={subtitleStyle.fontWeight.toString()}
          text={currentSubtitle}
          x={subtitleStyle.x}
          y={subtitleStyle.y}
          width={subtitleStyle.blockSize.width}
          fill={subtitleStyle.color}
          fontSize={subtitleStyle.fontSizePx}
          stroke={subtitleStyle.strokeColor}
          onTransform={handleResize}
          align={subtitleStyle.align.toLowerCase()}
          fontFamily={subtitleStyle.fontFamily}
          onDragEnd={(e) => {
            Renderer.dispatch({
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
          boundBoxFunc={(oldBox, newBox) => {
            newBox.width = Math.max(30, newBox.width);
            return newBox;
          }}
        />
      </Layer>
    </Stage>
  );
};
