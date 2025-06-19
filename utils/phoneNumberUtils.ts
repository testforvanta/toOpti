/**
 * Sanitizes a phone number for use with WhatsApp wa.me links.
 * - Removes all non-digit characters except for a leading '+'.
 * - If the number starts with '00', it replaces '00' with '+'.
 * - If a '+' is present, it ensures it's at the beginning.
 * 
 * @param phoneNumber The phone number string to sanitize.
 * @returns A sanitized phone number string.
 */
export const sanitizePhoneNumberForWhatsApp = (phoneNumber: string): string => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return '';
  }

  let sanitized = phoneNumber.trim();

  // Replace '00' at the beginning with '+'
  if (sanitized.startsWith('00')) {
    sanitized = '+' + sanitized.substring(2);
  }

  // Keep only digits and the plus sign
  sanitized = sanitized.replace(/[^\d+]/g, '');

  // If there's a plus sign, ensure it's only at the beginning
  if (sanitized.includes('+')) {
    // Remove all plus signs
    const digitsOnly = sanitized.replace(/\+/g, '');
    // Add plus sign back at the start if it was originally intended
    if (phoneNumber.trim().includes('+')) { // Check original for intent
        sanitized = '+' + digitsOnly;
    } else {
        sanitized = digitsOnly; // If no plus in original, assume it was from '00' or an error
    }
  }
  
  // Final check: if '+' exists, it must be the first character.
  // If multiple '+' were present, previous steps might lead to e.g., "123+456" -> "123456"
  // or "+123+456" -> "+123456".
  // This scenario is mostly covered, but a direct cleanup if a '+' is not at the start:
  if (sanitized.lastIndexOf('+') > 0) {
      sanitized = sanitized.replace(/\+/g, ''); // Remove all '+'
      if (phoneNumber.trim().startsWith('+') || phoneNumber.trim().startsWith('00')) {
          sanitized = '+' + sanitized; // Add it back only if original indicated international
      }
  }

  return sanitized;
};