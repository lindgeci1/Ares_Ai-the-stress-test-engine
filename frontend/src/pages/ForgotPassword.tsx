import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ZapIcon } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../context/useToast';

type Step = 'email' | 'code' | 'password';

export function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    setPasswordError('');
    setLoading(true);

    try {
      await authService.requestPasswordReset(email);
    } catch {
      // Intentionally ignored to avoid account enumeration.
    } finally {
      showToast('IF THIS EMAIL EXISTS YOU WILL RECEIVE A CODE — CHECK SPAM FOLDER', 'info');
      setLoading(false);
      setStep('code');
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    setPasswordError('');

    const normalized = code.trim();
    if (!/^\d{6}$/.test(normalized)) {
      setCodeError('Invalid or expired code');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.validateResetCode(normalized);
      if (result.valid) {
        setCode(normalized);
        showToast('CODE VERIFIED', 'success');
        setStep('password');
      } else {
        setCodeError('Invalid or expired code');
        showToast('Invalid or expired code', 'error');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid or expired code';
      setCodeError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('PASSWORDS DO NOT MATCH');
      showToast('PASSWORDS DO NOT MATCH', 'error');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(code, newPassword);
      showToast('PASSWORD UPDATED SUCCESSFULLY', 'success');
      navigate('/auth?reset=success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password.';
      setPasswordError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center px-4">
      <div className="fixed top-0 left-0 right-0 scanning-bar" />

      <Link to="/" className="flex items-center gap-2 mb-12">
        <ZapIcon className="w-5 h-5 text-[#EF4444]" />
        <span className="font-mono text-base font-bold text-white tracking-widest">
          ARES AI
        </span>
      </Link>

      <div className="w-full max-w-sm bg-[#0a0a0a] border border-[#262626]">
        <div className="p-6">
          <h1 className="font-sans text-base font-bold text-white mb-1">
            RESET ACCESS KEY
          </h1>
          <p className="font-mono text-[10px] text-[#404040] mb-6 tracking-wider">
            {step === 'email' && 'ENTER YOUR EMAIL TO RECEIVE A RESET CODE'}
            {step === 'code' && 'ENTER THE 6-DIGIT CODE SENT TO YOUR EMAIL'}
            {step === 'password' && 'SET A NEW PASSWORD FOR YOUR ACCOUNT'}
          </p>

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-[#666] tracking-widest mb-1.5">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@domain.com"
                  required
                  className="w-full bg-[#050505] border border-[#262626] px-3 py-2.5 text-sm font-mono text-white placeholder-[#333] focus:border-[#3B82F6] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#EF4444] text-white font-mono text-sm font-bold tracking-widest hover:bg-[#dc2626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'PROCESSING...' : 'SEND RESET CODE'}
              </button>

              <div className="text-center">
                <Link
                  to="/auth"
                  className="font-mono text-[10px] text-[#404040] hover:text-[#666] tracking-wider"
                >
                  BACK TO LOGIN
                </Link>
              </div>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-[#666] tracking-widest mb-1.5">
                  RESET CODE
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                  className="w-full bg-[#050505] border border-[#262626] px-3 py-2.5 text-sm font-mono text-white placeholder-[#333] focus:border-[#3B82F6] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#EF4444] text-white font-mono text-sm font-bold tracking-widest hover:bg-[#dc2626] transition-colors"
              >
                {loading ? 'PROCESSING...' : 'CONTINUE'}
              </button>

              {codeError && (
                <p className="font-mono text-[10px] text-[#EF4444]">
                  {codeError}
                </p>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setCodeError('');
                    setStep('email');
                  }}
                  className="font-mono text-[10px] text-[#404040] hover:text-[#666] tracking-wider"
                >
                  BACK
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-[#666] tracking-widest mb-1.5">
                  NEW PASSWORD
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#050505] border border-[#262626] px-3 py-2.5 text-sm font-mono text-white placeholder-[#333] focus:border-[#3B82F6] transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-[#666] tracking-widest mb-1.5">
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#050505] border border-[#262626] px-3 py-2.5 text-sm font-mono text-white placeholder-[#333] focus:border-[#3B82F6] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#EF4444] text-white font-mono text-sm font-bold tracking-widest hover:bg-[#dc2626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'PROCESSING...' : 'RESET PASSWORD'}
              </button>

              {passwordError && (
                <p className="font-mono text-[10px] text-[#EF4444]">
                  {passwordError}
                </p>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordError('');
                    setStep('code');
                  }}
                  className="font-mono text-[10px] text-[#404040] hover:text-[#666] tracking-wider"
                >
                  BACK
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <p className="font-mono text-[10px] text-[#262626] mt-6 tracking-wider">
        ARES AI - ENTERPRISE STRESS-TEST ENGINE
      </p>
    </div>
  );
}
