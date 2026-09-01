import Meeting from '../../models/Meeting.js';
import Training from '../../models/Training.js';
import Communication from '../../models/Communication.js';
import Registration from '../../models/Registration.js';
import Trainer from '../../models/Trainer.js';
import { sendInvitationEmail, sendReminderEmail } from '../../utils/email.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { getTrainingDateTime } from '../../utils/trainingDateTime.js';

const checkModeratorAccess = async (trainingId, userId, role) => {
  if (role === 'admin') return true;
  const training = await Training.findById(trainingId);
  return training && String(training.moderator) === String(userId);
};

const meetingPayload = (input) => Object.fromEntries(
  ['platform', 'meetingUrl', 'meetingId', 'passcode', 'startTime', 'endTime', 'notes']
    .filter((field) => input[field] !== undefined)
    .map((field) => [field, input[field]])
);

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

    const meeting = await Meeting.create({ ...meetingPayload(req.body), training: trainingId, createdBy: req.user._id, isReleased: true });
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
      { ...meetingPayload(req.body), isReleased: true },
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

    const training = await Training.findById(trainingId).populate('trainer').populate('trainers').populate('event', 'name');
    if (!training) return errorResponse(res, 'Training not found.', 404);
    const trainerInviteStartsAt = getTrainingDateTime(training.date, training.startTime);
    const trainerInviteEndsAt = getTrainingDateTime(training.date, training.endTime);
    if (trainerInviteStartsAt && new Date() < new Date(trainerInviteStartsAt.getTime() - 30 * 60 * 1000)) {
      return errorResponse(res, 'Trainer invitations can be sent starting 30 minutes before the session.', 400);
    }
    if (trainerInviteEndsAt && trainerInviteEndsAt <= new Date()) {
      return errorResponse(res, 'This session has already ended. Invitations can no longer be sent.', 400);
    }
    const trainers = [...new Map([...(training.trainers || []), ...(training.trainer ? [training.trainer] : [])].map((trainer) => [String(trainer._id), trainer])).values()];
    if (!trainers.length) return errorResponse(res, 'No trainers are assigned to this training.', 400);
    const trainersWithEmail = trainers.filter((trainer) => trainer.email);
    if (!trainersWithEmail.length) return errorResponse(res, 'The assigned trainers have no email addresses.', 400);

    const meeting = await Meeting.findOne({ training: trainingId });
    if (!meeting) return errorResponse(res, 'Please create meeting details before sending invitation.', 400);

    const results = await Promise.all(trainersWithEmail.map((trainer) => sendInvitationEmail({
      to: trainer.email,
      trainingTitle: training.title,
      eventName: training.event?.name || 'National Training Week',
      meetingUrl: meeting.meetingUrl,
      meetingId: meeting.meetingId,
      passcode: meeting.passcode,
      startTime: meeting.startTime || training.date,
      platform: meeting.platform,
      notes: meeting.notes,
    })));
    const failedEmails = trainersWithEmail.filter((_, index) => !results[index].success).map((trainer) => trainer.email);
    const recipients = trainersWithEmail.map((trainer) => trainer.email);

    await Communication.create({
      training: trainingId,
      type: 'invitation',
      recipientType: 'trainer',
      recipients,
      subject: `Invitation: ${training.title}`,
      body: `Meeting invitation queued for ${recipients.length} assigned trainer${recipients.length === 1 ? '' : 's'}.`,
      sentBy: req.user._id,
      deliveryStatus: failedEmails.length === recipients.length ? 'failed' : failedEmails.length ? 'partial' : 'queued',
      failedRecipients: failedEmails,
    });

    if (failedEmails.length === recipients.length) return errorResponse(res, 'Trainer invitations could not be sent.', 502);
    return successResponse(res, { queued: recipients.length - failedEmails.length, failed: failedEmails.length }, `Trainer invitation${recipients.length === 1 ? '' : 's'} queued.`);
  } catch (err) { next(err); }
};

// POST /api/.../trainings/:trainingId/invitations/participants
export const sendParticipantInvitations = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const { type = 'invitation', selectedIds } = req.body;
    if (type === 'reminder') return errorResponse(res, 'Session reminders are sent automatically 24 hours and 1 hour before the session.', 400);
    const hasAccess = await checkModeratorAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied.', 403);

    const training = await Training.findById(trainingId).populate('event', 'name');
    if (!training) return errorResponse(res, 'Training not found.', 404);
    const participantInviteStartsAt = getTrainingDateTime(training.date, training.startTime);
    const participantInviteEndsAt = getTrainingDateTime(training.date, training.endTime);
    if (participantInviteStartsAt && new Date() < new Date(participantInviteStartsAt.getTime() - 30 * 60 * 1000)) {
      return errorResponse(res, 'Participant invitations can be sent starting 30 minutes before the session.', 400);
    }
    if (participantInviteEndsAt && participantInviteEndsAt <= new Date()) {
      return errorResponse(res, 'This session has already ended. Invitations can no longer be sent.', 400);
    }

    const meeting = await Meeting.findOne({ training: trainingId });
    if (type === 'invitation' && !meeting) return errorResponse(res, 'Create the meeting details before sending invitations.', 400);

    let regFilter = { training: trainingId, status: 'approved' };
    if (selectedIds && selectedIds.length > 0) regFilter.participant = { $in: selectedIds };

    const registrations = await Registration.find(regFilter).populate('participant', 'fullName email');
    if (registrations.length === 0) return errorResponse(res, 'No approved participants found.', 400);

    const emails = registrations.map((r) => r.participant.email).filter(Boolean);
    const scheduledStart = getTrainingDateTime(training.date, training.startTime);
    if (!scheduledStart) {
      return errorResponse(res, 'The training date or start time is invalid. Please update the training schedule.', 400);
    }

    // Send in the background so a large participant list can't time out this request.
    // Progress/result is recorded on the Communication log, which the frontend already polls.
    (async () => {
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
            startTime: scheduledStart,
            platform: meeting.platform,
            notes: meeting.notes,
          });
        } else {
          result = await sendReminderEmail({
            to: email,
            trainingTitle: training.title,
            startTime: scheduledStart,
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
        body: `Queued for ${emails.length} participants`,
        sentBy: req.user._id,
        deliveryStatus: failed.length === 0 ? 'queued' : failed.length === emails.length ? 'failed' : 'partial',
        failedRecipients: failed,
      });
    })().catch((error) => console.error('Bulk invitation send failed:', error.message));

    return successResponse(res, { total: emails.length },
      `Sending to ${emails.length} participant${emails.length === 1 ? '' : 's'}. Check Communications for delivery status.`);
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
      .sort({ sentAt: -1 })
      .limit(500);
    return successResponse(res, { communications: comms });
  } catch (err) { next(err); }
};
