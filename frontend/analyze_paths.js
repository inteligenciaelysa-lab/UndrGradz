const fs = require('fs');

const svgContent = fs.readFileSync('image (1).svg', 'utf8');

const pathRegex = /<path\s+([^>]+)\/?>/gi;
let match;
const paths = [];

while ((match = pathRegex.exec(svgContent)) !== null) {
  const attrs = match[1];
  const fill = (attrs.match(/fill="([^"]+)"/) || [])[1];
  const d = (attrs.match(/d="([^"]+)"/) || [])[1] || '';
  if (d && fill) {
    paths.push({ fill, d });
  }
}

paths.forEach((p, i) => {
  // Find min/max Y coordinates in pathData
  const numbers = p.d.match(/[-+]?[0-9]*\.?[0-9]+/g);
  let minY = 512, maxY = 0;
  if (numbers) {
    for (let j = 1; j < numbers.length; j += 2) {
      const y = parseFloat(numbers[j]);
      if (!isNaN(y)) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log(`Path ${i}: Fill=${p.fill}, MinY=${minY.toFixed(1)}, MaxY=${maxY.toFixed(1)}`);
});
