// Validation utility functions
// Extracted from controllers to be independently testable

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  if (!email) return false;
  return EMAIL_REGEX.test(email);
}

function isValidPassword(password) {
  if (!password) return false;
  return password.length >= 8;
}

function isValidMoodRating(rating) {
  if (typeof rating !== 'number') return false;
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

module.exports = { isValidEmail, isValidPassword, isValidMoodRating };
