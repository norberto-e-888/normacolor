import T from "tesseract.js";

export const curateArt = async () => {
  const url =
    "https://www.ijgraphics.co.uk/wp-content/uploads/2022/10/AdobeStock_503564354-scaled.jpeg";

  const { data } = await T.recognize(url, "eng");

  data.words.forEach((word) => {
    console.log(`Text: ${word.text}`);
    console.log(
      `Bounding Box: x=${word.bbox.x0}, y=${word.bbox.y0}, width=${
        word.bbox.x1 - word.bbox.x0
      }, height=${word.bbox.y1 - word.bbox.y0}\n`
    );
  });

  return {
    ok: true,
    data: "url",
  };
};
