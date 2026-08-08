import ContactMessage from '../../models/ContactMessage.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';

// POST /api/public/contact
export const createContactMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    const msg = await ContactMessage.create({ name, email, subject, message });
    return successResponse(res, { message: msg }, 'Message sent successfully. We will get back to you soon.', 201);
  } catch (err) { next(err); }
};

// GET /api/admin/contact-messages
export const getContactMessages = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';

    const [messages, total] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ContactMessage.countDocuments(filter),
    ]);
    return paginatedResponse(res, messages, total, page, limit);
  } catch (err) { next(err); }
};

// PATCH /api/admin/contact-messages/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!msg) return errorResponse(res, 'Message not found.', 404);
    return successResponse(res, { message: msg }, 'Marked as read.');
  } catch (err) { next(err); }
};

// DELETE /api/admin/contact-messages/:id
export const deleteContactMessage = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) return errorResponse(res, 'Message not found.', 404);
    return successResponse(res, null, 'Message deleted.');
  } catch (err) { next(err); }
};
