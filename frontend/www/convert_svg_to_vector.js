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

console.log(`Extracted ${paths.length} paths from image (1).svg`);

const capIndices = [2, 3, 27, 28];
const studentsIndices = [4, 21, 22, 23, 24, 25];
const textIndices = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 26];
const shieldIndices = [0, 1];

function renderPaths(indices) {
  return indices.map(i => {
    const p = paths[i];
    if (!p) return '';
    return `        <path\n            android:fillColor="${p.fill}"\n            android:pathData="${p.d}" />`;
  }).filter(Boolean).join('\n');
}

// Scale 0.73 makes the logo ~28% larger and far more prominent on screen while keeping exact same high-energy animation
const vectorXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="288dp"
    android:height="288dp"
    android:viewportWidth="512"
    android:viewportHeight="512">

    <!-- Cheerful Main Logo Group (Scaled 0.73 for larger, bolder, more impactful presence) -->
    <group
        android:name="logo_main_group"
        android:pivotX="256"
        android:pivotY="256"
        android:scaleX="0.73"
        android:scaleY="0.73">

        <!-- Shield Outline & Letter U Group -->
        <group
            android:name="shield_group"
            android:pivotX="256"
            android:pivotY="220"
            android:scaleX="1.0"
            android:scaleY="1.0"
            android:alpha="1.0">
${renderPaths(shieldIndices)}
        </group>

        <!-- 3 Celebrating Students Group (Jumping up happily!) -->
        <group
            android:name="students_group"
            android:pivotX="256"
            android:pivotY="320"
            android:translateY="0"
            android:scaleX="1.0"
            android:scaleY="1.0">
${renderPaths(studentsIndices)}
        </group>

        <!-- UNDRGRADZ Brand Text Group (High-energy pop & wave) -->
        <group
            android:name="brand_text_group"
            android:pivotX="256"
            android:pivotY="420"
            android:scaleX="1.0"
            android:scaleY="1.0"
            android:alpha="1.0">
${renderPaths(textIndices)}
        </group>

        <!-- Falling & Bouncing Red Graduation Cap Group -->
        <group
            android:name="cap_falling_group"
            android:pivotX="256"
            android:pivotY="140"
            android:translateX="0"
            android:translateY="0"
            android:rotation="0"
            android:scaleX="1.0"
            android:scaleY="1.0">
${renderPaths(capIndices)}
        </group>

    </group>
</vector>
`;

fs.writeFileSync('android/app/src/main/res/drawable/ic_splash_vector.xml', vectorXml, 'utf8');
console.log('Successfully generated larger ic_splash_vector.xml (scaled 0.73)!');
