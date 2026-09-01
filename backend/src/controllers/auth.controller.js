import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { emailButton, emailLayout, sendEmail } from '../utils/email.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { sendWelcomeEmail } from '../utils/welcomeEmail.js';
import Trainer from '../models/Trainer.js';

const signToken = (id, tokenVersion) =>
  jwt.sign({ id, tv: tokenVersion }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register — Participant self-registration only
export const register = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, gender, country, region, city, organization, profession, participantType } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return errorResponse(res, 'An account with this email already exists.', 409);
    }

    const user = await User.create({
      fullName, email, passwordHash: password,
      role: 'participant', accountStatus: 'approved',
      phone, gender, country, region: country === 'SO' ? region : '', city: country === 'SO' ? '' : city, organization, profession, participantType,
    });

    await sendWelcomeEmail({ to: user.email, participantName: user.fullName });
    return successResponse(res, { user }, 'Account created successfully. You can sign in now.', 201);
  } catch (err) { next(err); }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }
    if (user.role === 'trainer') {
      const trainer = await Trainer.findById(user.trainerProfile).select('accessStatus');
      if (!trainer || trainer.accessStatus !== 'approved') {
        const label = trainer?.accessStatus || 'pending';
        return errorResponse(res, `Trainer portal access is ${label}.`, 403);
      }
    }
    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated. Please contact support.', 401);
    }
    const token = signToken(user._id, user.tokenVersion);
    const userData = user.toJSON();
    return successResponse(res, { user: userData, token }, 'Login successful.');
  } catch (err) { next(err); }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    return successResponse(res, { user: req.user });
  } catch (err) { next(err); }
};

// PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['fullName', 'phone', 'gender', 'country', 'region', 'city', 'organization', 'profession', 'participantType'];
    const updates = {};
    allowed.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    if (updates.country === 'SO') updates.city = '';
    else if (updates.country) updates.region = '';

    if (req.file) {
      updates.profilePhoto = `uploads/profilePhoto/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    return successResponse(res, { user }, 'Profile updated successfully.');
  } catch (err) { next(err); }
};

// PUT /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await user.comparePassword(currentPassword))) {
      return errorResponse(res, 'Current password is incorrect.', 400);
    }
    user.passwordHash = newPassword;
    user.tokenVersion += 1;
    await user.save();
    return successResponse(res, null, 'Password changed successfully.');
  } catch (err) { next(err); }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) {
      return successResponse(res, null, 'If an account exists, a reset link has been sent.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      category: 'password_reset',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      subject: 'Reset your National Training Week password',
      html: emailLayout({ eyebrow: 'Account security', title: 'Reset your password', preview: 'Your password reset link is valid for one hour', body: `<p style="margin-top:0">Hello ${user.fullName || 'Participant'},</p><p>We received a request to reset your password. This secure link expires in one hour.</p>${emailButton('Reset password', resetUrl)}<p>If you did not request this change, you can safely ignore this email. Your password will remain unchanged.</p>` }),
    });

    return successResponse(res, null, 'If an account exists, a reset link has been sent.');
  } catch (err) { next(err); }
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, 'Password reset token is invalid or has expired.', 400);
    }

    user.passwordHash = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.tokenVersion += 1;
    await user.save();

    const jwtToken = signToken(user._id, user.tokenVersion);
    return successResponse(res, { token: jwtToken }, 'Password reset successful.');
  } catch (err) { next(err); }
};
