import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true, immutable: true },
  organizerName: { type: String, trim: true, default: 'Hormuud University' },
  contactEmail: { type: String, trim: true, lowercase: true, default: 'info@ntw.hu.edu.so' },
  replyToEmail: { type: String, trim: true, lowercase: true, default: 'info@ntw.hu.edu.so' },
  location: { type: String, trim: true, default: 'Daru Shura Campus, Villa Baidoa, Wadajir, Mogadishu, Somalia' },
  facebookUrl: { type: String, trim: true, default: '' },
  tiktokUrl: { type: String, trim: true, default: '' },
  instagramUrl: { type: String, trim: true, default: '' },
  linkedinUrl: { type: String, trim: true, default: '' },
  xUrl: { type: String, trim: true, default: '' },
  emailSenderName: { type: String, trim: true, default: 'National Training Week' },
  smtpUser: { type: String, trim: true, lowercase: true, default: '' },
  smtpPassEncrypted: { type: String, select: false, default: '' },
  certificateSignature: { type: String, trim: true, default: '' },
  certificateSignatoryName: { type: String, trim: true, default: 'Authorized Signatory' },
  certificateSignatoryTitle: { type: String, trim: true, default: 'National Training Week' },
}, { timestamps: true });

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
export default SiteSettings;
