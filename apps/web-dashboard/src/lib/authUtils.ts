/**
 * Authentication Utility Functions
 * 
 * This module provides helper functions for authentication operations including:
 * - Password validation with security requirements
 * - Email OTP generation and verification
 * - Email format validation
 * - Password strength checking
 */

/**
 * Validates email format using regex pattern
 * @param email - Email string to validate
 * @returns boolean indicating if email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param password - Password string to validate
 * @returns Object with isValid boolean and error message
 */
export function validatePassword(password: string): { 
  isValid: boolean; 
  message: string 
} {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  return { isValid: true, message: 'Password is strong' };
}

/**
 * Generates a random 6-digit OTP code
 * @returns string containing 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Simulates sending an OTP via email
 * In production, this would call a backend API to send actual email
 * 
 * @param email - Email address to send OTP to
 * @param otp - OTP code to send
 * @returns Promise that resolves to boolean indicating success
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In production, this would be an actual API call
  // For demo purposes, we log the OTP to console
  console.log(`📧 OTP sent to ${email}: ${otp}`);
  console.log('⚠️  In production, this would be sent via email service');
  
  return true;
}

/**
 * Verifies if the provided OTP matches the stored OTP
 * 
 * @param providedOTP - OTP entered by user
 * @param storedOTP - OTP that was sent to user
 * @returns boolean indicating if OTPs match
 */
export function verifyOTP(providedOTP: string, storedOTP: string): boolean {
  return providedOTP === storedOTP;
}

/**
 * Hashes password (simplified for demo)
 * In production, use bcrypt or similar on backend
 * 
 * @param password - Plain text password
 * @returns string containing hashed password
 */
export function hashPassword(password: string): string {
  // This is a VERY simplified hash for demo purposes only
  // In production, NEVER hash passwords on frontend
  // Always use proper backend hashing with bcrypt, argon2, etc.
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Validates phone number format (optional field)
 * Accepts formats: (123) 456-7890, 123-456-7890, 1234567890, +1234567890
 * 
 * @param phone - Phone number string to validate
 * @returns boolean indicating if phone number is valid or empty
 */
export function validatePhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return true; // Optional field
  const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}
