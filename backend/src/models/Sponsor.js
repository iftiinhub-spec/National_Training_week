import mongoose from 'mongoose';

const sponsorSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event edition is required'],
    },
    name: { type: String, required: [true, 'Co-organizer name is required'], trim: true, maxlength: 120 },
    logo: { type: String, required: [true, 'Co-organizer logo is required'], trim: true },
    websiteUrl: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    category: {
      type: String,
      enum: ['Strategic Co-Organizer', 'Lead Co-Organizer', 'Co-Organizer', 'Supporting Co-Organizer', 'Media Co-Organizer'],
      default: 'Co-Organizer',
    },
    displayOrder: { type: Number, min: 0, max: 9999, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

sponsorSchema.index({ event: 1, isActive: 1, displayOrder: 1 });
sponsorSchema.index({ event: 1, name: 1 }, { unique: true });

const Sponsor = mongoose.model('Sponsor', sponsorSchema);
export default Sponsor;
