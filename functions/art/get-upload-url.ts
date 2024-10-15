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
      height: 600,
      left: 38,
      top: 38,
      width: 1050,
    },
    children: [
      {
        blendOptions: {
          blendMode: "normal",
          opacity: 100,
        },
        bounds: {
          height: 600,
          left: 38,
          top: 38,
          width: 1050,
        },
        id: 5052,
        index: 72,
        locked: false,
        name: "Die Cut",
        rotate: 0,
        type: "fillLayer",
        visible: false,
      },
    ],
    id: 5053,
    index: 73,
    locked: false,
    name: "Die Cut",
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
      height: 675,
      left: 0,
      top: 0,
      width: 1125,
    },
    children: [
      {
        blendOptions: {
          blendMode: "normal",
          opacity: 100,
        },
        bounds: {
          height: 675,
          left: 0,
          top: 0,
          width: 1125,
        },
        id: 5049,
        index: 69,
        locked: false,
        name: "Rectangle 1 copy 2",
        rotate: 0,
        type: "layer",
        visible: false,
      },
      {
        blendOptions: {
          blendMode: "normal",
          opacity: 100,
        },
        bounds: {
          height: 675,
          left: 0,
          top: 0,
          width: 1125,
        },
        id: 5048,
        index: 68,
        locked: false,
        name: "Bleeds + Guides",
        rotate: 0,
        type: "layer",
        visible: false,
      },
    ],
    id: 5050,
    index: 70,
    locked: false,
    name: "Bleed and Trim",
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
      height: 702,
      left: -100,
      top: -9,
      width: 1225,
    },
    children: [
      {
        blendOptions: {
          blendMode: "passThrough",
          opacity: 100,
        },
        bounds: {
          height: 144,
          left: 92,
          top: 145,
          width: 257,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 76,
              left: 182,
              top: 145,
              width: 77,
            },
            id: 6033,
            index: 64,
            locked: false,
            name: "Logo",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 25,
              left: 92,
              top: 236,
              width: 256,
            },
            id: 6032,
            index: 63,
            locked: false,
            name: "Dream Studio",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    cmyk: {
                      black: 32768,
                      cyan: 32768,
                      magenta: 32768,
                      yellowColor: 32768,
                    },
                  },
                  fontName: "NexaBold",
                  fontSize: 34.19,
                  from: 0,
                  orientation: "horizontal",
                  to: 4,
                },
                {
                  fontAvailable: false,
                  fontColor: {
                    cmyk: {
                      black: 32768,
                      cyan: 32768,
                      magenta: 32768,
                      yellowColor: 32768,
                    },
                  },
                  fontName: "NexaLight",
                  fontSize: 34.19,
                  from: 5,
                  orientation: "horizontal",
                  to: 11,
                },
              ],
              content: "Dream Studio",
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
              height: 16,
              left: 92,
              top: 273,
              width: 257,
            },
            id: 6031,
            index: 62,
            locked: false,
            name: "VISUAL ART & DESIGN",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    cmyk: {
                      black: 32768,
                      cyan: 32768,
                      magenta: 32768,
                      yellowColor: 32768,
                    },
                  },
                  fontName: "NexaLight",
                  fontSize: 21.42,
                  orientation: "horizontal",
                },
              ],
              content: "VISUAL ART & DESIGN",
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
        id: 6034,
        index: 65,
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
          height: 79,
          left: 639,
          top: 145,
          width: 343,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 79,
              left: 639,
              top: 145,
              width: 18,
            },
            id: 5962,
            index: 59,
            locked: false,
            name: "Name Tab",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 31,
              left: 678,
              top: 151,
              width: 304,
            },
            id: 5961,
            index: 58,
            locked: false,
            name: "MICHAL JOHNS",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    cmyk: {
                      black: 1671,
                      cyan: 32768,
                      magenta: 32768,
                      yellowColor: 32768,
                    },
                  },
                  fontName: "Raleway-Bold",
                  fontSize: 41.67,
                  from: 0,
                  orientation: "horizontal",
                  to: 6,
                },
                {
                  fontAvailable: false,
                  fontColor: {
                    cmyk: {
                      black: 1671,
                      cyan: 32768,
                      magenta: 32768,
                      yellowColor: 32768,
                    },
                  },
                  fontName: "Raleway-Regular",
                  fontSize: 41.67,
                  from: 7,
                  orientation: "horizontal",
                  to: 11,
                },
              ],
              content: "MICHAL JOHNS",
              paragraphStyles: [
                {
                  alignment: "right",
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
              height: 29,
              left: 675,
              top: 190,
              width: 236,
            },
            id: 5960,
            index: 57,
            locked: false,
            name: "Solution Manager",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    cmyk: {
                      black: 1671,
                      cyan: 32768,
                      magenta: 32768,
                      yellowColor: 32768,
                    },
                  },
                  fontName: "Raleway-Light",
                  fontSize: 29.17,
                  orientation: "horizontal",
                },
              ],
              content: "Solution Manager",
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
        id: 5963,
        index: 60,
        locked: false,
        name: "Name & Title",
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
          height: 236,
          left: 639,
          top: 294,
          width: 320,
        },
        children: [
          {
            blendOptions: {
              blendMode: "passThrough",
              opacity: 100,
            },
            bounds: {
              height: 60,
              left: 639,
              top: 294,
              width: 286,
            },
            children: [
              {
                blendOptions: {
                  blendMode: "normal",
                  opacity: 100,
                },
                bounds: {
                  height: 48,
                  left: 717,
                  top: 301,
                  width: 208,
                },
                id: 5850,
                index: 53,
                locked: false,
                name: "+000 12345 6789 +000 12345 6789",
                rotate: 0,
                text: {
                  characterStyles: [
                    {
                      fontAvailable: false,
                      fontColor: {
                        cmyk: {
                          black: 1671,
                          cyan: 32768,
                          magenta: 32768,
                          yellowColor: 32768,
                        },
                      },
                      fontName: "NexaLight",
                      fontSize: 25.02,
                      orientation: "horizontal",
                    },
                  ],
                  content: "+000 12345 6789\r+000 12345 6789",
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
                  height: 23,
                  left: 655,
                  top: 311,
                  width: 28,
                },
                id: 5849,
                index: 52,
                locked: false,
                name: "Phone",
                rotate: 0,
                type: "fillLayer",
                visible: true,
              },
              {
                blendOptions: {
                  blendMode: "normal",
                  opacity: 100,
                },
                bounds: {
                  height: 56,
                  left: 639,
                  top: 294,
                  width: 45,
                },
                id: 5848,
                index: 51,
                locked: false,
                name: "Shape 01",
                rotate: 0,
                type: "fillLayer",
                visible: true,
              },
              {
                blendOptions: {
                  blendMode: "normal",
                  opacity: 100,
                },
                bounds: {
                  height: 60,
                  left: 639,
                  top: 294,
                  width: 60,
                },
                id: 5847,
                index: 50,
                locked: false,
                name: "Shape 02",
                rotate: 0,
                type: "fillLayer",
                visible: true,
              },
            ],
            id: 5851,
            index: 54,
            locked: false,
            name: "Phone",
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
              height: 60,
              left: 639,
              top: 382,
              width: 316,
            },
            children: [
              {
                blendOptions: {
                  blendMode: "normal",
                  opacity: 100,
                },
                bounds: {
                  height: 49,
                  left: 718,
                  top: 388,
                  width: 237,
                },
                id: 5844,
                index: 47,
                locked: false,
                name: "urwebsitename.com urname@email.com",
                rotate: 0,
                text: {
                  characterStyles: [
                    {
                      fontAvailable: false,
                      fontColor: {
                        cmyk: {
                          black: 1671,
                          cyan: 32768,
                          magenta: 32768,
                          yellowColor: 32768,
                        },
                      },
                      fontName: "NexaLight",
                      fontSize: 25.02,
                      orientation: "horizontal",
                    },
                  ],
                  content: "urwebsitename.com\rurname@email.com",
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
                  height: 28,
                  left: 655,
                  top: 398,
                  width: 27,
                },
                id: 5843,
                index: 46,
                locked: false,
                name: "Web",
                rotate: 0,
                type: "fillLayer",
                visible: true,
              },
              {
                blendOptions: {
                  blendMode: "normal",
                  opacity: 100,
                },
                bounds: {
                  height: 56,
                  left: 639,
                  top: 382,
                  width: 45,
                },
                id: 5842,
                index: 45,
                locked: false,
                name: "Shape 01",
                rotate: 0,
                type: "fillLayer",
                visible: true,
              },
              {
                blendOptions: {
                  blendMode: "normal",
                  opacity: 100,
                },
                bounds: {
                  height: 60,
                  left: 639,
                  top: 382,
                  width: 60,
                },
                id: 5841,
                index: 44,
                locked: false,
                name: "Shape 02",
                rotate: 0,
                type: "fillLayer",
                visible: true,
              },
            ],
            id: 5845,
            index: 48,
            locked: false,
            name: "Web",
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
              height: 60,
              left: 639,
              top: 470,
              width: 320,
            },
            children: [
              {
                blendOptions: {
                  blendMode: "normal",
                  opacity: 100,
                },
                bounds: {
                  height: 55,
                  left: 716,
                  top: 472,
                  width: 243,
                },
                id: 5838,
                index: 41,
                locked: false,
                name: "Street Address Here Singapore, 2222",
                rotate: 0,
                text: {
                  characterStyles: [
                    {
                      fontAvailable: false,
                      fontColor: {
                        cmyk: {
                          black: 1671,
                          cyan: 32768,
                          magenta: 32768,
                          yellowColor: 32768,
                        },
                      },
                      fontName: "NexaLight",
                      fontSize: 25.02,
                      orientation: "horizontal",
                    },
                  ],
                  content: "Street Address Here\rSingapore, 2222",
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
                  height: 33,
                  left: 658,
                  top: 484,
                  width: 23,
                },
                id: 5837,
                index: 40,
                locked: false,
                name: "Location",
                rotate: 0,
                type: "fillLayer",
                visible: true,
              },
              {
                blendOptions: {
                  blendMode: "normal",
                  opacity: 100,
                },
                bounds: {
                  height: 56,
                  left: 639,
                  top: 470,
                  width: 45,
                },
                id: 5948,
                index: 39,
                locked: false,
                name: "Shape 01",
                rotate: 0,
                type: "fillLayer",
                visible: true,
              },
              {
                blendOptions: {
                  blendMode: "normal",
                  opacity: 100,
                },
                bounds: {
                  height: 60,
                  left: 639,
                  top: 470,
                  width: 60,
                },
                id: 5949,
                index: 38,
                locked: false,
                name: "Shape 02",
                rotate: 0,
                type: "fillLayer",
                visible: true,
              },
            ],
            id: 5839,
            index: 42,
            locked: false,
            name: "Location",
            rotate: 0,
            type: "layerSection",
            visible: true,
          },
        ],
        id: 5852,
        index: 55,
        locked: false,
        name: "Address ",
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
          height: 134,
          left: 153,
          top: 456,
          width: 134,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 108,
              left: 166,
              top: 469,
              width: 108,
            },
            id: 5955,
            index: 34,
            locked: false,
            mask: {
              clip: true,
            },
            name: "Rectangle 01",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 108,
              left: 166,
              top: 469,
              width: 108,
            },
            id: 5954,
            index: 33,
            locked: false,
            mask: {
              clip: true,
            },
            name: "Rectangle 02",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 108,
              left: 166,
              top: 469,
              width: 108,
            },
            id: 5953,
            index: 32,
            locked: false,
            name: "Qr Code",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 134,
              left: 153,
              top: 456,
              width: 134,
            },
            id: 5957,
            index: 31,
            locked: false,
            name: "Rectangle 3",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
        ],
        id: 5956,
        index: 35,
        locked: false,
        name: "Qr Code",
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
          height: 702,
          left: -100,
          top: -9,
          width: 663,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 676,
              left: -7,
              top: -1,
              width: 570,
            },
            id: 6029,
            index: 28,
            locked: false,
            name: "Shape 27",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 702,
              left: -100,
              top: -9,
              width: 576,
            },
            id: 6028,
            index: 27,
            locked: false,
            name: "Rectangle 1 copy 2",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 702,
              left: -73,
              top: -9,
              width: 576,
            },
            id: 6027,
            index: 26,
            locked: false,
            name: "Rectangle 1 copy",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 702,
              left: -54,
              top: -9,
              width: 576,
            },
            id: 6026,
            index: 25,
            locked: false,
            name: "Rectangle 1 copy 3",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
        ],
        id: 5884,
        index: 29,
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
          height: 675,
          left: 0,
          top: 0,
          width: 1125,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 675,
              left: 0,
              top: 0,
              width: 1125,
            },
            id: 5780,
            index: 22,
            locked: false,
            name: "Background",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
        ],
        id: 5781,
        index: 23,
        locked: false,
        name: "Background",
        rotate: 0,
        type: "layerSection",
        visible: true,
      },
    ],
    id: 5817,
    index: 66,
    locked: false,
    name: "Front Card",
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
      height: 702,
      left: 0,
      top: -9,
      width: 1225,
    },
    children: [
      {
        blendOptions: {
          blendMode: "passThrough",
          opacity: 100,
        },
        bounds: {
          height: 144,
          left: 209,
          top: 266,
          width: 258,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 76,
              left: 299,
              top: 266,
              width: 78,
            },
            id: 6081,
            index: 17,
            locked: false,
            name: "Logo",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 25,
              left: 210,
              top: 357,
              width: 256,
            },
            id: 6080,
            index: 16,
            locked: false,
            name: "Dream Studio",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    cmyk: {
                      black: 1671,
                      cyan: 32768,
                      magenta: 32768,
                      yellowColor: 32768,
                    },
                  },
                  fontName: "NexaBold",
                  fontSize: 34.14,
                  from: 0,
                  orientation: "horizontal",
                  to: 4,
                },
                {
                  fontAvailable: false,
                  fontColor: {
                    cmyk: {
                      black: 1671,
                      cyan: 32768,
                      magenta: 32768,
                      yellowColor: 32768,
                    },
                  },
                  fontName: "NexaLight",
                  fontSize: 34.14,
                  from: 5,
                  orientation: "horizontal",
                  to: 11,
                },
              ],
              content: "Dream Studio",
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
              height: 16,
              left: 209,
              top: 394,
              width: 258,
            },
            id: 6079,
            index: 15,
            locked: false,
            name: "VISUAL ART & DESIGN",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    cmyk: {
                      black: 1671,
                      cyan: 32768,
                      magenta: 32768,
                      yellowColor: 32768,
                    },
                  },
                  fontName: "NexaLight",
                  fontSize: 21.38,
                  orientation: "horizontal",
                },
              ],
              content: "VISUAL ART & DESIGN",
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
        id: 6082,
        index: 18,
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
          height: 26,
          left: 704,
          top: 545,
          width: 312,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 22,
              left: 741,
              top: 545,
              width: 275,
            },
            id: 5933,
            index: 12,
            locked: false,
            name: "urwebsitename.com",
            rotate: 0,
            text: {
              characterStyles: [
                {
                  fontAvailable: false,
                  fontColor: {
                    cmyk: {
                      black: 32768,
                      cyan: 32768,
                      magenta: 32768,
                      yellowColor: 32768,
                    },
                  },
                  fontName: "NexaLight",
                  fontSize: 29.18,
                  orientation: "horizontal",
                },
              ],
              content: "urwebsitename.com",
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
              height: 26,
              left: 704,
              top: 545,
              width: 25,
            },
            id: 5932,
            index: 11,
            locked: false,
            name: "Web Icon",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
        ],
        id: 5934,
        index: 13,
        locked: false,
        name: "Web",
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
          height: 702,
          left: 562,
          top: -9,
          width: 663,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 676,
              left: 562,
              top: -1,
              width: 570,
            },
            id: 6045,
            index: 8,
            locked: false,
            name: "Shape 27",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 702,
              left: 649,
              top: -9,
              width: 576,
            },
            id: 6044,
            index: 7,
            locked: false,
            name: "Rectangle 1 copy 2",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 702,
              left: 622,
              top: -9,
              width: 576,
            },
            id: 6043,
            index: 6,
            locked: false,
            name: "Rectangle 1 copy",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 702,
              left: 603,
              top: -9,
              width: 576,
            },
            id: 6042,
            index: 5,
            locked: false,
            name: "Rectangle 1 copy 3",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
        ],
        id: 6046,
        index: 9,
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
          height: 675,
          left: 0,
          top: 0,
          width: 1125,
        },
        children: [
          {
            blendOptions: {
              blendMode: "normal",
              opacity: 100,
            },
            bounds: {
              height: 675,
              left: 0,
              top: 0,
              width: 1125,
            },
            id: 6039,
            index: 2,
            locked: false,
            name: "Background",
            rotate: 0,
            type: "fillLayer",
            visible: true,
          },
        ],
        id: 6040,
        index: 3,
        locked: false,
        name: "Background",
        rotate: 0,
        type: "layerSection",
        visible: true,
      },
    ],
    id: 6083,
    index: 19,
    locked: false,
    name: "Back Card",
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
    Key: "business-card-6.psd",
  });

  const writeCommand = new PutObjectCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: "arts/business-card-6.psd",
  });

  const data = { data: "" };

  getLayerCommands(DATA[2], data);

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
