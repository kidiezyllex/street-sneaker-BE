#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';

async function fixVnpayImports() {
  try {

    let nodeModulesPath = path.resolve('.', 'node_modules');
    const pnpmVnpayPath = path.join(nodeModulesPath, '.pnpm', 'vnpay@2.2.0', 'node_modules', 'vnpay', 'dist', 'index.js');
    const directVnpayPath = path.join(nodeModulesPath, 'vnpay', 'dist', 'index.js'); // Fallback for different structures

    let vnpayPath = null;
    try {
      await fs.access(pnpmVnpayPath);
      vnpayPath = pnpmVnpayPath;
    } catch (err) {
      try {
        await fs.access(directVnpayPath);
        vnpayPath = directVnpayPath;
      } catch (err) {
        console.error('fix-vnpay.js: Could not find vnpay module path in expected locations.', err);
        return;
      }
    }

    if (!vnpayPath) {
        console.error('fix-vnpay.js: VNPAY module path not determined.');
        return;
    }
    let content = await fs.readFile(vnpayPath, 'utf8');

    // Replace the timezone import with .js extension
    const oldImport = "import me from'dayjs/plugin/timezone'";
    const newImport = "import me from'dayjs/plugin/timezone.js'";
    
    if (content.includes(oldImport)) {
        content = content.replace(oldImport, newImport);
        await fs.writeFile(vnpayPath, content, 'utf8');
    } 

  } catch (err) {
    console.error('fix-vnpay.js: Error during VNPAY fix script:', err);
  }
}

fixVnpayImports(); 