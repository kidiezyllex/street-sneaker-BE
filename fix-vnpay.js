#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';

async function fixVnpayImports() {
  console.log('fix-vnpay.js: Starting VNPAY fix script...');
  try {

    // Find the root of the node_modules directory
    let nodeModulesPath = path.resolve('.', 'node_modules');
    console.log(`fix-vnpay.js: Resolved node_modules path: ${nodeModulesPath}`);

    // Construct potential paths to the vnpay dist file within .pnpm
    const pnpmVnpayPath = path.join(nodeModulesPath, '.pnpm', 'vnpay@2.2.0', 'node_modules', 'vnpay', 'dist', 'index.js');
    const directVnpayPath = path.join(nodeModulesPath, 'vnpay', 'dist', 'index.js'); // Fallback for different structures

    let vnpayPath = null;

    // Check which path exists
    console.log(`fix-vnpay.js: Checking pnpm path: ${pnpmVnpayPath}`);
    try {
      await fs.access(pnpmVnpayPath);
      vnpayPath = pnpmVnpayPath;
      console.log('fix-vnpay.js: pnpm path exists.');
    } catch (err) {
      console.log('fix-vnpay.js: pnpm path not found. Checking direct path...');
      console.log(`fix-vnpay.js: Checking direct path: ${directVnpayPath}`);
      try {
        await fs.access(directVnpayPath);
        vnpayPath = directVnpayPath;
        console.log('fix-vnpay.js: Direct path exists.');
      } catch (err) {
        console.error('fix-vnpay.js: Could not find vnpay module path in expected locations.', err);
        return;
      }
    }

    if (!vnpayPath) {
        console.error('fix-vnpay.js: VNPAY module path not determined.');
        return;
    }

    console.log(`fix-vnpay.js: Found VNPAY at: ${vnpayPath}`);

    // Read the file content
    console.log('fix-vnpay.js: Reading file content...');
    let content = await fs.readFile(vnpayPath, 'utf8');

    // Replace the timezone import with .js extension
    const oldImport = "import me from'dayjs/plugin/timezone'";
    const newImport = "import me from'dayjs/plugin/timezone.js'";
    console.log(`fix-vnpay.js: Looking for import: ${oldImport}`);
    
    if (content.includes(oldImport)) {
        console.log('fix-vnpay.js: Found incorrect import. Applying fix...');
        content = content.replace(oldImport, newImport);
        // Write back the modified content
        await fs.writeFile(vnpayPath, content, 'utf8');
        console.log('fix-vnpay.js: Successfully wrote fixed content.');
        console.log('fix-vnpay.js: Successfully fixed VNPAY imports.');
    } else {
        console.log('fix-vnpay.js: VNPAY timezone import already has .js extension or is not found.');
    }

  } catch (err) {
    console.error('fix-vnpay.js: Error during VNPAY fix script:', err);
  }
   console.log('fix-vnpay.js: VNPAY fix script finished.');
}

// Run the fix
fixVnpayImports(); 