const fs = require('fs');

const svgContent = fs.readFileSync('image (1).svg', 'utf8');
const pathRegex = /<path\s+([^>]+)\/?>/gi;
let match;
let count = 0;

while ((match = pathRegex.exec(svgContent)) !== null) {
  const attrs = match[1];
  const fill = (attrs.match(/fill="([^"]+)"/) || [])[1] || 'none';
  const transform = (attrs.match(/transform="([^"]+)"/) || [])[1] || '';
  const d = (attrs.match(/d="([^"]+)"/) || [])[1] || '';
  console.log(`Path ${count}: Fill=${fill}, Transform=${transform}, D_len=${d.length}`);
  count++;
}
