const permanentMailboxCodes = new Set([550, 551, 552, 553, 554]);

// Only suppress recipient/mailbox failures. Authentication, sender reputation, quota,
// and server configuration errors must never blacklist an otherwise valid recipient.
export const isPermanentRecipientFailure = (error = {}) => {
  const command = String(error.command || '').toUpperCase();
  const response = String(error.response || error.message || '');
  const hasRejectedRecipient = Array.isArray(error.rejected) && error.rejected.length > 0;
  const isRecipientCommand = command.includes('RCPT') || hasRejectedRecipient || error.code === 'EENVELOPE';
  if (!isRecipientCommand) return false;

  const responseCode = Number(error.responseCode);
  if (permanentMailboxCodes.has(responseCode)) return true;
  return /\b5\.[1-7]\.[0-9]{1,3}\b/.test(response);
};
