/**
 * SignInForm Component
 * 
 * Provides email and password based authentication interface.
 * Features:
 * - Email and password input fields
 * - Password visibility toggle
 * - Client-side validation
 * - Loading states during authentication
 * - Error handling and display
 */

import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateEmail } from '@/lib/authUtils';

interface SignInFormProps {
  /**
   * Callback function called when user submits valid credentials
   * @param email - User's email address
   * @param password - User's password
   */
  onSignIn: (email: string, password: string) => Promise<void>;
  
  /**
   * Callback to switch to sign-up form
   */
  onSwitchToSignUp: () => void;
  
  /**
   * Callback to switch to forgot password flow
   */
  onForgotPassword: () => void;
}

export function SignInForm({ onSignIn, onSwitchToSignUp, onForgotPassword }: SignInFormProps) {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handles form submission
   * Validates inputs and calls onSignIn callback
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email format
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check password is not empty
    if (!password || password.length < 1) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      await onSignIn(email, password);
    } catch (err) {
      // Handle authentication errors
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
        <p className="text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sign In Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
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

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-primary hover:underline"
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="mr-2">Signing in...</span>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      {/* Switch to Sign Up */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="text-primary font-semibold hover:underline"
          disabled={isLoading}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
