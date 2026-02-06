import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { config } from "./config";

const EXPORTS_DIR = path.join(__dirname, "..", "exports");

export function extractArxivId(text: string): string | null {
  const match = text.match(/(?:arxiv\.org\/(?:abs|html|pdf)\/)?(\d{4}\.\d{4,5})/i);
  return match ? match[1] : null;
}

export async function convertArxivToPdf(
  arxivID: string
): Promise<{ filePath: string; title: string }> {
  const browser = await puppeteer.launch({
    executablePath: config.chromePath,
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto("https://ar5iv.labs.arxiv.org/html/" + arxivID, {
      waitUntil: "networkidle2",
    });

    const rawTitle = await page.evaluate((arxiv: string) => {
      const h1 = document.querySelector("h1.ltx_title.ltx_title_document");
      return h1 ? h1.textContent : arxiv;
    }, arxivID);

    const title = rawTitle
      ? rawTitle + " - arxiv " + arxivID
      : arxivID;

    await page.addStyleTag({
      content: `
        .ltx_noindent > .ltx_p:first-child {
          text-indent: 30px !important;
        }
        html {
          font-size: 200%;
        }
      `,
    });

    if (!fs.existsSync(EXPORTS_DIR)) {
      fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    }

    const filePath = path.join(EXPORTS_DIR, title + ".pdf");

    await page.pdf({
      path: filePath,
      width: "768px",
      height: "1024px",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    return { filePath, title };
  } finally {
    await browser.close();
  }
}
