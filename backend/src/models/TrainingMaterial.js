import mongoose from 'mongoose';

const trainingMaterialSchema = new mongoose.Schema({
  training: { type: mongoose.Schema.Types.ObjectId, ref: 'Training', required: true, index: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  url: { type: String, required: true, trim: true },
  description: { type: String, trim: true, maxlength: 500, default: '' },
}, { timestamps: true });

export default mongoose.model('TrainingMaterial', trainingMaterialSchema);
