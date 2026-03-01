import React, { useState } from 'react';
import { XIcon, ZapIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
type AuthModalProps = {
  onClose: () => void;
};
export function AuthModal({ onClose }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#262626] p-8 relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#404040] hover:text-white transition-colors"
          aria-label="Close modal">

          <XIcon className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <ZapIcon className="w-4 h-4 text-[#EF4444]" />
          <span className="font-mono text-xs text-[#EF4444] tracking-widest font-bold">
            ARES AI
          </span>
        </div>

        <h2 className="font-sans text-lg font-bold text-white mb-1">
          AUTHENTICATION REQUIRED
        </h2>
        <p className="font-mono text-xs text-[#404040] mb-6 tracking-wider">
          INITIATE SECURE SESSION TO CONTINUE
        </p>

        {/* Scanning bar */}
        <div className="scanning-bar mb-6" />

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] text-[#666] tracking-widest mb-1.5">
              OPERATOR EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@domain.com"
              className="w-full bg-[#050505] border border-[#262626] px-3 py-2.5 text-sm font-mono text-white placeholder-[#333] focus:border-[#3B82F6] transition-colors" />

          </div>

          <div>
            <label className="block font-mono text-[10px] text-[#666] tracking-widest mb-1.5">
              ACCESS KEY
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
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

          <button className="w-full py-3 bg-[#EF4444] text-white font-mono text-sm font-bold tracking-widest hover:bg-[#dc2626] transition-colors mt-2">
            INITIATE SESSION
          </button>

          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-[#262626]" />
            <span className="font-mono text-[10px] text-[#404040]">OR</span>
            <div className="flex-1 h-px bg-[#262626]" />
          </div>

          <button className="w-full py-2.5 bg-[#050505] border border-[#262626] text-[#999] font-mono text-xs tracking-wider hover:border-[#404040] hover:text-white transition-colors">
            CONTINUE WITH GOOGLE
          </button>
          <button className="w-full py-2.5 bg-[#050505] border border-[#262626] text-[#999] font-mono text-xs tracking-wider hover:border-[#404040] hover:text-white transition-colors">
            CONTINUE WITH GITHUB
          </button>
        </div>
      </div>
    </div>);

}