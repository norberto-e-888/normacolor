"use server";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { config } from "@/config";

const DATA = [
  {
    blendOptions: {
      blendMode: "passThrough",
      opacity: 100,
    },
    bounds: {
      height: 709,
      left: 0,
      top: 0,
      width: 1063,
    },
    children: [
      {
        blendOptions: {
          blendMode: "normal",
          opacity: 100,
        },
        bounds: {
          height: 709,
          left: 0,
          top: 0,
          width: 1063,
        },
        fill: {
          solidColor: {
            rgb: {
              blue: 51,
              green: 51,
              red: 51,
            },
          },
        },
        id: 347,
        index: 40,
        locked: false,
        name: "Bleed",
        rotate: 0,
        type: "fillLayer",
        visible: false,
      },
      {
        blendOptions: {
          blendMode: "normal",
          opacity: 100,
        },
        bounds: {
          height: 640,
          left: 35,
          top: 35,
          width: 991,
        },
        fill: {
          solidColor: {
            rgb: {
              blue: 236,
              green: 172,
              red: 0,
            },
          },
        },
        id: 141,
        index: 39,
        locked: false,
        name: "Cut",
        rotate: 0,
        type: "fillLayer",
        visible: false,
      },
    ],
    id: 83,
    index: 41,
    locked: false,
    name: "Print Bleed",
    rotate: 0,
    type: "layerSection",
    visible: false,
  },
  {
    blendOptions: {
      blendMode: "passThrough",
      opacity: 100,
    },
    bounds: {
      height: 709,
      left: 0,
      top: 0,
      width: 1063,
    },
    children: [
      {
        blendOptions: {
          blendMode: "passThrough",
          opacity: 100,
        },
        bounds: {
          height: 458,
          left: 301,
          top: 126,
          width: 462,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 245,
              left: 391,
              top: 126,
              width: 280,
            },
            id: 731,
            index: 35,
            locked: false,
            name: "Vector Smart Object",
            rotate: 0,
            smartObject: {
              instanceId: "846b053e-77f6-46e8-9f47-f80aa61222a2",
              linked: false,
              name: "Objeto inteligente vectorial.ai",
              type: "pdf",
            },
            type: "smartObject",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 81,
              left: 301,
              top: 503,
              width: 462,
            },
            id: 736,
            index: 34,
            locked: false,
            name: "Logo",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    rgb: {
                      blue: 20432,
                      green: 32768,
                      red: 8481,
                    },
                  },
                  fontName: "BebasNeueBook",
                  fontSize: 114.47,
                  orientation: "horizontal",
                },
              ],
              content: "EVERYWHERE",
              paragraphStyles: [
                {
                  alignment: "center",
                },
              ],
              type: "point",
            },
            type: "textLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 77,
              left: 358,
              top: 412,
              width: 348,
            },
            id: 735,
            index: 33,
            locked: false,
            name: "Logo",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    rgb: {
                      blue: 20432,
                      green: 32768,
                      red: 8481,
                    },
                  },
                  fontName: "Cheee-Bingbong",
                  fontSize: 114.47,
                  orientation: "horizontal",
                },
              ],
              content: "SNACKS",
              paragraphStyles: [
                {
                  alignment: "center",
                },
              ],
              type: "point",
            },
            type: "textLayer",
            visible: true,
          },
        ],
        id: 555,
        index: 36,
        locked: false,
        name: "Logo",
        rotate: 0,
        type: "layerSection",
        visible: true,
      },
      {
        blendOptions: {
          blendMode: "passThrough",
          opacity: 100,
        },
        bounds: {
          height: 709,
          left: 91,
          top: 0,
          width: 881,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 709,
              left: 91,
              top: 0,
              width: 98,
            },
            id: 743,
            index: 30,
            locked: false,
            name: "Vector Smart Object",
            rotate: 0,
            smartObject: {
              instanceId: "a6b873f2-6224-4564-901c-ba9ac0bc5479",
              linked: false,
              name: "Objeto inteligente vectorial.ai",
              type: "pdf",
            },
            type: "smartObject",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 709,
              left: 874,
              top: 0,
              width: 98,
            },
            id: 739,
            index: 29,
            locked: false,
            name: "Vector Smart Object",
            rotate: 0,
            smartObject: {
              instanceId: "a6b873f2-6224-4564-901c-ba9ac0bc5479",
              linked: false,
              name: "Objeto inteligente vectorial.ai",
              type: "pdf",
            },
            type: "smartObject",
            visible: true,
          },
        ],
        id: 547,
        index: 31,
        locked: false,
        name: "Design",
        rotate: 0,
        type: "layerSection",
        visible: true,
      },
      {
        blendOptions: {
          blendMode: "passThrough",
          opacity: 100,
        },
        bounds: {
          height: 709,
          left: 0,
          top: 0,
          width: 1063,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 709,
              left: 0,
              top: 0,
              width: 1063,
            },
            fill: {
              solidColor: {
                rgb: {
                  blue: 76,
                  green: 54,
                  red: 46,
                },
              },
            },
            id: 532,
            index: 26,
            locked: false,
            mask: {
              enabled: true,
              linked: true,
              offset: {
                x: 0,
                y: 0,
              },
              type: "layer",
            },
            name: "Background",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
        ],
        id: 533,
        index: 27,
        locked: false,
        name: "Background",
        rotate: 0,
        type: "layerSection",
        visible: true,
      },
    ],
    id: 172,
    index: 37,
    locked: false,
    name: "Front",
    rotate: 0,
    type: "layerSection",
    visible: true,
  },
  {
    blendOptions: {
      blendMode: "passThrough",
      opacity: 100,
    },
    bounds: {
      height: 718,
      left: 0,
      top: -1,
      width: 1095,
    },
    children: [
      {
        blendOptions: {
          blendMode: "passThrough",
          opacity: 100,
        },
        bounds: {
          height: 657,
          left: 23,
          top: 25,
          width: 817,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 114,
              left: 483,
              top: 120,
              width: 357,
            },
            id: 750,
            index: 21,
            locked: false,
            name: "Text",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    rgb: {
                      blue: 20432,
                      green: 32768,
                      red: 8481,
                    },
                  },
                  fontName: "BebasNeueBook",
                  fontSize: 158.02,
                  orientation: "horizontal",
                },
              ],
              content: "FIND US!",
              paragraphStyles: [
                {
                  alignment: "left",
                },
              ],
              type: "point",
            },
            type: "textLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 119,
              left: 23,
              top: 563,
              width: 344,
            },
            id: 756,
            index: 20,
            locked: false,
            name: "Text",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    rgb: {
                      blue: 9765,
                      green: 6938,
                      red: 5911,
                    },
                  },
                  fontName: "Cheee-Bingbong",
                  fontSize: 167.26,
                  orientation: "horizontal",
                },
              ],
              content: "WOW",
              paragraphStyles: [
                {
                  alignment: "center",
                },
              ],
              type: "point",
            },
            type: "textLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 119,
              left: 23,
              top: 430,
              width: 344,
            },
            id: 755,
            index: 19,
            locked: false,
            name: "Text",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    rgb: {
                      blue: 9765,
                      green: 6938,
                      red: 5911,
                    },
                  },
                  fontName: "Cheee-Bingbong",
                  fontSize: 167.26,
                  orientation: "horizontal",
                },
              ],
              content: "WOW",
              paragraphStyles: [
                {
                  alignment: "center",
                },
              ],
              type: "point",
            },
            type: "textLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 119,
              left: 23,
              top: 296,
              width: 344,
            },
            id: 754,
            index: 18,
            locked: false,
            name: "Text",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    rgb: {
                      blue: 9765,
                      green: 6938,
                      red: 5911,
                    },
                  },
                  fontName: "Cheee-Bingbong",
                  fontSize: 167.26,
                  orientation: "horizontal",
                },
              ],
              content: "WOW",
              paragraphStyles: [
                {
                  alignment: "center",
                },
              ],
              type: "point",
            },
            type: "textLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 119,
              left: 23,
              top: 159,
              width: 344,
            },
            id: 753,
            index: 17,
            locked: false,
            name: "Text",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    rgb: {
                      blue: 9765,
                      green: 6938,
                      red: 5911,
                    },
                  },
                  fontName: "Cheee-Bingbong",
                  fontSize: 167.26,
                  orientation: "horizontal",
                },
              ],
              content: "WOW",
              paragraphStyles: [
                {
                  alignment: "center",
                },
              ],
              type: "point",
            },
            type: "textLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 120,
              left: 23,
              top: 25,
              width: 344,
            },
            id: 752,
            index: 16,
            locked: false,
            name: "Text",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    rgb: {
                      blue: 9765,
                      green: 6938,
                      red: 5911,
                    },
                  },
                  fontName: "Cheee-Bingbong",
                  fontSize: 167.26,
                  orientation: "horizontal",
                },
              ],
              content: "WOW",
              paragraphStyles: [
                {
                  alignment: "center",
                },
              ],
              type: "point",
            },
            type: "textLayer",
            visible: true,
          },
        ],
        id: 657,
        index: 22,
        locked: false,
        name: "Text",
        rotate: 0,
        type: "layerSection",
        visible: true,
      },
      {
        blendOptions: {
          blendMode: "passThrough",
          opacity: 100,
        },
        bounds: {
          height: 283,
          left: 477,
          top: 306,
          width: 456,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 76,
              left: 477,
              top: 306,
              width: 76,
            },
            id: 749,
            index: 13,
            locked: false,
            name: "Vector Smart Object ",
            rotate: 0,
            smartObject: {
              instanceId: "unknown",
              linked: false,
              name: "Objeto inteligente vectorial.ai",
              type: "unknown",
            },
            type: "smartObject",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 44,
              left: 579,
              top: 322,
              width: 336,
            },
            id: 748,
            index: 12,
            locked: false,
            name: "Street",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    rgb: {
                      blue: 32768,
                      green: 32768,
                      red: 32768,
                    },
                  },
                  fontName: "BebasNeueBook",
                  fontSize: 54.17,
                  orientation: "horizontal",
                },
              ],
              content: "Street name, CA,USA",
              paragraphStyles: [
                {
                  alignment: "left",
                },
              ],
              type: "point",
            },
            type: "textLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 76,
              left: 477,
              top: 410,
              width: 76,
            },
            id: 747,
            index: 11,
            locked: false,
            name: "Vector Smart Object ",
            rotate: 0,
            smartObject: {
              instanceId: "unknown",
              linked: false,
              name: "Objeto inteligente vectorial.ai",
              type: "unknown",
            },
            type: "smartObject",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 40,
              left: 578,
              top: 428,
              width: 266,
            },
            id: 746,
            index: 10,
            locked: false,
            name: "Phone Number",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    rgb: {
                      blue: 32768,
                      green: 32768,
                      red: 32768,
                    },
                  },
                  fontName: "BebasNeueBook",
                  fontSize: 54.17,
                  orientation: "horizontal",
                },
              ],
              content: "+00 123 45 67 89",
              paragraphStyles: [
                {
                  alignment: "left",
                },
              ],
              type: "point",
            },
            type: "textLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 76,
              left: 477,
              top: 513,
              width: 76,
            },
            id: 745,
            index: 9,
            locked: false,
            name: "Vector Smart Object ",
            rotate: 0,
            smartObject: {
              instanceId: "unknown",
              linked: false,
              name: "Objeto inteligente vectorial.ai",
              type: "unknown",
            },
            type: "smartObject",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 43,
              left: 579,
              top: 529,
              width: 354,
            },
            id: 744,
            index: 8,
            locked: false,
            name: "Mail",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    rgb: {
                      blue: 32768,
                      green: 32768,
                      red: 32768,
                    },
                  },
                  fontName: "BebasNeueBook",
                  fontSize: 54.17,
                  orientation: "horizontal",
                },
              ],
              content: "youremail@mail.com",
              paragraphStyles: [
                {
                  alignment: "left",
                },
              ],
              type: "point",
            },
            type: "textLayer",
            visible: true,
          },
        ],
        id: 645,
        index: 14,
        locked: false,
        name: "Social Media",
        rotate: 0,
        type: "layerSection",
        visible: true,
      },
      {
        blendOptions: {
          blendMode: "passThrough",
          opacity: 100,
        },
        bounds: {
          height: 718,
          left: 386,
          top: -1,
          width: 709,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 718,
              left: 386,
              top: -1,
              width: 709,
            },
            fill: {
              solidColor: {
                rgb: {
                  blue: 76,
                  green: 54,
                  red: 46,
                },
              },
            },
            id: 751,
            index: 5,
            locked: false,
            name: "Smart Object",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
        ],
        id: 791,
        index: 6,
        locked: false,
        name: "Design",
        rotate: 0,
        type: "layerSection",
        visible: true,
      },
      {
        blendOptions: {
          blendMode: "passThrough",
          opacity: 100,
        },
        bounds: {
          height: 709,
          left: 0,
          top: 0,
          width: 1063,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 709,
              left: 0,
              top: 0,
              width: 1063,
            },
            fill: {
              solidColor: {
                rgb: {
                  blue: 159,
                  green: 255,
                  red: 66,
                },
              },
            },
            id: 563,
            index: 2,
            locked: false,
            mask: {
              enabled: true,
              linked: true,
              offset: {
                x: 0,
                y: 0,
              },
              type: "layer",
            },
            name: "Background",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
        ],
        id: 564,
        index: 3,
        locked: false,
        name: "Background",
        rotate: 0,
        type: "layerSection",
        visible: true,
      },
    ],
    id: 304,
    index: 23,
    locked: false,
    name: "Back",
    rotate: 0,
    type: "layerSection",
    visible: true,
  },
];

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_SECRET_KEY,
  },
});

type Obj = { id: number; children?: Obj[] };

function getLayerCommands(obj: Obj, data: { data: string }) {
  if (data.data === "") {
    data.data = data.data.concat(
      `${JSON.stringify({ delete: {}, id: obj.id })}`
    );
  } else {
    data.data = data.data.concat(
      `,${JSON.stringify({ delete: {}, id: obj.id })}`
    );
  }

  if (obj.children) {
    for (const child of obj.children) {
      getLayerCommands(child, data);
    }
  }

  return data;
}

export const getUploadUrl = async () => {
  const readCommand = new GetObjectCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: "business-card-5.psd",
  });

  const writeCommand = new PutObjectCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: "arts/business-card-5.psd",
  });

  const data = { data: "" };

  getLayerCommands(DATA[1], data);

  console.log({ data });

  return {
    read: await getSignedUrl(s3, readCommand, {
      expiresIn: 60 * 60,
    }),
    write: await getSignedUrl(s3, writeCommand, {
      expiresIn: 60 * 60,
    }),
  };
};