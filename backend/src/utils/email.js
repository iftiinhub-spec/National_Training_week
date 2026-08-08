import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

export const sendInvitationEmail = async ({ to, trainingTitle, eventName, meetingUrl, meetingId, passcode, startTime, platform, notes }) => {
  const platformNames = { zoom: 'Zoom', google_meet: 'Google Meet', teams: 'Microsoft Teams', other: 'Online' };
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
      <div style="background: #1a6b3c; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="color: white; margin: 0;">Hormuud University</h2>
        <p style="color: #a8e6c3; margin: 5px 0 0;">National Training Week</p>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
        <h3 style="color: #1a6b3c;">Training Invitation</h3>
        <p>You are invited to participate in:</p>
        <div style="background: #f0f9f4; border-left: 4px solid #1a6b3c; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 8px; color: #1a6b3c;">${trainingTitle}</h4>
          <p style="margin: 4px 0; color: #555;">${eventName}</p>
          ${startTime ? `<p style="margin: 4px 0; color: #555;"><strong>Date & Time:</strong> ${new Date(startTime).toLocaleString()}</p>` : ''}
          <p style="margin: 4px 0; color: #555;"><strong>Platform:</strong> ${platformNames[platform] || platform}</p>
        </div>
        ${meetingUrl ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${meetingUrl}" style="background: #1a6b3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Meeting</a>
        </div>` : ''}
        ${meetingId ? `<p style="color: #555;"><strong>Meeting ID:</strong> ${meetingId}</p>` : ''}
        ${passcode ? `<p style="color: #555;"><strong>Passcode:</strong> ${passcode}</p>` : ''}
        ${notes ? `<div style="background: #fff8e1; padding: 12px; border-radius: 4px; margin: 15px 0;"><p style="margin: 0; color: #555;"><strong>Notes:</strong> ${notes}</p></div>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px; text-align: center;">Hormuud University National Training Week | Mogadishu, Somalia</p>
      </div>
    </div>`;
  return sendEmail({ to, subject: `Invitation: ${trainingTitle} — HU National Training Week`, html });
};

export const sendReminderEmail = async ({ to, trainingTitle, startTime, meetingUrl, type = 'reminder' }) => {
  const typeLabels = { reminder: 'Reminder', schedule_change: 'Schedule Change', cancellation: 'Cancellation Notice' };
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
      <div style="background: #1a6b3c; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="color: white; margin: 0;">Hormuud University</h2>
        <p style="color: #a8e6c3; margin: 5px 0 0;">National Training Week — ${typeLabels[type] || 'Notice'}</p>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
        <h3 style="color: #1a6b3c;">${typeLabels[type] || 'Notice'}: ${trainingTitle}</h3>
        ${startTime ? `<p>This is a reminder that the training is scheduled for <strong>${new Date(startTime).toLocaleString()}</strong>.</p>` : ''}
        ${meetingUrl ? `<div style="text-align: center; margin: 20px 0;"><a href="${meetingUrl}" style="background: #1a6b3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Meeting</a></div>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px; text-align: center;">Hormuud University National Training Week</p>
      </div>
    </div>`;
  return sendEmail({ to, subject: `${typeLabels[type]}: ${trainingTitle} — HU National Training Week`, html });
};
