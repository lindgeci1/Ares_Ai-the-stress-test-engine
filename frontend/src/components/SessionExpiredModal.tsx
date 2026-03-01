import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangleIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SessionExpiredModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsVisible(true);
      setCountdown(3);
      
      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        setIsVisible(false);
        logout(); // Clear user state and storage
        navigate('/auth');
      }, 3000);

      return () => clearInterval(countdownInterval);
    };

    window.addEventListener('SESSION_EXPIRED', handleSessionExpired);
    return () => window.removeEventListener('SESSION_EXPIRED', handleSessionExpired);
  }, [navigate, logout]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0a0a0a] border border-[#EF4444] shadow-2xl p-8 max-w-md mx-4">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-4 relative">
            <div className="w-16 h-16 border-2 border-[#EF4444] flex items-center justify-center">
              <AlertTriangleIcon className="w-8 h-8 text-[#EF4444]" />
            </div>
          </div>

          {/* Title */}
          <h2 className="font-mono text-xl font-bold text-white mb-2 tracking-widest">
            SESSION EXPIRED
          </h2>
          
          {/* Message */}
          <p className="font-sans text-sm text-[#666] mb-6">
            Your session has expired. Redirecting to login...
          </p>

          {/* Countdown */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border border-[#EF4444] flex items-center justify-center">
              <span className="font-mono text-2xl font-bold text-[#EF4444]">
                {countdown}
              </span>
            </div>
            <span className="font-mono text-xs text-[#666] tracking-wider">
              SECONDS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
