import Meeting from '../../models/Meeting.js';
import Training from '../../models/Training.js';
import Communication from '../../models/Communication.js';
import Registration from '../../models/Registration.js';
import Trainer from '../../models/Trainer.js';
import { sendInvitationEmail, sendReminderEmail } from '../../utils/email.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const checkModeratorAccess = async (trainingId, userId, role) => {
  if (role === 'admin') return true;
  const training = await Training.findById(trainingId);
  return training && String(training.moderator) === String(userId);
};

// GET /api/admin/trainings/:trainingId/meeting  OR  /api/moderator/trainings/:trainingId/meeting
export const getMeeting = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const hasAccess = await checkModeratorAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied to this training.', 403);

    const meeting = await Meeting.findOne({ training: trainingId }).populate('createdBy', 'fullName');
    // Not having configured a meeting yet is a normal session state.
    if (!meeting) return successResponse(res, { meeting: null });
    return successResponse(res, { meeting });
  } catch (err) { next(err); }
};

// POST /api/admin/trainings/:trainingId/meeting
export const createMeeting = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const hasAccess = await checkModeratorAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied to this training.', 403);

    const existing = await Meeting.findOne({ training: trainingId });
    if (existing) return errorResponse(res, 'A meeting already exists. Use PUT to update it.', 409);

    const meeting = await Meeting.create({ ...req.body, training: trainingId, createdBy: req.user._id });
    return successResponse(res, { meeting }, 'Meeting created successfully.', 201);
  } catch (err) { next(err); }
};

// PUT /api/admin/trainings/:trainingId/meeting
export const updateMeeting = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const hasAccess = await checkModeratorAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied to this training.', 403);

    const meeting = await Meeting.findOneAndUpdate(
      { training: trainingId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!meeting) return errorResponse(res, 'Meeting not found.', 404);
    return successResponse(res, { meeting }, 'Meeting updated successfully.');
  } catch (err) { next(err); }
};

// DELETE /api/admin/trainings/:trainingId/meeting
export const deleteMeeting = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const hasAccess = await checkModeratorAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied to this training.', 403);

    const meeting = await Meeting.findOneAndDelete({ training: trainingId });
    if (!meeting) return errorResponse(res, 'Meeting not found.', 404);
    return successResponse(res, null, 'Meeting removed successfully.');
  } catch (err) { next(err); }
};

// PATCH /api/.../trainings/:trainingId/meeting/release
export const releaseMeeting = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const hasAccess = await checkModeratorAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied.', 403);

    const meeting = await Meeting.findOneAndUpdate(
      { training: trainingId },
      { isReleased: req.body.isReleased !== false },
      { new: true }
    );
    if (!meeting) return errorResponse(res, 'Meeting not found.', 404);
    return successResponse(res, { meeting }, `Meeting ${meeting.isReleased ? 'released to' : 'hidden from'} participants.`);
  } catch (err) { next(err); }
};

// POST /api/.../trainings/:trainingId/invitations/trainer
export const sendTrainerInvitation = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const hasAccess = await checkModeratorAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied.', 403);

    const training = await Training.findById(trainingId).populate('trainer').populate('event', 'name');
    if (!training) return errorResponse(res, 'Training not found.', 404);
    if (!training.trainer) return errorResponse(res, 'No trainer assigned to this training.', 400);
    if (!training.trainer.email) return errorResponse(res, 'Trainer has no email address.', 400);

    const meeting = await Meeting.findOne({ training: trainingId });
    if (!meeting) return errorResponse(res, 'Please create meeting details before sending invitation.', 400);

    const result = await sendInvitationEmail({
      to: training.trainer.email,
      trainingTitle: training.title,
      eventName: training.event?.name || 'National Training Week',
      meetingUrl: meeting.meetingUrl,
      meetingId: meeting.meetingId,
      passcode: meeting.passcode,
      startTime: meeting.startTime || training.date,
      platform: meeting.platform,
      notes: meeting.notes,
    });

    await Communication.create({
      training: trainingId,
      type: 'invitation',
      recipientType: 'trainer',
      recipients: [training.trainer.email],
      subject: `Invitation: ${training.title}`,
      body: `Meeting invitation sent to trainer ${training.trainer.name}`,
      sentBy: req.user._id,
      deliveryStatus: result.success ? 'sent' : 'failed',
    });

    if (!result.success) return errorResponse(res, `Trainer invitation could not be sent: ${result.error}`, 502);
    return successResponse(res, null, 'Trainer invitation sent.');
  } catch (err) { next(err); }
};

// POST /api/.../trainings/:trainingId/invitations/participants
export const sendParticipantInvitations = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const { type = 'invitation', selectedIds } = req.body;
    const hasAccess = await checkModeratorAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied.', 403);

    const training = await Training.findById(trainingId).populate('event', 'name');
    if (!training) return errorResponse(res, 'Training not found.', 404);

    const meeting = await Meeting.findOne({ training: trainingId });

    let regFilter = { training: trainingId, status: 'approved' };
    if (selectedIds && selectedIds.length > 0) regFilter.participant = { $in: selectedIds };

    const registrations = await Registration.find(regFilter).populate('participant', 'fullName email');
    if (registrations.length === 0) return errorResponse(res, 'No approved participants found.', 400);

    const emails = registrations.map((r) => r.participant.email).filter(Boolean);
    const failed = [];

    for (const email of emails) {
      let result;
      if (type === 'invitation' && meeting) {
        result = await sendInvitationEmail({
          to: email,
          trainingTitle: training.title,
          eventName: training.event?.name || 'National Training Week',
          meetingUrl: meeting.meetingUrl,
          meetingId: meeting.meetingId,
          passcode: meeting.passcode,
          startTime: meeting.startTime || training.date,
          platform: meeting.platform,
          notes: meeting.notes,
        });
      } else {
        result = await sendReminderEmail({
          to: email,
          trainingTitle: training.title,
          startTime: meeting?.startTime || training.date,
          meetingUrl: meeting?.meetingUrl,
          type,
        });
      }
      if (!result.success) failed.push(email);
    }

    await Communication.create({
      training: trainingId,
      type,
      recipientType: selectedIds?.length > 0 ? 'selected' : 'all_approved',
      recipients: emails,
      subject: `${type === 'invitation' ? 'Invitation' : 'Reminder'}: ${training.title}`,
      body: `Sent to ${emails.length} participants`,
      sentBy: req.user._id,
      deliveryStatus: failed.length === 0 ? 'sent' : failed.length === emails.length ? 'failed' : 'partial',
      failedRecipients: failed,
    });

    if (failed.length === emails.length) {
      return errorResponse(res, 'Participant invitations could not be delivered. Check the SMTP configuration.', 502);
    }
    return successResponse(res, { total: emails.length, failed: failed.length },
      `Sent to ${emails.length - failed.length} of ${emails.length} participants.`);
  } catch (err) { next(err); }
};

// GET /api/.../trainings/:trainingId/communications
export const getCommunications = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const hasAccess = await checkModeratorAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied.', 403);

    const comms = await Communication.find({ training: trainingId })
      .populate('sentBy', 'fullName role')
      .sort({ sentAt: -1 });
    return successResponse(res, { communications: comms });
  } catch (err) { next(err); }
};
