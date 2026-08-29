import mongoose from 'mongoose';

const trainingMaterialSchema = new mongoose.Schema({
  training: { type: mongoose.Schema.Types.ObjectId, ref: 'Training', required: true, index: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  // A material is either an external link or an uploaded file, never both.
  url: { type: String, trim: true, default: '' },
  file: {
    path: { type: String, default: '' },
    originalName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  description: { type: String, trim: true, maxlength: 500, default: '' },
}, { timestamps: true });

trainingMaterialSchema.pre('validate', function requireLinkOrFile() {
  if (!this.url && !this.file?.path) {
    this.invalidate('url', 'A material needs either a link or an uploaded file.');
  }
});

trainingMaterialSchema.virtual('isFile').get(function isFile() {
  return Boolean(this.file?.path);
});

trainingMaterialSchema.set('toJSON', { virtuals: true });
trainingMaterialSchema.set('toObject', { virtuals: true });

export default mongoose.model('TrainingMaterial', trainingMaterialSchema);
