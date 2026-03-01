import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ZapIcon,
  EyeIcon,
  EyeOffIcon,
  GithubIcon } from
'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        // Login
        await authService.login({ email, password });
        
        // Fetch full user data with roles to ensure accurate role detection
        const fullUser = await authService.getCurrentUser();
        login(fullUser);
        
        // PublicRoute will handle redirect based on role
      } else {
        // Register - creates user only
        await authService.register({ 
          email, 
          password, 
          operator_name: name 
        });
        
        // After registration, login with same credentials to get tokens
        await authService.login({ email, password });
        
        // Fetch full user data with roles to ensure accurate role detection
        const fullUser = await authService.getCurrentUser();
        login(fullUser);
        
        // PublicRoute will handle redirect based on role
      }
    } catch (err: any) {
      // Handle specific error messages from backend
      if (err.message) {
        setError(err.message);
      } else if (mode === 'login') {
        setError('Incorrect credentials. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center px-4">
      {/* Scanning bar at top */}
      <div className="fixed top-0 left-0 right-0 scanning-bar" />

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-12">
        <ZapIcon className="w-5 h-5 text-[#EF4444]" />
        <span className="font-mono text-base font-bold text-white tracking-widest">
          ARES AI
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#0a0a0a] border border-[#262626]">
        {/* Tabs */}
        <div className="flex border-b border-[#262626]">
          <button
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-3 font-mono text-xs tracking-widest transition-colors relative ${mode === 'login' ? 'text-white' : 'text-[#404040] hover:text-[#666]'}`}>

            LOGIN
            {mode === 'login' &&
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EF4444]" />
            }
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-3 font-mono text-xs tracking-widest transition-colors relative ${mode === 'register' ? 'text-white' : 'text-[#404040] hover:text-[#666]'}`}>

            REGISTER
            {mode === 'register' &&
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EF4444]" />
            }
          </button>
        </div>

        <div className="p-6">
          <h1 className="font-sans text-base font-bold text-white mb-1">
            {mode === 'login' ? 'OPERATOR LOGIN' : 'CREATE ACCOUNT'}
          </h1>
          <p className="font-mono text-[10px] text-[#404040] mb-6 tracking-wider">
            {mode === 'login' ?
            'ENTER YOUR CREDENTIALS TO CONTINUE' :
            'REGISTER A NEW OPERATOR ACCOUNT'}
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] font-mono text-xs rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' &&
            <div>
                <label className="block font-mono text-[10px] text-[#666] tracking-widest mb-1.5">
                  OPERATOR NAME
                </label>
                <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-[#050505] border border-[#262626] px-3 py-2.5 text-sm font-mono text-white placeholder-[#333] focus:border-[#3B82F6] transition-colors" />

              </div>
            }

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
                className="w-full bg-[#050505] border border-[#262626] px-3 py-2.5 text-sm font-mono text-white placeholder-[#333] focus:border-[#3B82F6] transition-colors" />

            </div>

            <div>
              <label className="block font-mono text-[10px] text-[#666] tracking-widest mb-1.5">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#050505] border border-[#262626] px-3 py-2.5 text-sm font-mono text-white placeholder-[#333] focus:border-[#3B82F6] transition-colors pr-10" />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#404040] hover:text-[#666]">

                  {showPassword ?
                  <EyeOffIcon className="w-4 h-4" /> :

                  <EyeIcon className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {mode === 'login' &&
            <div className="text-right">
                <button
                type="button"
                className="font-mono text-[10px] text-[#404040] hover:text-[#666] tracking-wider">

                  FORGOT ACCESS KEY?
                </button>
              </div>
            }

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#EF4444] text-white font-mono text-sm font-bold tracking-widest hover:bg-[#dc2626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">

              {loading ? 'PROCESSING...' : (mode === 'login' ? 'INITIATE SESSION' : 'CREATE ACCOUNT')}
            </button>
          </form>

          <div className="flex items-center gap-3 py-4">
            <div className="flex-1 h-px bg-[#262626]" />
            <span className="font-mono text-[10px] text-[#404040]">— OR —</span>
            <div className="flex-1 h-px bg-[#262626]" />
          </div>

          <div className="space-y-3">
            <button type="button" className="w-full py-2.5 bg-[#050505] border border-[#262626] text-[#999] font-mono text-xs tracking-wider hover:border-[#404040] hover:text-white transition-colors flex items-center justify-center gap-2">
              <span className="text-sm font-bold">G</span>
              LOGIN WITH GOOGLE
            </button>
            <button type="button" className="w-full py-2.5 bg-[#050505] border border-[#262626] text-[#999] font-mono text-xs tracking-wider hover:border-[#404040] hover:text-white transition-colors flex items-center justify-center gap-2">
              <GithubIcon className="w-4 h-4" />
              LOGIN WITH GITHUB
            </button>
          </div>

          {/* Demo accounts */}
          {/* <div className="mt-5 pt-5 border-t border-[#262626] space-y-2">
            <p className="font-mono text-[9px] text-[#333] tracking-widest text-center mb-3">
              DEMO ACCESS
            </p>
            <button
              type="button"
              onClick={handleDemoUser}
              className="w-full py-2.5 bg-[#050505] border border-[#3B82F6]/40 text-[#3B82F6] font-mono text-xs font-bold tracking-widest hover:bg-[#3B82F6]/10 hover:border-[#3B82F6] transition-colors flex items-center justify-center gap-2">

              <UserIcon className="w-3.5 h-3.5" />
              LOGIN AS DEMO USER
            </button>
            <button
              type="button"
              onClick={handleDemoAdmin}
              className="w-full py-2.5 bg-[#050505] border border-[#EF4444]/40 text-[#EF4444] font-mono text-xs font-bold tracking-widest hover:bg-[#EF4444]/10 hover:border-[#EF4444] transition-colors flex items-center justify-center gap-2">

              <ShieldIcon className="w-3.5 h-3.5" />
              LOGIN AS DEMO ADMIN
            </button>
          </div> */}
        </div>
      </div>

      <p className="font-mono text-[10px] text-[#262626] mt-6 tracking-wider">
        ARES AI — ENTERPRISE STRESS-TEST ENGINE
      </p>
    </div>);

}