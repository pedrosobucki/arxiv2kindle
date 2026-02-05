import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const arxivID: string | undefined = process.argv[2];

async function main() {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto("https://ar5iv.labs.arxiv.org/html/" + arxivID, {
    waitUntil: "networkidle2",
  });

  const title = await page.evaluate((arxiv: string | undefined) => {
    const h1Element = document.querySelector("h1.ltx_title.ltx_title_document");
    return h1Element ? h1Element.textContent + " - arxiv " + arxiv : arxiv;
  }, arxivID);

  // Inject CSS to add paragraph indentation and scale font size
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

  const exportsDir = path.join(__dirname, "exports");
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir);
  }

  await page.pdf({
    path: path.join(exportsDir, title + ".pdf"),
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

  await browser.close();
}

main();
