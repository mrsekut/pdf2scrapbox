import fs from "fs/promises";
import path from "path";
import { image } from "./gyazo";

const main = async () => {
  // const [file] = process.argv.slice(2);
  // console.log(file);
  // const name = path.basename(file, ".json");

  // const json = JSON.parse(await fs.readFile(file));

  // const pagePromises = json.pages.reverse().map(async (page) => {
  //   const { lines } = page;
  //   const gyazoImages = lines.filter((l) => l.match(/gyazo.com\/[0-9a-f]{32}/i));
  //   const links = gyazoImages.map(
  //     line => line.match(/gyazo.com\/([0-9a-f]{32})/i)[1]
  //   );
  //   const ocrs = await Promise.all(
  //     links.map(async (id) => {
  //       const { data } = await image({ image_id: id });
  //       return data.ocr;
  //     })
  //   );
  //   const ocrLines = ocrs
  //     .filter((a) => !!a)
  //     .map((ocr) => ocr.description)
  //     .flatMap((desc) => desc.split("\n"))
  //     .map((line) => ">" + line);
  //   lines.push("");
  //   lines.push("(OCR text)");
  //   lines.push(...ocrLines);

  //   return { ...page, lines };
  // });

  // const newJson = { pages: await Promise.all(pagePromises) };

  // fs.writeFile(`out/${name}-ocr.json`, JSON.stringify(newJson));
}

main();