import fs from "fs";
import { PDFDocument, rgb, setFontAndSize } from "pdf-lib";
import T from "tesseract.js";

export const curateArt = async () => {
  const url =
    "https://www.ijgraphics.co.uk/wp-content/uploads/2022/10/AdobeStock_503564354-scaled.jpeg";

  const imageResponse = await fetch(url);
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const worker = await T.createWorker();

  await worker.load();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");
  await worker.setParameters({
    tessedit_pageseg_mode: T.PSM.SPARSE_TEXT,
  });

  const { data: recognition } = await worker.recognize(imageBuffer);
  const pdf = await PDFDocument.create();
  const image = await pdf.embedJpg(imageBuffer);
  const page = pdf.addPage([image.width, image.height]);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  const form = pdf.getForm();

  recognition.lines.forEach((line, i) => {
    const { x0, y0, x1, y1 } = line.bbox;
    const wordsInLine = line.words.map((w) => w.text).join(" ");
    const width = x1 - x0;
    const height = y1 - y0;
    const textField = form.createTextField(`${wordsInLine}.${i}`);
    const da = textField.acroField.getDefaultAppearance() ?? "";
    const newDa = da + "\n" + setFontAndSize("Courier", 12).toString();

    textField.setText(replaceLigatures(wordsInLine));
    textField.acroField.setDefaultAppearance(newDa);
    textField.enableMultiline();
    textField.addToPage(page, {
      x: x0 - 4,
      y: page.getHeight() - y1 - 4,
      width: width + 12,
      height: height + 12,
      borderWidth: 0,
      backgroundColor: rgb(1, 1, 1),
    });
  });

  pdf.setTitle("PDF with Text Fields from External Image");
  pdf.setAuthor("Your Name");
  pdf.setSubject("Editable text fields from OCR");

  const pdfBytes = await pdf.save();
  fs.writeFileSync("output.pdf", pdfBytes);

  return {
    ok: true,
    data: "url",
  };
};

function replaceLigatures(text: string) {
  return text
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .replace(/ﬀ/g, "ff")
    .replace(/ﬃ/g, "ffi")
    .replace(/ﬄ/g, "ffl");
}
