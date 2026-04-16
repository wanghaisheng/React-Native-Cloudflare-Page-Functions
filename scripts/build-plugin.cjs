const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../plugin/src');
const buildDir = path.join(__dirname, '../plugin/build');

// Create build directory if it doesn't exist
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('Created build directory:', buildDir);
}

// Copy .js files and rename to .cjs
const files = [
  { src: 'index.js', dest: 'index.cjs' },
  { src: 'withGodotFiles.js', dest: 'withGodotFiles.cjs' },
  { src: 'withPckFile.js', dest: 'withPckFile.cjs' }
];

for (const { src, dest } of files) {
  const srcPath = path.join(sourceDir, src);
  const destPath = path.join(buildDir, dest);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('Copied:', src, '->', dest);
  } else {
    console.error('Source file not found:', srcPath);
  }
}

console.log('Plugin build completed');
