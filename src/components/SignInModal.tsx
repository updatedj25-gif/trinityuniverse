import React, { useState } from 'react';
import { X } from 'lucide-react';
import { UserProfile } from '../types';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInSuccess: (user: UserProfile) => void;
  googleOnly?: boolean;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSignInSuccess,
  googleOnly = false,
}) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  /** Real Google OAuth — navigates to the backend /api/auth/google route */
  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/google';
  };

  /** Guest / custom-name sign-in (client-only, no server session) */
  const handleGuestSignIn = () => {
    const profile: UserProfile = {
      name: name.trim() || 'Guest',
      signedIn: false,
    };
    // Persist guest name locally so the parent can read it
    localStorage.setItem('trinity_user_profile', JSON.stringify(profile));
    // Reload so App picks up the stored profile
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
            ●
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            {googleOnly ? 'Sign in to enter the Library' : 'Sign in to Trinity Universe'}
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            {googleOnly
              ? 'Use your Google account to access the Trinity Universe Library.'
              : 'Sync your Gnosis AI and Yada Guide conversations across devices'}
          </p>
        </div>

        <div className="space-y-4">
          {/* ── Real Google OAuth button ── */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl font-medium text-sm text-slate-700 flex items-center justify-center gap-3 shadow-2xs transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {!googleOnly && (
            <>
              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <span className="relative bg-white px-3 text-xs text-stone-400">
                  or continue as guest
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Gabriel Vane"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-stone-500"
                />
              </div>

              <button
                onClick={handleGuestSignIn}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                Continue as {name || 'Guest'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
