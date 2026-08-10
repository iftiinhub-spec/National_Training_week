import SiteSettings from '../../models/SiteSettings.js';
import { errorResponse, successResponse } from '../../utils/apiResponse.js';
import { encryptSetting } from '../../utils/settingsEncryption.js';
import { emailLayout, sendEmail } from '../../utils/email.js';

const defaults = {
  key: 'global',
  organizerName: 'National Training Week',
  contactEmail: 'ntw@trainingweek.so',
  replyToEmail: 'ntw@trainingweek.so',
  location: 'Mogadishu, Somalia',
  facebookUrl: '',
  emailSenderName: 'National Training Week',
  smtpUser: '',
  certificateSignature: '',
  certificateSignatoryName: 'Authorized Signatory',
  certificateSignatoryTitle: 'National Training Week',
};

const safeSettings = (settings) => {
  const value = settings.toObject ? settings.toObject() : settings;
  delete value.smtpPassEncrypted;
  return {
    ...value,
    smtpUser: value.smtpUser || process.env.SMTP_USER || '',
    hasSmtpPassword: Boolean(settings.smtpPassEncrypted || process.env.SMTP_PASS),
  };
};

const getOrCreateSettings = () => SiteSettings.findOneAndUpdate(
  { key: 'global' },
  { $setOnInsert: defaults },
  { new: true, upsert: true, setDefaultsOnInsert: true },
);

export const getSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.findOne({ key: 'global' }).select('+smtpPassEncrypted') || await getOrCreateSettings();
    return successResponse(res, { settings: safeSettings(settings) });
  } catch (error) { next(error); }
};

export const updateSettings = async (req, res, next) => {
  try {
    const current = await SiteSettings.findOne({ key: 'global' }).select('+smtpPassEncrypted');
    const currentSender = current?.smtpUser || process.env.SMTP_USER || '';
    if (req.body.smtpUser && req.body.smtpUser !== currentSender && !req.body.smtpPassword) {
      return errorResponse(res, 'Enter an App Password created by the new Gmail sender account.', 400);
    }
    const allowed = ['organizerName', 'contactEmail', 'replyToEmail', 'location', 'facebookUrl', 'emailSenderName', 'smtpUser', 'certificateSignatoryName', 'certificateSignatoryTitle'];
    const updates = Object.fromEntries(allowed.map((field) => [field, req.body[field] ?? '']));
    if (req.body.smtpPassword) updates.smtpPassEncrypted = encryptSetting(req.body.smtpPassword.replaceAll(' ', ''));
    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'global' }, { $set: updates }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    const saved = await SiteSettings.findById(settings._id).select('+smtpPassEncrypted');
    return successResponse(res, { settings: safeSettings(saved) }, 'Website and email settings updated.');
  } catch (error) { next(error); }
};

export const uploadCertificateSignature = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'Select a PNG, JPEG, or WebP signature image.', 400);
    const certificateSignature = `uploads/certificateSignature/${req.file.filename}`;
    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'global' },
      { $set: { certificateSignature } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).select('+smtpPassEncrypted');
    return successResponse(res, { settings: safeSettings(settings) }, 'Certificate signature uploaded successfully.');
  } catch (error) { next(error); }
};

export const removeCertificateSignature = async (req, res, next) => {
  try {
    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'global' }, { $set: { certificateSignature: '' } }, { new: true, upsert: true, setDefaultsOnInsert: true },
    ).select('+smtpPassEncrypted');
    return successResponse(res, { settings: safeSettings(settings) }, 'Certificate signature removed.');
  } catch (error) { next(error); }
};

export const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    const { organizerName, contactEmail, location, facebookUrl } = settings;
    return successResponse(res, { settings: { organizerName, contactEmail, location, facebookUrl } });
  } catch (error) { next(error); }
};

export const sendTestEmail = async (req, res, next) => {
  try {
    const result = await sendEmail({
      to: req.body.email,
      subject: 'National Training Week email delivery test',
      html: emailLayout({
        eyebrow: 'Configuration test',
        title: 'Email delivery is working',
        preview: 'Your National Training Week email settings are working',
        body: '<p style="margin-top:0">This message confirms that the email account configured in Admin Settings can send National Training Week notifications successfully.</p><p>No action is required.</p>',
      }),
    });
    if (!result.success) return errorResponse(res, `Test email failed: ${result.error}`, 502);
    return successResponse(res, null, 'Test email sent successfully.');
  } catch (error) { next(error); }
};
