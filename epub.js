const puppeteer = require('puppeteer');
const arxivID = process.argv.slice(2)[0];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://ar5iv.labs.arxiv.org/html/' + arxivID, { waitUntil: 'networkidle2' });

  const title = await page.evaluate((arxiv) => {
    const h1Element = document.querySelector('h1.ltx_title.ltx_title_document');
    return h1Element ? h1Element.innerText : arxiv;
  });


  // Inject CSS to add paragraph indentation and scalle font size 
  await page.addStyleTag({
    content: `
 .ltx_noindent > .ltx_p:first-child {
 text-indent: 30px !important;
 }

html {
 font-size: 200%;
}
 `
  });

  await page.pdf({
    path: title + '.pdf',
    width: '768px',
    height: '1024px',
    printBackground: true,
    margin: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm'
    }
  });

  await browser.close();
})();

