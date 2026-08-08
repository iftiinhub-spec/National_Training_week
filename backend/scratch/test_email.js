import 'dotenv/config';
import { sendEmail } from '../src/utils/email.js';

console.log('📧 Testing Gmail SMTP connection...');

const result = await sendEmail({
  to: 'ibrahimahmedabdirahmaan@gmail.com',
  subject: 'Test Email — Hormuud University NTW System',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
      <h2 style="color: #1a6b3c;">Hormuud University National Training Week</h2>
      <p>This is a test email confirming that real email delivery is <strong>fully configured and working</strong> via Gmail SMTP.</p>
      <p style="color: #555;">Sent at: ${new Date().toLocaleString()}</p>
    </div>
  `,
});

console.log('Result:', result);
process.exit(result.success ? 0 : 1);
