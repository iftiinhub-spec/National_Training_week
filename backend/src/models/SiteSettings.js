import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true, immutable: true },
  organizerName: { type: String, trim: true, default: 'National Training Week' },
  contactEmail: { type: String, trim: true, lowercase: true, default: 'ntw@trainingweek.so' },
  replyToEmail: { type: String, trim: true, lowercase: true, default: 'ntw@trainingweek.so' },
  location: { type: String, trim: true, default: 'Mogadishu, Somalia' },
  facebookUrl: { type: String, trim: true, default: '' },
  emailSenderName: { type: String, trim: true, default: 'National Training Week' },
  smtpUser: { type: String, trim: true, lowercase: true, default: '' },
  smtpPassEncrypted: { type: String, select: false, default: '' },
}, { timestamps: true });

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
export default SiteSettings;
