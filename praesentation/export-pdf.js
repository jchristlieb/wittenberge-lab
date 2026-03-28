const puppeteer = require('puppeteer');
const path = require('path');

const SLIDE_COUNT = 11;
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
const OUT  = path.resolve(__dirname, '../Wittenberge_Lab_Praesentation.pdf');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(FILE, { waitUntil: 'networkidle0' });

  const pages = [];

  for (let i = 0; i < SLIDE_COUNT; i++) {
    // activate slide i via JS
    await page.evaluate((idx) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach((s, j) => s.classList.toggle('active', j === idx));
    }, i);

    await new Promise(r => setTimeout(r, 120));

    const screenshot = await page.screenshot({ type: 'png', fullPage: false });
    pages.push(screenshot);
    process.stdout.write(`  Slide ${i + 1}/${SLIDE_COUNT}\r`);
  }

  await browser.close();

  // assemble into PDF using built-in pdf lib via a second page
  const browser2 = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });
  const page2 = await browser2.newPage();

  // Build an HTML page that embeds all screenshots and prints one per page
  const imgs = pages.map(buf =>
    `<img src="data:image/png;base64,${buf.toString('base64')}" style="width:100%;display:block;page-break-after:always;">`
  ).join('\n');

  await page2.setContent(`<!DOCTYPE html>
<html>
<head>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0f1117; }
  img { width:100%; height:auto; display:block; }
</style>
</head>
<body>${imgs}</body>
</html>`);

  await page2.pdf({
    path: OUT,
    width: '1280px',
    height: '720px',
    printBackground: true,
    pageRanges: '',
  });

  await browser2.close();

  console.log(`\nGespeichert: ${OUT}`);
})();
