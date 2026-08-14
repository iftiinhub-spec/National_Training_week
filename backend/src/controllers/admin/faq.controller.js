import FAQ from '../../models/FAQ.js';
import { errorResponse, successResponse } from '../../utils/apiResponse.js';

const faqPayload = (body) => ({
  question: body.question,
  answer: body.answer,
  category: body.category || 'General',
  displayOrder: body.displayOrder ?? 0,
  isPublished: body.isPublished ?? true,
});

export const getFAQs = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status === 'published') filter.isPublished = true;
    if (req.query.status === 'draft') filter.isPublished = false;
    if (req.query.category) filter.category = req.query.category;
    const faqs = await FAQ.find(filter).sort({ displayOrder: 1, createdAt: 1 });
    return successResponse(res, { faqs });
  } catch (error) { next(error); }
};

export const getPublicFAQs = async (req, res, next) => {
  try {
    const faqs = await FAQ.find({ isPublished: true }).sort({ displayOrder: 1, createdAt: 1 });
    return successResponse(res, { faqs });
  } catch (error) { next(error); }
};

export const createFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.create(faqPayload(req.body));
    return successResponse(res, { faq }, 'FAQ created successfully.', 201);
  } catch (error) { next(error); }
};

export const updateFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return errorResponse(res, 'FAQ not found.', 404);
    Object.assign(faq, faqPayload(req.body));
    await faq.save();
    return successResponse(res, { faq }, 'FAQ updated successfully.');
  } catch (error) { next(error); }
};

export const toggleFAQPublish = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return errorResponse(res, 'FAQ not found.', 404);
    faq.isPublished = req.body.isPublished;
    await faq.save();
    return successResponse(res, { faq }, faq.isPublished ? 'FAQ published.' : 'FAQ moved to draft.');
  } catch (error) { next(error); }
};

export const deleteFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) return errorResponse(res, 'FAQ not found.', 404);
    return successResponse(res, null, 'FAQ deleted successfully.');
  } catch (error) { next(error); }
};
