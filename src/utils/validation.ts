/**
 * Form Validation Rules for Wabi SACCO
 */

export function isValidEthiopianPhone(phone: string): boolean {
  if (!phone) return false;
  // Supports +2519..., +2517..., 09..., 07...
  const cleaned = phone.replace(/[\s-]/g, '');
  const ethRegex = /^(\+251|0)(9|7)\d{8}$/;
  return ethRegex.test(cleaned);
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function validateNomineeAllocations(percentages: number[]): { isValid: boolean; sum: number; message?: string } {
  const sum = percentages.reduce((acc, p) => acc + (Number(p) || 0), 0);
  const roundedSum = Math.round(sum * 100) / 100;
  if (roundedSum !== 100.0) {
    return {
      isValid: false,
      sum: roundedSum,
      message: `Total percentage allocation must equal exactly 100.00% (Current: ${roundedSum}%)`
    };
  }
  return { isValid: true, sum: roundedSum };
}

export function isAgeEligible(dob: string | Date, minimumAge: number = 18): boolean {
  if (!dob) return false;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= minimumAge;
}
