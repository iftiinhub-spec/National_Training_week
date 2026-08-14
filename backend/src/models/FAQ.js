import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: [true, 'FAQ question is required.'], trim: true, maxlength: [200, 'FAQ question cannot exceed 200 characters.'] },
    questionKey: { type: String, required: true, unique: true, select: false },
    answer: { type: String, required: [true, 'FAQ answer is required.'], trim: true, maxlength: [2000, 'FAQ answer cannot exceed 2000 characters.'] },
    category: {
      type: String,
      enum: ['General', 'Registration', 'Training Sessions', 'Attendance', 'Certificates', 'Trainer Applications', 'Technical Support'],
      default: 'General',
    },
    displayOrder: { type: Number, min: 0, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

faqSchema.pre('validate', function normalizeQuestion() {
  this.questionKey = this.question?.trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ');
  if (!this.category) this.category = 'General';
});

const FAQ = mongoose.model('FAQ', faqSchema);
export default FAQ;
