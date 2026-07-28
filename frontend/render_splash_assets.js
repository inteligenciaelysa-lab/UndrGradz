const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const frontendDir = __dirname;
const svgPath = path.join(frontendDir, 'image (1).svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

const splashDir = path.join(frontendDir, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset');
if (!fs.existsSync(splashDir)) {
  fs.mkdirSync(splashDir, { recursive: true });
}

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const sizes = [
  { name: 'splash-1x.png', width: 512, scale: 0.5 },
  { name: 'splash-2x.png', width: 1024, scale: 1.0 },
  { name: 'splash-3x.png', width: 1536, scale: 1.5 }
];

for (const s of sizes) {
  const size = s.width;
  const svgSize = Math.round(size * 0.75);
  const pageHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: ${size}px;
    height: ${size}px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  svg {
    width: ${svgSize}px;
    height: ${svgSize}px;
  }
</style>
</head>
<body>
  ${svgContent}
</body>
</html>`;
  const pagePath = path.join(frontendDir, `temp_splash_${size}.html`);
  const outPngPath = path.join(splashDir, s.name);
  fs.writeFileSync(pagePath, pageHtml);

  console.log(`Rendering ${s.name} (${size}x${size})...`);
  execSync(`"${edgePath}" --headless --default-background-color=00000000 --disable-gpu --screenshot="${outPngPath}" --window-size=${size},${size} "${pagePath}"`);
  
  if (fs.existsSync(pagePath)) fs.unlinkSync(pagePath);
}

const contentsJson = {
  "images": [
    {
      "idiom": "universal",
      "filename": "splash-1x.png",
      "scale": "1x"
    },
    {
      "idiom": "universal",
      "filename": "splash-2x.png",
      "scale": "2x"
    },
    {
      "idiom": "universal",
      "filename": "splash-3x.png",
      "scale": "3x"
    }
  ],
  "info": {
    "version": 1,
    "author": "xcode"
  }
};

fs.writeFileSync(path.join(splashDir, 'Contents.json'), JSON.stringify(contentsJson, null, 2));

console.log('✅ Splash images generated successfully from image (1).svg');
