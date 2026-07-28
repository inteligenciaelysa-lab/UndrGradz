const fs = require('fs');

const svgContent = fs.readFileSync('image (1).svg', 'utf8');

const pathRegex = /<path\s+([^>]+)\/?>/gi;
let match;
const paths = [];

while ((match = pathRegex.exec(svgContent)) !== null) {
  const attrs = match[1];
  const fill = (attrs.match(/fill="([^"]+)"/) || [])[1];
  const transform = (attrs.match(/transform="([^"]+)"/) || [])[1] || '';
  const d = (attrs.match(/d="([^"]+)"/) || [])[1] || '';
  if (d && fill) {
    paths.push({ fill, transform, d });
  }
}

paths.forEach((p, i) => {
  let tx = 0, ty = 0;
  const m = p.transform.match(/translate\s*\(\s*([-0-9.]+)\s*(?:,\s*|\s+)([-0-9.]+)\s*\)/);
  if (m) {
    tx = parseFloat(m[1]);
    ty = parseFloat(m[2]);
  }
  console.log(`Path ${i}: Fill=${p.fill}, TX=${tx}, TY=${ty}`);
});
