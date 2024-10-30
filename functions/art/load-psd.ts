"use server";

import fs from "fs";
import fetch from "node-fetch";
import os from "os";
import path from "path";
import PSD from "psd";
import { v1 as uuid } from "uuid";

export type PSDNode = {
  id: string;
  name: string;
  type: "group" | "layer";
  visible: boolean;
  opacity: number;
  bounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  text?: {
    value: string;
    font: string;
    color: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
    size: string;
  };
  image?: string;
  children?: PSDNode[];
};

export const loadPSD = async (url: string) => {
  const response = await fetch(url);
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, "temp.psd");
  const fileStream = fs.createWriteStream(tempFilePath);

  await new Promise((resolve, reject) => {
    if (response.body) {
      response.body.pipe(fileStream);
      response.body.on("error", reject);
    }

    fileStream.on("finish", resolve);
  });

  const psd = await PSD.open(tempFilePath);

  await psd.image?.saveAsPng("./test.png");

  fs.unlinkSync(tempFilePath);

  if (psd.header) {
    const tree = psd.tree();
    const dimensions = { width: tree.width, height: tree.height };
    const nodes = processNodes(tree.children());

    return {
      nodes: [],
      dimensions: {
        width: 0,
        height: 0,
      },
    };
  }

  return null;
};

function processNodes(nodes: PSD.NodeChildren[]): PSDNode[] {
  return nodes.flatMap((node) => {
    const processedNode: PSDNode = {
      id: uuid(),
      name: node.name,
      type: node.type,
      visible: node.layer.visible,
      opacity: node.layer.opacity,
      bounds: {
        left: node.layer.left,
        top: node.layer.top,
        width: node.layer.width,
        height: node.layer.height,
      },
    };

    if (node.isGroup()) {
      const children = processNodes(node.children());
      processedNode.children = children;
      return children;
    } else {
      const image = node.get("image");

      if (image && image.obj && image.obj.pixelData) {
        const png = node.toPng().data;
        processedNode.image = Buffer.from(png).toString("base64");
      }

      if (node.get("typeTool")) {
        const textData = node.get("typeTool").export();

        processedNode.text = {
          value: textData.value,
          font: textData.font.names[0],
          size: textData.font.sizes[0],
          color: {
            r: textData.font.colors[0][0],
            g: textData.font.colors[0][1],
            b: textData.font.colors[0][2],
            a: textData.font.colors[0][3],
          },
        };
      }
    }

    return [processedNode];
  });
}
