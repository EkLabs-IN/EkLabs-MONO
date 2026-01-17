/**
 * OTPVerification Component
 * 
 * Provides email verification interface using 6-digit OTP.
 * Features:
 * - 6-digit OTP input with auto-focus and auto-advance
 * - Resend OTP functionality with cooldown timer
 * - Loading states during verification
 * - Error handling and display
 * - Clean, user-friendly interface
 */

import { useState, useRef, useEffect } from 'react';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface OTPVerificationProps {
  /**
   * Email address where OTP was sent
   */
  email: string;
  
  /**
   * Callback function called when OTP is verified successfully
   */
  onVerify: (otp: string) => Promise<void>;
  
  /**
   * Callback to resend OTP
   */
  onResendOTP: () => Promise<void>;
  
  /**
   * Optional callback to go back to sign-up form
   */
  onBack?: () => void;
}

export function OTPVerification({ email, onVerify, onResendOTP, onBack }: OTPVerificationProps) {
  // OTP state
  const [otp, setOtp] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  /**
   * Timer for resend OTP cooldown
   */
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  /**
   * Handles OTP change and auto-submit when complete
   */
  const handleOTPChange = async (value: string) => {
    setOtp(value);
    setError('');

    // Auto-submit when OTP is complete (6 digits)
    if (value.length === 6) {
      await handleVerify(value);
    }
  };

  /**
   * Handles OTP verification
   */
  const handleVerify = async (otpValue: string = otp) => {
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onVerify(otpValue);
      setSuccess(true);
    } catch (err) {
      // Handle verification errors
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP. Please try again.');
      setOtp(''); // Clear OTP on error
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles resending OTP with cooldown
   */
  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setIsLoading(true);

    try {
      await onResendOTP();
      setResendCooldown(60); // 60 second cooldown
      setOtp(''); // Clear current OTP
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Back Button */}
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-2"
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Verify Your Email</h2>
        <p className="text-muted-foreground">
          We've sent a 6-digit verification code to<br />
          <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Email verified successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* OTP Input Section */}
      {!success && (
        <div className="space-y-6">
          {/* OTP Input */}
          <div className="flex flex-col items-center space-y-4">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={handleOTPChange}
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

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Verifying...</span>
              </div>
            )}
          </div>

          {/* Manual Verify Button (in case auto-submit doesn't work) */}
          <Button
            onClick={() => handleVerify()}
            className="w-full"
            disabled={isLoading || otp.length !== 6}
          >
            Verify Email
          </Button>

          {/* Resend OTP Section */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            {resendCooldown > 0 ? (
              <p className="text-sm font-medium text-muted-foreground">
                Resend available in {resendCooldown}s
              </p>
            ) : (
              <Button
                variant="link"
                onClick={handleResend}
                disabled={isLoading}
                className="text-primary font-semibold"
              >
                Resend Code
              </Button>
            )}
          </div>

          {/* Helper Text */}
          <div className="text-xs text-muted-foreground text-center p-3 bg-muted/50 rounded-lg space-y-2">
            <p>
              📧 <strong>Check your email inbox</strong> for the 6-digit verification code.
            </p>
            <p>
              The email should arrive within a few minutes. Don't forget to check your spam folder if you don't see it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
