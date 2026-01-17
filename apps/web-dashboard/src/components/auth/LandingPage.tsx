/**
 * LandingPage Component
 * 
 * Main authentication landing page that orchestrates sign-in, sign-up, OTP verification, and password reset flows.
 * Features:
 * - Tab-based navigation between Sign In and Sign Up
 * - Integrated OTP verification after sign-up
 * - Forgot password flow with OTP verification
 * - Smooth transitions between authentication states
 * - Branded interface with company information
 * - Responsive layout with sidebar branding panel
 */

import { useState } from 'react';
import { Shield, Lock, FileCheck, Users } from 'lucide-react';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm, SignUpData } from '@/components/auth/SignUpForm';
import { OTPVerification } from '@/components/auth/OTPVerification';
import { ForgetPassword } from '@/components/auth/ForgetPassword';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Authentication flow states
type AuthStep = 'form' | 'otp-verification' | 'forgot-password';

export function LandingPage() {
  const { login, signUp, verifyOTP, resendOTP } = useAuth();
  
  // UI state
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [authStep, setAuthStep] = useState<AuthStep>('form');
  const [pendingSignUpData, setPendingSignUpData] = useState<SignUpData | null>(null);

  /**
   * Handles sign-in submission
   */
  const handleSignIn = async (email: string, password: string) => {
    const success = await login(email, password);
    if (!success) {
      throw new Error('Invalid email or password');
    }
  };

  /**
   * Handles sign-up submission
   * Initiates OTP verification flow
   */
  const handleSignUp = async (data: SignUpData) => {
    // Store sign-up data for later use after OTP verification
    setPendingSignUpData(data);
    
    // Initiate sign-up process (sends OTP)
    const success = await signUp(data);
    if (!success) {
      throw new Error('Registration failed. Email may already be in use.');
    }
    
    // Move to OTP verification step
    setAuthStep('otp-verification');
  };

  /**
   * Handles OTP verification
   */
  const handleVerifyOTP = async (otp: string) => {
    if (!pendingSignUpData) {
      throw new Error('No pending registration found');
    }

    const success = await verifyOTP(pendingSignUpData.email, otp);
    if (!success) {
      throw new Error('Invalid or expired OTP');
    }
    
    // OTP verified successfully - user will be logged in automatically
  };

  /**
   * Handles OTP resend
   */
  const handleResendOTP = async () => {
    if (!pendingSignUpData) {
      throw new Error('No pending registration found');
    }

    await resendOTP(pendingSignUpData.email);
  };

  /**
   * Handles going back from OTP verification to sign-up form
   */
  const handleBackToSignUp = () => {
    setAuthStep('form');
    setPendingSignUpData(null);
  };

  /**
   * Switches between sign-in and sign-up tabs
   */
  const switchToSignIn = () => setActiveTab('signin');
  const switchToSignUp = () => setActiveTab('signup');
  
  /**
   * Handles navigation to forgot password flow
   */
  const handleForgotPassword = () => {
    setAuthStep('forgot-password');
  };
  
  /**
   * Handles successful password reset
   */
  const handlePasswordResetSuccess = () => {
    setAuthStep('form');
    setActiveTab('signin');
  };
  
  /**
   * Handles back from forgot password to sign-in
   */
  const handleBackToSignIn = () => {
    setAuthStep('form');
    setActiveTab('signin');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          {/* Logo and Title */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">PharmaAI</h1>
                <p className="text-sm text-primary-foreground/70">Knowledge Agent</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold leading-tight mb-4">
              GxP-Compliant<br />
              Intelligence Platform
            </h2>
            
            <p className="text-lg text-primary-foreground/70 max-w-md">
              Role-segregated access to pharmaceutical knowledge with full audit traceability 
              and regulatory compliance.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Complete Audit Trail</h3>
                <p className="text-sm text-primary-foreground/60">
                  Every query and access is logged for 21 CFR Part 11 compliance
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Source Traceability</h3>
                <p className="text-sm text-primary-foreground/60">
                  Full document lineage and versioning for regulatory audits
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Role-Based Access</h3>
                <p className="text-sm text-primary-foreground/60">
                  Granular permissions aligned with organizational roles
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-primary-foreground/50">
            © 2026 PharmaAI. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right panel - Authentication Forms */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {authStep === 'form' ? (
            // Sign In / Sign Up Forms
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <SignInForm 
                  onSignIn={handleSignIn}
                  onSwitchToSignUp={switchToSignUp}
                  onForgotPassword={handleForgotPassword}
                />
              </TabsContent>
              
              <TabsContent value="signup">
                <SignUpForm 
                  onSignUp={handleSignUp}
                  onSwitchToSignIn={switchToSignIn}
                />
              </TabsContent>
            </Tabs>
          ) : authStep === 'otp-verification' ? (
            // OTP Verification
            <OTPVerification
              email={pendingSignUpData?.email || ''}
              onVerify={handleVerifyOTP}
              onResendOTP={handleResendOTP}
              onBack={handleBackToSignUp}
            />
          ) : (
            // Forgot Password Flow
            <ForgetPassword
              onBack={handleBackToSignIn}
              onSuccess={handlePasswordResetSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
