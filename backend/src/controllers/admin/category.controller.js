import Category from '../../models/Category.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { pick } from '../../utils/pick.js';

const categoryPayload = (input) => pick(input, ['name', 'description', 'isActive']);

export const getCategories = async (req, res, next) => {
  try {
    const filter = req.query.activeOnly === 'true' ? { isActive: true } : {};
    const categories = await Category.find(filter).sort({ name: 1 });
    return successResponse(res, { categories });
  } catch (err) { next(err); }
};

export const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return errorResponse(res, 'Category not found.', 404);
    return successResponse(res, { category });
  } catch (err) { next(err); }
};

export const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(categoryPayload(req.body));
    return successResponse(res, { category }, 'Category created successfully.', 201);
  } catch (err) { next(err); }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, categoryPayload(req.body), { new: true, runValidators: true });
    if (!category) return errorResponse(res, 'Category not found.', 404);
    return successResponse(res, { category }, 'Category updated successfully.');
  } catch (err) { next(err); }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return errorResponse(res, 'Category not found.', 404);
    return successResponse(res, null, 'Category deleted successfully.');
  } catch (err) { next(err); }
};
