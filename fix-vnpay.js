#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fixVnpayImports() {
  try {
    console.log('Starting VNPAY fix script...');
    
    // Determine the path to the vnpay module
    let vnpayPath;
    try {
      vnpayPath = path.join(__dirname, 'node_modules', '.pnpm', 'vnpay@2.2.0', 'node_modules', 'vnpay', 'dist', 'index.js');
      await fs.access(vnpayPath);
    } catch (err) {
      // Try alternative path structure
      try {
        vnpayPath = path.join(__dirname, 'node_modules', 'vnpay', 'dist', 'index.js');
        await fs.access(vnpayPath);
      } catch (err) {
        console.error('Could not find vnpay module path:', err);
        return;
      }
    }

    console.log(`Found VNPAY at: ${vnpayPath}`);
    
    // Read the file content
    let content = await fs.readFile(vnpayPath, 'utf8');
    
    // Replace the timezone import with .js extension
    content = content.replace(
      "import me from'dayjs/plugin/timezone'",
      "import me from'dayjs/plugin/timezone.js'"
    );
    
    // Write back the modified content
    await fs.writeFile(vnpayPath, content, 'utf8');
    
    console.log('Successfully fixed VNPAY imports');
  } catch (err) {
    console.error('Error fixing VNPAY:', err);
  }
}

// Run the fix
fixVnpayImports(); 