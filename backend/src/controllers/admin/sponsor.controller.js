import Sponsor from '../../models/Sponsor.js';
import { deleteFile } from '../../middleware/upload.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const booleanValue = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return value === true || value === 'true';
};

const sponsorData = (req, existing = null) => ({
  event: req.body.event,
  name: req.body.name,
  websiteUrl: req.body.websiteUrl || '',
  description: req.body.description || '',
  category: req.body.category || 'Supporting Partner',
  displayOrder: Number(req.body.displayOrder || 0),
  isActive: booleanValue(req.body.isActive, existing?.isActive ?? true),
  isFeatured: booleanValue(req.body.isFeatured, existing?.isFeatured ?? false),
});

export const getSponsors = async (req, res, next) => {
  try {
    const filter = req.query.event ? { event: req.query.event } : {};
    const sponsors = await Sponsor.find(filter)
      .populate('event', 'name year')
      .populate('createdBy', 'fullName')
      .sort({ displayOrder: 1, isFeatured: -1, name: 1 })
      .limit(500);
    return successResponse(res, { sponsors });
  } catch (err) { next(err); }
};

export const createSponsor = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'Sponsor logo is required.', 400);
    const sponsor = await Sponsor.create({
      ...sponsorData(req),
      logo: `uploads/sponsorLogo/${req.file.filename}`,
      createdBy: req.user._id,
    });
    return successResponse(res, { sponsor }, 'Sponsor added successfully.', 201);
  } catch (err) {
    if (req.file) deleteFile(req.file.path);
    next(err);
  }
};

export const updateSponsor = async (req, res, next) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    if (!sponsor) {
      if (req.file) deleteFile(req.file.path);
      return errorResponse(res, 'Sponsor not found.', 404);
    }
    const oldLogo = sponsor.logo;
    Object.assign(sponsor, sponsorData(req, sponsor));
    if (req.file) sponsor.logo = `uploads/sponsorLogo/${req.file.filename}`;
    await sponsor.save();
    if (req.file && oldLogo) deleteFile(oldLogo);
    return successResponse(res, { sponsor }, 'Sponsor updated successfully.');
  } catch (err) {
    if (req.file) deleteFile(req.file.path);
    next(err);
  }
};

export const toggleSponsorStatus = async (req, res, next) => {
  try {
    const sponsor = await Sponsor.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true, runValidators: true },
    );
    if (!sponsor) return errorResponse(res, 'Sponsor not found.', 404);
    return successResponse(res, { sponsor }, `Sponsor ${sponsor.isActive ? 'published' : 'hidden'}.`);
  } catch (err) { next(err); }
};

export const deleteSponsor = async (req, res, next) => {
  try {
    const sponsor = await Sponsor.findByIdAndDelete(req.params.id);
    if (!sponsor) return errorResponse(res, 'Sponsor not found.', 404);
    if (sponsor.logo) deleteFile(sponsor.logo);
    return successResponse(res, null, 'Sponsor deleted successfully.');
  } catch (err) { next(err); }
};

export const getPublicSponsors = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.event) filter.event = req.query.event;
    const sponsors = await Sponsor.find(filter)
      .select('name logo websiteUrl description category displayOrder isFeatured event')
      .sort({ displayOrder: 1, isFeatured: -1, name: 1 })
      .limit(500);
    return successResponse(res, { sponsors });
  } catch (err) { next(err); }
};
