"use server";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { config } from "@/config";

type Layer = {
  id: number;
  name: string;
  children?: Layer[];
  text?: {
    content: string;
  };
};

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_SECRET_KEY,
  },
});

export const curateArts = async () => {
  console.log("Curate Arts Triggered");

  // fetch arts from freepik
  // create arts map, so we can refer to it later for searchable metadata
  // upload to s3 at {type}/{uuid}/raw.psd

  // create manifest per upload

  const s3Commands: {
    read: GetObjectCommand;
    writeFront: PutObjectCommand;
    writeBack: PutObjectCommand;
  }[] = [];
  const manifestJobIds: string[] = [];

  for (let i = 1; i <= 6; i++) {
    const readCommand = new GetObjectCommand({
      Bucket: config.AWS_BUCKET_NAME,
      Key: `business-card-${i}.psd`,
    });

    const writeFrontCommand = new PutObjectCommand({
      Bucket: config.AWS_BUCKET_NAME,
      Key: `business-cards/${i}/front.psd`,
    });

    const writeBackCommand = new PutObjectCommand({
      Bucket: config.AWS_BUCKET_NAME,
      Key: `business-cards/${i}/back.psd`,
    });

    s3Commands.push({
      read: readCommand,
      writeFront: writeFrontCommand,
      writeBack: writeBackCommand,
    });

    const manifestResponse = await fetch(
      "https://image.adobe.io/pie/psdService/documentManifest",
      {
        method: "POST",
        headers: {
          "x-api-key": config.ADOBE_CLIENT_ID,
          Authorization: `Bearer ${config.ADOBE_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          inputs: [
            {
              storage: "external",
              href: await getSignedUrl(s3, readCommand, {
                expiresIn: 60,
              }),
            },
          ],
        }),
      }
    );

    const manifestJsonResponse: {
      _links: {
        self: {
          href: string;
        };
      };
    } = await manifestResponse.json();

    const [, jobId] = manifestJsonResponse._links.self.href.split("status/");
    manifestJobIds.push(jobId);

    await sleep(500);
  }

  // per manifest:
  // - delete front,
  // - make other layers visible (the one's with visible: false, as that's the best chance they are bleed and margin layers),
  // - create smartObject layer bases on layer most likely to hold logo. Use the smaller dimension for square logo sides. For the smaller dimension, use the same corresponsing offset, for the other add from the offset
  // half the abs difference between the original dimensions. So say the original logo is 280 X 245, the top offset would remain the same, while we would add Math.floor(Math.abs(280-245) / 2), so 17, to the left offset
  // this guarantees that our placeholder logo, does not cover anything that it shouldn't and its center is in the same spot as the previous. Alternatively we could allow the user to upload an image with any ratio of
  // dimensions as long as they are both lte than the original, and we would perform the aforementioned logic for both offsets. Regarding determining the best candidate for layer to make invisible and bounds to use, we would
  // look for any layer whose name include the string "logo" and whose type is either "smartObject" or "fillLayer", prioritizing "smartObject" types as sometimes there may be more than one
  // - make layer most likely to hold logo into a smartObject layer with a placeholder logo
  // - upload,
  // vice-versa
  // a layer can be made visible by calling POST https://image.adobe.io/pie/psdService/documentOperations
  // with body { inputs, outputs, options.layers[0]: { edit: {}, id, visible: true } }
  // a layer can be made into a smartObject by calling POST https://image.adobe.io/pie/psdService/documentOperations
  // with body { inputs, outputs, options.layers[0]: { edit: {}, id, type: "smartObject", name } }
  // a smartObject layer can have its images edited by calling POST https://image.adobe.io/pie/psdService/documentOperations
  // with body { inputs, outputs, options.layers[0]: { edit: {}, id, input: { href, storage: "external" } }, smartObject: { type: "image/png" }, attributes: { bound: { height, left, top, width } } }

  const deleteLayerJobIds: { front: string; back: string }[] = [];

  for (let i = 1; i <= 6; i++) {
    const jobId = manifestJobIds[i - 1];
    const manifestResultResponse = await fetch(
      `https://image.adobe.io/pie/psdService/status/${jobId}`,
      {
        method: "GET",
        headers: {
          "x-api-key": config.ADOBE_CLIENT_ID,
          Authorization: `Bearer ${config.ADOBE_ACCESS_TOKEN}`,
        },
      }
    );

    const manifestResultJson: {
      outputs: [
        {
          layers: Layer[];
          document: {
            width: number;
            height: number;
            imageMode: "rgb" | "cmyk";
          };
        }
      ];
    } = await manifestResultResponse.json();

    const { read, writeFront, writeBack } = s3Commands[i - 1];

    const frontLayer = manifestResultJson.outputs[0].layers.find(({ name }) =>
      name.trim().toLowerCase().includes("front")
    ) as Layer;

    const deleteFrontJobId = await deleteLayers(getLayerIds(frontLayer), {
      read,
      write: writeBack,
    });

    const backLayer = manifestResultJson.outputs[0].layers.find(({ name }) =>
      name.trim().toLowerCase().includes("back")
    ) as Layer;

    const deleteBackJobId = await deleteLayers(getLayerIds(backLayer), {
      read,
      write: writeFront,
    });

    deleteLayerJobIds.push({
      front: deleteFrontJobId,
      back: deleteBackJobId,
    });

    await sleep(500);
  }

  // get back editable fields create Art document with as much searchable metadata as possible to enable good text search
  // include editable field coordinates in Art model

  console.log("FINISHED");
};

function sleep(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function deleteLayers(
  ids: number[],
  {
    read,
    write,
  }: {
    read: GetObjectCommand;
    write: PutObjectCommand;
  }
): Promise<string> {
  const response = await fetch(
    " https://image.adobe.io/pie/psdService/documentOperations",
    {
      method: "POST",
      headers: {
        "x-api-key": config.ADOBE_CLIENT_ID,
        Authorization: `Bearer ${config.ADOBE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        inputs: [
          {
            storage: "external",
            href: await getSignedUrl(s3, read, {
              expiresIn: 60,
            }),
          },
        ],
        outputs: [
          {
            storage: "external",
            type: "vnd.adobe.photoshop",
            overwrite: true,
            href: await getSignedUrl(s3, write, {
              expiresIn: 60,
            }),
          },
        ],
        options: {
          layers: ids.map((id) => ({
            id,
            delete: {},
          })),
        },
      }),
    }
  );

  const json: {
    _links: {
      self: {
        href: string;
      };
    };
  } = await response.json();

  return json._links.self.href.split("status/")[1];
}

function getLayerIds(
  obj: Layer,
  { ids = [] }: { ids: number[] } = {
    ids: [],
  }
): number[] {
  ids.push(obj.id);

  if (obj.children) {
    for (const child of obj.children) {
      getLayerIds(child, { ids });
    }
  }

  return ids;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractContentPaths(
  layer: Layer,
  currentPath: string[] = []
): [string, string][] {
  const result: [string, string][] = [];

  // If this layer has content and no children, we add it to the result
  if (layer.text && !layer.children) {
    result.push([currentPath.join("."), layer.text.content]);
  }

  // If there are children, we recurse into each child
  if (layer.children) {
    for (const child of layer.children) {
      result.push(
        ...extractContentPaths(child, currentPath.concat(child.name))
      );
    }
  }

  return result;
}
