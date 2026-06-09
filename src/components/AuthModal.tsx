import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, LogIn, Info, Calendar, Sparkles, Image, CheckSquare, Bell, Gift, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import { loginWithGoogle, sendOtpEmail, verifyOtp } from '../firebase/db';
import { isMockMode } from '../firebase/config';

interface AuthModalProps {
  onSuccess: () => void;
}

type AuthPhase = 'ENTER_EMAIL' | 'ENTER_OTP';

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [phase, setPhase] = useState<AuthPhase>('ENTER_EMAIL');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Toast overlay state for displaying the mock generated code
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const code = await sendOtpEmail(email.trim());
      setGeneratedOtp(code);
      setToastMessage(`Verification code sent to ${email}`);
      
      // Auto-dismiss the toast after 10 seconds
      setTimeout(() => {
        setToastMessage(null);
      }, 10000);
      
      setPhase('ENTER_OTP');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await verifyOtp(email.trim(), otpCode);
      // Success! Clear states and trigger callback
      setToastMessage(null);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestBypass = () => {
    localStorage.setItem(
      'cal_mock_user',
      JSON.stringify({
        uid: 'mock-user-123',
        email: 'demo@example.com',
        displayName: 'Demo Guest',
        photoURL: null,
      })
    );
    window.dispatchEvent(new Event('mock-auth-change'));
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0f1d] overflow-hidden select-none">
      
      {/* Cool background glowing blobs (Mesh Effect) */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square rounded-full bg-indigo-600/15 blur-[120px] animate-orb-slow pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square rounded-full bg-rose-600/15 blur-[120px] animate-orb-reverse pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[45%] aspect-square rounded-full bg-teal-600/10 blur-[100px] animate-orb-slow pointer-events-none" />

      {/* On-screen Toast Notification showing generated code in mock mode */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/90 text-white shadow-2xl backdrop-blur-md flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold">{toastMessage}</p>
              {isMockMode && generatedOtp && (
                <div className="mt-2 p-2 bg-black/40 border border-white/5 rounded-lg">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Developer OTP Emulator</p>
                  <p className="text-sm font-black tracking-widest text-emerald-400 mt-1 select-text">
                    {generatedOtp}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">
                    Copy and enter this code below (or use master code <code className="text-slate-300">123456</code>).
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl dark-glass-card overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-white/10 shadow-2xl shadow-black/50"
      >
        
        {/* LEFT COLUMN: INTRO / SHOWCASE (Visible on Desktop) */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-b from-slate-900/60 to-slate-950/80 p-8 border-r border-white/5 flex-col justify-between text-white relative">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                Smart Calendar
              </span>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-xl font-extrabold leading-tight text-indigo-100">
                A Visual Workspace for Your Schedule & Goals.
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your schedules, monitor pending milestones, and keep memories alive with customizable image features.
              </p>
            </div>

            {/* Feature lists */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Dynamic Scheduling</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Month, Week, Day, and Agenda grids.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Integrated Task Manager</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Priority tracking and circular completion gauge.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <Image className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Wallpaper Customization</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Adjust backdrop blur and glass tint instantly.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <Gift className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Important Milestones</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Countdowns and calculated ages for special dates.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Desktop Reminders</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Get alarms directly inside your browser window.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-semibold pt-6">
            Personal Productivity App • Version 1.0.0
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN / SIGNUP CARD */}
        <div className="col-span-1 md:col-span-7 p-8 md:p-10 flex flex-col justify-center bg-[#0e1424]">
          
          <div className="md:hidden flex flex-col items-center mb-6 text-center">
            <div className="p-3 mb-2 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Calendar className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Smart Personal Calendar</h2>
            <p className="text-xs text-slate-400">
              Organize schedules, tasks, and memory photos.
            </p>
          </div>

          <div className="hidden md:block mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              {phase === 'ENTER_EMAIL' ? 'Sign In / Register' : 'Enter Verification Code'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {phase === 'ENTER_EMAIL' 
                ? 'Enter your email address to receive a secure 6-digit OTP code.' 
                : `We've sent a 6-digit security code to ${email}`}
            </p>
          </div>

          {isMockMode && (
            <div className="flex items-start gap-3 p-3.5 mb-5 text-xs rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">Email OTP System:</span> Running client-side. Type any email to generate a mock OTP, or bypass using the button below.
              </div>
            </div>
          )}

          {/* Dynamic forms based on active login phase */}
          <AnimatePresence mode="wait">
            {phase === 'ENTER_EMAIL' ? (
              <motion.form
                key="emailForm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSendOtp}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-white/10 bg-slate-900/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/25 rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl font-bold bg-accent hover:bg-accent-hover text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent-glow transition-all"
                >
                  <LogIn className="w-4.5 h-4.5" />
                  {loading ? 'Sending code...' : 'Send Verification Code'}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="otpForm"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={() => { setPhase('ENTER_EMAIL'); setError(''); }}
                      className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} // Numeric only
                      placeholder="Enter 6-digit code"
                      className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-white/10 bg-slate-900/50 text-white placeholder:text-slate-500 font-bold tracking-widest focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-center"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/25 rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl font-bold bg-accent hover:bg-accent-hover text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent-glow transition-all"
                >
                  <CheckCircle className="w-4.5 h-4.5" />
                  {loading ? 'Verifying code...' : 'Verify & Sign In'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500">
              <span className="px-2.5 bg-[#0e1424] text-slate-400">Or connect with</span>
            </div>
          </div>

          {/* Third-party buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 border border-white/10 rounded-xl hover:bg-white/5 font-semibold text-xs text-slate-350 transition-all cursor-pointer bg-transparent"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google Authentication
            </button>

            {isMockMode && (
              <button
                onClick={handleGuestBypass}
                className="w-full py-2 border border-dashed border-accent/20 hover:border-accent/40 text-accent rounded-xl font-bold text-xs transition-all cursor-pointer bg-transparent"
              >
                Access Guest Workspace (Demo Data)
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
