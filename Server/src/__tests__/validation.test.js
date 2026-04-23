const { isValidEmail, isValidPassword, isValidMoodRating } = require('../utils/validation');

// ---------------------------------------------------------------------------
// isValidEmail
// ---------------------------------------------------------------------------
describe('isValidEmail', () => {
  test('accepts a valid email address', () => {
    expect(isValidEmail('student@cardiffmet.ac.uk')).toBe(true);
  });

  test('accepts a standard email address', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  test('rejects an email missing the @ symbol', () => {
    expect(isValidEmail('studentcardiffmet.ac.uk')).toBe(false);
  });

  test('rejects an email with no domain after @', () => {
    expect(isValidEmail('student@')).toBe(false);
  });

  test('rejects an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  test('rejects null input', () => {
    expect(isValidEmail(null)).toBe(false);
  });

  test('rejects an email with spaces', () => {
    expect(isValidEmail('stu dent@cardiffmet.ac.uk')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidPassword
// ---------------------------------------------------------------------------
describe('isValidPassword', () => {
  test('accepts a password of exactly 8 characters with a letter and digit', () => {
    expect(isValidPassword('passw0rd')).toBe(true);
  });

  test('accepts a password longer than 8 characters', () => {
    expect(isValidPassword('supersecurepassword123')).toBe(true);
  });

  test('rejects a password shorter than 8 characters', () => {
    expect(isValidPassword('short')).toBe(false);
  });

  test('rejects an empty string', () => {
    expect(isValidPassword('')).toBe(false);
  });

  test('rejects null input', () => {
    expect(isValidPassword(null)).toBe(false);
  });

  test('rejects a password of 7 characters', () => {
    expect(isValidPassword('1234567')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidMoodRating
// ---------------------------------------------------------------------------
describe('isValidMoodRating', () => {
  test('accepts rating of 1 (minimum)', () => {
    expect(isValidMoodRating(1)).toBe(true);
  });

  test('accepts rating of 5 (maximum)', () => {
    expect(isValidMoodRating(5)).toBe(true);
  });

  test('accepts rating of 3 (middle)', () => {
    expect(isValidMoodRating(3)).toBe(true);
  });

  test('rejects rating of 0 (below minimum)', () => {
    expect(isValidMoodRating(0)).toBe(false);
  });

  test('rejects rating of 6 (above maximum)', () => {
    expect(isValidMoodRating(6)).toBe(false);
  });

  test('rejects a string input', () => {
    expect(isValidMoodRating('three')).toBe(false);
  });

  test('rejects a decimal number', () => {
    expect(isValidMoodRating(2.5)).toBe(false);
  });

  test('rejects null input', () => {
    expect(isValidMoodRating(null)).toBe(false);
  });
});
