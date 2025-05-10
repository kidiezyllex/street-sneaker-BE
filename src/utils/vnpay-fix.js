// This is a wrapper for the vnpay package that fixes the import issues
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load dayjs and required plugins
import dayjs from 'dayjs';
const utc = require('dayjs/plugin/utc.js');
const timezone = require('dayjs/plugin/timezone.js');

dayjs.extend(utc);
dayjs.extend(timezone);

const vnpay = require('vnpay');

export { dateFormat, ProductCode, VnpLocale };
export default vnpay; 