import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowLeft, Clock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MinimalHeader from './layout/MinimalHeader';
import OTPInput from './OTPInput';
import apiService from '../services/api';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpTimer, setOtpTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  // OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  // Auto-submit OTP when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && step === 'otp') {
      handleVerifyOTP();
    }
  }, [otp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.sendPasswordResetOTP(email);
      setSuccess('Password reset code sent to your email!');
      setStep('otp');
      setOtpTimer(300);
      setCanResend(false);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      await apiService.verifyResetOTP(email, otp);
      setSuccess('Code verified! Please set your new password.');
      setStep('password');
    } catch (error: any) {
      setError(error.message || 'Invalid verification code');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await apiService.resetPassword(email, newPassword);
      setSuccess('Password reset successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.sendPasswordResetOTP(email);
      setSuccess('New code sent!');
      setOtpTimer(300);
      setCanResend(false);
      setOtp('');
    } catch (error: any) {
      setError(error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
    setSuccess('');
  };

  const handleBackToOTP = () => {
    setStep('otp');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  return (
    <>
      <MinimalHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-md w-full space-y-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl px-8 py-10 shadow-2xl shadow-slate-900/40">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-md shadow-orange-500/40">
              <Lock className="h-6 w-6 text-slate-950" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-white">
              {step === 'email' && 'Reset Password'}
              {step === 'otp' && 'Verify Code'}
              {step === 'password' && 'New Password'}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {step === 'email' && 'Enter your email to receive a reset code'}
              {step === 'otp' && `Code sent to ${email}`}
              {step === 'password' && 'Create a strong new password'}
            </p>
          </div>

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="relative block w-full pl-10 pr-3 py-3.5 border border-slate-800 bg-slate-950/80 placeholder-slate-400 text-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-2xl text-slate-950 bg-orange-500 hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-orange-500/40"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950"></div>
                ) : (
                  'Send Reset Code'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-emerald-300 hover:text-emerald-200 text-sm font-medium"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="text-center">
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                  error={!!error}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {success}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-slate-400">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className={otpTimer <= 60 ? 'text-red-400 font-medium' : ''}>
                    {formatTime(otpTimer)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={!canResend || loading}
                  className="text-orange-400 hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Resend Code
                </button>
              </div>

              <button
                type="button"
                onClick={handleBackToEmail}
                className="w-full flex items-center justify-center py-3 px-4 border border-slate-700 text-sm font-medium rounded-lg text-slate-300 bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Change Email
              </button>

              {loading && (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  <p className="text-sm text-slate-400 mt-2">Verifying...</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (e.target.value) {
                        setPasswordStrength(calculatePasswordStrength(e.target.value));
                      } else {
                        setPasswordStrength(null);
                      }
                    }}
                    className="relative block w-full pl-10 pr-10 py-3.5 border border-slate-800 bg-slate-950/80 placeholder-slate-400 text-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                    )}
                  </button>
                </div>
                {newPassword && passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength === 'strong' ? 'text-emerald-400' :
                        passwordStrength === 'medium' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${
                        passwordStrength === 'strong' ? 'w-full bg-emerald-500' :
                        passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' :
                        'w-1/3 bg-red-500'
                      }`} />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="relative block w-full pl-10 pr-10 py-3.5 border border-slate-800 bg-slate-950/80 placeholder-slate-400 text-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-400 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="mt-1 text-xs text-emerald-400 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Passwords match
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || newPassword !== confirmPassword}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-2xl text-slate-950 bg-orange-500 hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-orange-500/40"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950"></div>
                ) : (
                  'Reset Password'
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToOTP}
                className="w-full flex items-center justify-center py-3 px-4 border border-slate-700 text-sm font-medium rounded-lg text-slate-300 bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
