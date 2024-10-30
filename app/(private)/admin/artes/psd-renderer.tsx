import PSD from "psd";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { loadPSD, PSDNode } from "@/functions/art";

export const PSDRenderer = ({ psdUrl }: { psdUrl: string }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [psd, setPsd] = useState<PSD | null>(null);
  const [layers, setLayers] = useState<PSDNode[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<PSDNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const renderTextLayer = (ctx: CanvasRenderingContext2D, layer: PSDNode) => {
    if (!layer.text) {
      return;
    }

    const { r, g, b, a } = layer.text.color;

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    ctx.font = `${layer.text.size}px ${layer.text.font}`;
    ctx.textBaseline = "top";
    ctx.fillText(layer.text.value, layer.bounds.left, layer.bounds.top);
  };

  const renderLayers = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");

      if (ctx) {
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
        layers.forEach((layer) => {
          if (!layer.visible) return;

          ctx.globalAlpha = layer.opacity / 255;

          console.log({ layer });

          if (layer.text) {
            renderTextLayer(ctx, layer);
          } else if (layer.image) {
            const img = new Image(layer.bounds.width, layer.bounds.height);
            img.onload = () => {
              console.log("ON LOAD TRIGGERED");
              ctx.drawImage(
                img,
                layer.bounds.left,
                layer.bounds.top,
                layer.bounds.width,
                layer.bounds.height
              );
            };

            img.onerror = (e) => console.error("Error loading image", e);

            img.src = `data:image/png;base64,${layer.image}`;
          }
        });
      }
    }
  }, [canvasSize, layers]);

  useEffect(() => {
    const load = async () => {
      const loadedPsd = await loadPSD(psdUrl);

      console.log({ loadedPsd });

      if (loadedPsd) {
        setCanvasSize(loadedPsd.dimensions);
        setLayers(loadedPsd.nodes);
      }
    };

    load();
  }, [psdUrl]);

  useEffect(() => {
    if (canvasRef.current && layers.length > 0) {
      renderLayers();
    }
  }, [layers, canvasSize, renderLayers]);

  const getLayerAtPosition = (x: number, y: number) => {
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (
        x >= layer.bounds.left &&
        x < layer.bounds.left + layer.bounds.width &&
        y >= layer.bounds.top &&
        y < layer.bounds.top + layer.bounds.height
      ) {
        return layer;
      }
    }
    return null;
  };

  const handleCanvasClick: React.MouseEventHandler<HTMLCanvasElement> = (e) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const clickedLayer = getLayerAtPosition(x, y);
      console.log({ clickedLayer });
      if (clickedLayer) {
        setSelectedLayer(clickedLayer);
      }
    }
  };

  const handleTextChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { name, value } = e.target;
    setSelectedLayer((prev) => {
      if (!prev?.text) return prev;

      let newValue: string | number = value;

      if (name === "fontSize") {
        newValue = parseInt(value, 10) || parseInt(prev.text.size);
      }

      if (name === "color") {
        // TO-DO fix this
        newValue = value.startsWith("#") ? value : `#${value}`;
      }

      return { ...prev, [name]: newValue };
    });
  };

  const applyTextChanges = () => {
    if (!selectedLayer || !selectedLayer.text) return;

    // Update the PSD text layer
    // TO-DO: Update this once we know where the text data is stored in the node
    /*    const textLayer = selectedLayer.node;
    textLayer.text.value = selectedLayer.text;
     textLayer.text.font.name = selectedLayer.font;
    textLayer.text.font.sizes = [selectedLayer.fontSize];
    textLayer.text.font.colors = [parseInt(selectedLayer.color.slice(1), 16)]; */

    // Re-render the PSD
    psd?.tree().export();

    // Update the layers state
    setLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === selectedLayer.id ? { ...layer, ...selectedLayer } : layer
      )
    );

    setSelectedLayer(null);
    renderLayers();
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleCanvasClick}
      />
      {selectedLayer && selectedLayer.text && (
        <div>
          <h3>Edit Text Layer: {selectedLayer.name}</h3>
          <div>
            <label>
              Text:
              <input
                type="text"
                name="text"
                value={selectedLayer.text.value}
                onChange={handleTextChange}
              />
            </label>
          </div>
          <div>
            <label>
              Font:
              <input
                type="text"
                name="font"
                value={selectedLayer.text.font}
                onChange={handleTextChange}
              />
            </label>
          </div>
          <div>
            <label>
              Font Size:
              <input
                type="number"
                name="fontSize"
                value={selectedLayer.text.size}
                onChange={handleTextChange}
                min="1"
              />
            </label>
          </div>
          <div>
            <label>
              Color:
              <input
                type="color"
                name="color"
                /*    TO-DO Fix this */
                value={"blue" /* selectedLayer.text.color */}
                onChange={handleTextChange}
              />
            </label>
          </div>
          <button onClick={applyTextChanges}>Apply Changes</button>
        </div>
      )}
    </div>
  );
};
