// This is a wrapper for the vnpay package that fixes the import issues
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load dayjs and required plugins
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

// Apply plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Import vnpay with patched dependencies
const vnpay = require('vnpay');

export default vnpay; 