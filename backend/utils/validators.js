/**
 * Shared validation utilities for FreshCart
 */

// Sri Lankan phone number validation
// Accepts: +94771234567, 0771234567, 771234567
const SL_PHONE_REGEX = /^(?:\+94|0)?[0-9]{9}$/;

const isValidSLPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return SL_PHONE_REGEX.test(cleaned);
};

// Format phone to standard +94 format
const formatSLPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+94')) return cleaned;
  if (cleaned.startsWith('0')) return '+94' + cleaned.slice(1);
  if (cleaned.length === 9) return '+94' + cleaned;
  return cleaned;
};

// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email) => {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
};

// Generic validators
const isNonEmptyString = (val) => typeof val === 'string' && val.trim().length > 0;

const isPositiveNumber = (val) => typeof val === 'number' && val > 0;

module.exports = {
  isValidSLPhone,
  formatSLPhone,
  isValidEmail,
  isNonEmptyString,
  isPositiveNumber,
  SL_PHONE_REGEX,
  EMAIL_REGEX,
};
