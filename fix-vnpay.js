#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';

async function fixVnpayImports() {
  try {

    let nodeModulesPath = path.resolve('.', 'node_modules');
    const pnpmVnpayPath = path.join(nodeModulesPath, '.pnpm', 'vnpay@2.2.0', 'node_modules', 'vnpay', 'dist', 'index.js');
    const directVnpayPath = path.join(nodeModulesPath, 'vnpay', 'dist', 'index.js');  

    let vnpayPath = null;
    try {
      await fs.access(pnpmVnpayPath);
      vnpayPath = pnpmVnpayPath;
    } catch (err) {
      try {
        await fs.access(directVnpayPath);
        vnpayPath = directVnpayPath;
      } catch (err) {
        return;
      }
    }

    if (!vnpayPath) {
        return;
    }
    let content = await fs.readFile(vnpayPath, 'utf8');

    const oldImport = "import me from'dayjs/plugin/timezone'";
    const newImport = "import me from'dayjs/plugin/timezone.js'";
    
    if (content.includes(oldImport)) {
        content = content.replace(oldImport, newImport);
        await fs.writeFile(vnpayPath, content, 'utf8');
    } 

  } catch (err) {
    console.error(err);
  }
}

fixVnpayImports(); 