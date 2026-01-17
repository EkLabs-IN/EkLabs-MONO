/**
 * ForgetPassword Component
 * 
 * Provides password reset functionality through email-based OTP verification.
 * Features:
 * - Email input for password reset request
 * - OTP verification step
 * - New password creation with confirmation
 * - Password strength validation
 * - Error handling and loading states
 * 
 * Flow:
 * 1. User enters email address
 * 2. OTP sent to email (if user exists)
 * 3. User enters OTP code
 * 4. User creates new password
 * 5. Password updated and user can sign in
 */

import { useState } from 'react';
import { Mail, Lock, AlertCircle, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateEmail, validatePassword } from '@/lib/authUtils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface ForgetPasswordProps {
  /**
   * Callback to return to sign-in form
   */
  onBack: () => void;
  
  /**
   * Callback when password reset is successful
   */
  onSuccess: () => void;
}

// Password reset flow steps
type ResetStep = 'email' | 'otp' | 'new-password' | 'success';

export function ForgetPassword({ onBack, onSuccess }: ForgetPasswordProps) {
  // Form state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [currentStep, setCurrentStep] = useState<ResetStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * Step 1: Request password reset OTP
   * Sends OTP to user's email if account exists
   */
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Call API to request password reset
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to send reset code');
      }

      // Move to OTP verification step
      setCurrentStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2: Verify OTP code
   * Validates the OTP sent to user's email
   */
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      // Verify OTP with backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Invalid verification code');
      }

      // Move to new password step
      setCurrentStep('new-password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 3: Set new password
   * Updates user's password after verification
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Reset password with backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to reset password');
      }

      // Show success message
      setCurrentStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend OTP code
   */
  const handleResendOTP = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend code');
      }

      setError(''); // Clear any errors
      // Could show a success toast here
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render based on current step
  return (
    <div className="w-full max-w-md space-y-6">
      {/* Step 1: Email Input */}
      {currentStep === 'email' && (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Forgot Password</h2>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a verification code
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending code...' : 'Send Verification Code'}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </button>
          </div>
        </>
      )}

      {/* Step 2: OTP Verification */}
      {currentStep === 'otp' && (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Verify Code</h2>
            <p className="text-muted-foreground">
              Enter the 6-digit code sent to {email}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-primary font-semibold hover:underline"
                disabled={isLoading}
              >
                Resend
              </button>
            </p>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </button>
          </div>
        </>
      )}

      {/* Step 3: New Password */}
      {currentStep === 'new-password' && (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Create New Password</h2>
            <p className="text-muted-foreground">
              Choose a strong password for your account
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Resetting password...' : 'Reset Password'}
            </Button>
          </form>
        </>
      )}

      {/* Step 4: Success */}
      {currentStep === 'success' && (
        <>
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Password Reset Successful</h2>
              <p className="text-muted-foreground">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
            </div>
          </div>

          <Button onClick={onSuccess} className="w-full">
            Continue to Sign In
          </Button>
        </>
      )}
    </div>
  );
}
