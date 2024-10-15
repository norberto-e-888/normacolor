"use server";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { config } from "@/config";

type Layer = { id: number; name: string; children?: Layer[] };

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_SECRET_KEY,
  },
});

export const curateArts = async () => {
  console.log("Curate Arts Triggered");

  // create manifests

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

  console.log("FINISHED");

  // per manifest:
  // delete front, get back editable fields, upload, create Art document
  // vice-versa
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
