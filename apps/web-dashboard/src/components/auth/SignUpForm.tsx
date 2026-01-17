/**
 * SignUpForm Component
 * 
 * Provides user registration interface with comprehensive form fields.
 * Features:
 * - Full name input
 * - Work email validation
 * - Optional phone number field
 * - Password with strength validation
 * - Domain/Department selection
 * - Real-time validation feedback
 * - Password visibility toggle
 */

import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, Building, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { validateEmail, validatePassword, validatePhone } from '@/lib/authUtils';

// Available departments/domains for selection
const DEPARTMENTS = [
  'Quality Assurance',
  'Quality Control',
  'Manufacturing',
  'Regulatory Affairs',
  'Research & Development',
  'Business Development',
  'Executive Leadership',
  'Information Technology',
  'Supply Chain',
  'Clinical Operations',
  'Others',
];

interface SignUpFormProps {
  /**
   * Callback function called when user submits valid registration data
   */
  onSignUp: (data: SignUpData) => Promise<void>;
  
  /**
   * Callback to switch to sign-in form
   */
  onSwitchToSignIn: () => void;
}

export interface SignUpData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  department: string;
}

export function SignUpForm({ onSignUp, onSwitchToSignIn }: SignUpFormProps) {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  /**
   * Validates password as user types and provides real-time feedback
   */
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value.length > 0) {
      setPasswordStrength(validatePassword(value));
    } else {
      setPasswordStrength(null);
    }
  };

  /**
   * Handles form submission
   * Performs comprehensive validation before calling onSignUp callback
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate name
    if (name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters)');
      return;
    }

    // Validate email
    if (!validateEmail(email)) {
      setError('Please enter a valid work email address');
      return;
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      setError('Please enter a valid phone number or leave it empty');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    // Confirm password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate department selection
    if (!department) {
      setError('Please select your department');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare sign-up data
      const signUpData: SignUpData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        department,
      };

      await onSignUp(signUpData);
    } catch (err) {
      // Handle registration errors
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Create Account</h2>
        <p className="text-muted-foreground">
          Sign up to get started with PharmaAI
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sign Up Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {/* Work Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Work Email *</Label>
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

        {/* Phone Number Field (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone Number <span className="text-muted-foreground text-xs">(Optional)</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
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
          
          {/* Password Strength Indicator */}
          {passwordStrength && (
            <div className={`flex items-center gap-2 text-xs ${
              passwordStrength.isValid ? 'text-green-600' : 'text-amber-600'
            }`}>
              {passwordStrength.isValid ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              <span>{passwordStrength.message}</span>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
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
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Department/Domain Field */}
        <div className="space-y-2">
          <Label htmlFor="department">Department / Domain *</Label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
            <Select
              value={department}
              onValueChange={setDepartment}
              disabled={isLoading}
              required
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <span className="mr-2">Creating account...</span>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      {/* Switch to Sign In */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="text-primary font-semibold hover:underline"
          disabled={isLoading}
        >
          Sign In
        </button>
      </div>

      {/* Password Requirements Info */}
      <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
        <p className="font-semibold">Password must contain:</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>At least 8 characters</li>
          <li>One uppercase letter</li>
          <li>One lowercase letter</li>
          <li>One number</li>
          <li>One special character (!@#$%^&*)</li>
        </ul>
      </div>
    </div>
  );
}
