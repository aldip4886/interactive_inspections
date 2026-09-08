import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('[SCORM Package] Building Vite bundle...');
execSync('npm run build', { stdio: 'inherit' });

console.log('[SCORM Package] Copying imsmanifest.xml to dist...');
const manifestSrc = path.join(process.cwd(), 'scorm', 'imsmanifest.xml');
const manifestDist = path.join(process.cwd(), 'dist', 'imsmanifest.xml');
fs.copyFileSync(manifestSrc, manifestDist);

console.log('[SCORM Package] Copying data JSON files to dist/src/data...');
const jsonDistDir = path.join(process.cwd(), 'dist', 'src', 'data');
fs.mkdirSync(jsonDistDir, { recursive: true });

const dataFiles = fs.readdirSync(path.join(process.cwd(), 'src', 'data'));
dataFiles.forEach(file => {
  fs.copyFileSync(
    path.join(process.cwd(), 'src', 'data', file),
    path.join(jsonDistDir, file)
  );
});

console.log('[SCORM Package] Copying public images to dist/assets/images...');
const publicImagesSrc = path.join(process.cwd(), 'public', 'assets', 'images');
const distImagesDest = path.join(process.cwd(), 'dist', 'assets', 'images');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirRecursive(publicImagesSrc, distImagesDest);

console.log('[SCORM Package] Creating scorm_package.zip...');


try {
  execSync('powershell -Command "Compress-Archive -Path dist\\* -DestinationPath scorm_package.zip -Force"', { stdio: 'inherit' });
  console.log('[SCORM Package] scorm_package.zip generated successfully!');
} catch (err) {
  console.error('[SCORM Package] Failed to zip package:', err.message);
}

console.log('[SCORM Package] Build output ready in scorm_package.zip!');
console.log('[SCORM Package] Upload scorm_package.zip directly to KLC2 LMS.');

