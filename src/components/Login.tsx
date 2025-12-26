import React, { useState, useEffect } from 'react';
import { Mail, Lock, Wallet, User, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import MinimalHeader from './layout/MinimalHeader';
import OTPInput from './OTPInput';
import apiService from '../services/api';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'details' | 'otp'>('details');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    walletAddress: '',
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    walletAddress: ''
  });
  const [fieldValid, setFieldValid] = useState({
    fullName: false,
    email: false,
    password: false,
    walletAddress: false
  });
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  const { login, connectWallet } = useAuth();

  // OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (registrationStep === 'otp' && otpTimer > 0) {
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
  }, [registrationStep, otpTimer]);

  // Auto-submit OTP when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && registrationStep === 'otp') {
      handleVerifyOTP();
    }
  }, [otp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.sendRegistrationOTP(formData.email, formData.fullName);
      setSuccess('Verification code sent to your email!');
      setRegistrationStep('otp');
      setOtpTimer(300);
      setCanResend(false);
    } catch (error: any) {
      setError(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiService.verifyAndRegister({
        ...formData,
        otp,
      });

      const { token, user } = response;
      localStorage.setItem('token', token);
      
      // Trigger a page reload to update auth state
      window.location.reload();
    } catch (error: any) {
      setError(error.message || 'Invalid verification code');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.sendRegistrationOTP(formData.email, formData.fullName);
      setSuccess('New verification code sent!');
      setOtpTimer(300);
      setCanResend(false);
      setOtp('');
    } catch (error: any) {
      setError(error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDetails = () => {
    setRegistrationStep('details');
    setOtp('');
    setError('');
    setSuccess('');
  };

  const handleWalletConnect = async () => {
    setLoading(true);
    setError('');

    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        await connectWallet();
      } else {
        throw new Error('MetaMask is not installed. Please install MetaMask to use wallet connection.');
      }
    } catch (error: any) {
      setError(error.message || 'Wallet connection failed');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateWalletAddress = (address: string): boolean => {
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
    return walletRegex.test(address);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    let isValid = false;
    let errorMsg = '';

    switch (name) {
      case 'fullName':
        isValid = value.trim().length >= 2;
        errorMsg = isValid ? '' : 'Name must be at least 2 characters';
        break;
      case 'email':
        isValid = validateEmail(value);
        errorMsg = isValid ? '' : value ? 'Please enter a valid email address' : '';
        break;
      case 'password':
        isValid = value.length >= 6;
        errorMsg = isValid ? '' : value ? 'Password must be at least 6 characters' : '';
        if (value) {
          setPasswordStrength(calculatePasswordStrength(value));
        } else {
          setPasswordStrength(null);
        }
        break;
      case 'walletAddress':
        isValid = validateWalletAddress(value);
        errorMsg = isValid ? '' : value ? 'Invalid wallet address format (0x + 40 hex characters)' : '';
        break;
    }

    setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
    setFieldValid(prev => ({ ...prev, [name]: isValid }));
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setRegistrationStep('details');
    setOtp('');
    setError('');
    setSuccess('');
  };

  return (
    <>
      <MinimalHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-md w-full space-y-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl px-8 py-10 shadow-2xl shadow-slate-900/40">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/40">
            <User className="h-6 w-6 text-slate-950" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            {isLogin ? 'Sign in to your account' : 
             registrationStep === 'otp' ? 'Verify your email' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            {registrationStep === 'otp' 
              ? `Enter the code sent to ${formData.email}`
              : 'Blockchain-powered Land Registry System'}
          </p>
        </div>

        {/* OTP Verification Step */}
        {!isLogin && registrationStep === 'otp' ? (
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
                className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Resend Code
              </button>
            </div>

            <button
              type="button"
              onClick={handleBackToDetails}
              className="w-full flex items-center justify-center py-3 px-4 border border-slate-700 text-sm font-medium rounded-lg text-slate-300 bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to edit details
            </button>

            {loading && (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                <p className="text-sm text-slate-400 mt-2">Verifying...</p>
              </div>
            )}
          </div>
        ) : (
          /* Login/Registration Form */
          <form className="mt-8 space-y-6" onSubmit={isLogin ? handleLoginSubmit : handleSendOTP}>
            <div className="rounded-md shadow-sm space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required={!isLogin}
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`relative block w-full pl-10 pr-10 py-3.5 border bg-slate-950/80 placeholder-slate-400 text-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        formData.fullName && fieldErrors.fullName ? 'border-red-500/50' : 
                        formData.fullName && fieldValid.fullName ? 'border-emerald-500/50' : 'border-slate-800'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {formData.fullName && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {fieldValid.fullName ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                  {fieldErrors.fullName && formData.fullName && (
                    <p className="mt-1 text-xs text-red-400 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>
              )}

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
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`relative block w-full pl-10 pr-10 py-3.5 border bg-slate-950/80 placeholder-slate-400 text-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      formData.email && fieldErrors.email ? 'border-red-500/50' : 
                      formData.email && fieldValid.email ? 'border-emerald-500/50' : 'border-slate-800'
                    }`}
                    placeholder="Enter your email"
                  />
                  {formData.email && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {fieldValid.email ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
                {fieldErrors.email && formData.email && (
                  <p className="mt-1 text-xs text-red-400 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`relative block w-full pl-10 pr-10 py-3.5 border bg-slate-950/80 placeholder-slate-400 text-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      formData.password && fieldErrors.password ? 'border-red-500/50' : 
                      formData.password && fieldValid.password ? 'border-emerald-500/50' : 'border-slate-800'
                    }`}
                    placeholder="Enter your password"
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
                {formData.password && passwordStrength && !isLogin && (
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
                {fieldErrors.password && formData.password && (
                  <p className="mt-1 text-xs text-red-400 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {fieldErrors.password}
                  </p>
                )}
                {isLogin && (
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => window.location.href = '/forgot-password'}
                      className="text-sm text-orange-400 hover:text-orange-300 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="walletAddress" className="block text-sm font-medium text-slate-300 mb-1">
                    Wallet Address <span className="text-slate-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Wallet className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="walletAddress"
                      name="walletAddress"
                      type="text"
                      value={formData.walletAddress}
                      onChange={handleInputChange}
                      className={`relative block w-full pl-10 pr-10 py-3.5 border bg-slate-950/80 placeholder-slate-400 text-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        formData.walletAddress && fieldErrors.walletAddress ? 'border-red-500/50' : 
                        formData.walletAddress && fieldValid.walletAddress ? 'border-emerald-500/50' : 'border-slate-800'
                      }`}
                      placeholder="0x..."
                    />
                    {formData.walletAddress && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {fieldValid.walletAddress ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                  {fieldErrors.walletAddress && formData.walletAddress && (
                    <p className="mt-1 text-xs text-red-400 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {fieldErrors.walletAddress}
                    </p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-2xl text-slate-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-emerald-500/40"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950"></div>
                ) : (
                  isLogin ? 'Sign in' : 'Send Verification Code'
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-slate-400">
                    Or
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWalletConnect}
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-slate-700 text-sm font-medium rounded-lg text-white bg-slate-800/50 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect with MetaMask
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={switchMode}
                className="text-emerald-300 hover:text-emerald-200 text-sm font-medium"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </>
  );
};

export default Login;