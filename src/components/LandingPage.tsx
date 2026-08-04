import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';

const TRINITY_LOGO =
  'https://image2url.com/r2/default/images/1767183581317-68102f31-454b-45f6-9d39-025ce8604ac3.png';

const SLIDES = [
  {
    id: 'welcome',
    label: 'Trinity Universe',
    heading: 'A New Kind of\nIntelligence',
    sub: 'Two minds. One platform. Infinite depth.',
    accent: '#1a73e8',
    bg: 'from-[#EEF3FF] via-[#F5F7FF] to-[#FAF7F2]',
    dot: 'bg-[#1a73e8]',
    badge: null,
  },
  {
    id: 'gnosis',
    label: 'Gnosis AI',
    heading: 'Sharp. Curious.\nAnalytical.',
    sub: 'Strategy, code, science, philosophy — Gnosis digs deep into any question.',
    accent: '#1a73e8',
    bg: 'from-[#E8F0FE] via-[#F0F4FF] to-[#FAF7F2]',
    dot: 'bg-[#1a73e8]',
    badge: '◉ Gnosis AI',
  },
  {
    id: 'yada',
    label: 'Yada Guide',
    heading: 'Wisdom.\nClarity. Soul.',
    sub: 'Ancient traditions, tarot, astrology, mindfulness — Yada walks with you.',
    accent: '#A36224',
    bg: 'from-[#FDF3E8] via-[#FFF8F2] to-[#FAF7F2]',
    dot: 'bg-[#A36224]',
    badge: '✦ Yada Guide',
  },
  {
    id: 'both',
    label: 'Your Universe',
    heading: 'One Login.\nTwo Guides.',
    sub: 'Sign in and move freely between Gnosis and Yada — your conversations always waiting.',
    accent: '#6b7280',
    bg: 'from-[#F5F3EE] via-[#FAF7F2] to-[#F0EDE8]',
    dot: 'bg-slate-500',
    badge: null,
  },
];

interface LandingPageProps {
  onSignIn: (profile: UserProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback(
    (idx: number) => {
      if (isTransitioning || idx === activeSlide) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveSlide(idx);
        setIsTransitioning(false);
      }, 280);
    },
    [isTransitioning, activeSlide]
  );

  const goNext = useCallback(() => {
    goToSlide((activeSlide + 1) % SLIDES.length);
  }, [activeSlide, goToSlide]);

  // Auto-advance every 4 s
  useEffect(() => {
    const timer = setTimeout(goNext, 4000);
    return () => clearTimeout(timer);
  }, [goNext]);

  const slide = SLIDES[activeSlide];

  const handleGoogleSignIn = () => {
    onSignIn({
      name: 'Explorer',
      email: 'user@trinityuniverse.org',
      signedIn: true,
    });
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FAF7F2] overflow-hidden select-none">
      {/* ── Top Bar ── */}
      <div className="w-full px-5 py-3 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2">
          <img
            src={TRINITY_LOGO}
            alt="Trinity Universe"
            className="w-7 h-7 object-contain animate-breathe"
          />
          <span className="text-[11px] font-semibold tracking-[0.18em] text-slate-700 uppercase">
            Trinity Universe
          </span>
        </div>
        <button
          onClick={handleGoogleSignIn}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-stone-200/60 border border-transparent hover:border-stone-200"
        >
          Sign in
        </button>
      </div>

      {/* ── Hero Slider ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Background gradient — transitions with slide */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${slide.bg} transition-all duration-700`}
        />

        {/* Floating ambient orbs */}
        <div
          className="absolute w-72 h-72 rounded-full blur-3xl opacity-25 transition-all duration-700 -top-16 -left-16"
          style={{ background: slide.accent }}
        />
        <div
          className="absolute w-48 h-48 rounded-full blur-2xl opacity-15 transition-all duration-700 bottom-20 right-10"
          style={{ background: slide.accent }}
        />

        {/* Slide content */}
        <div
          className={`relative z-10 text-center max-w-xs sm:max-w-sm transition-all duration-300 ${
            isTransitioning
              ? 'opacity-0 translate-y-3 scale-[0.97]'
              : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          {/* Badge pill */}
          {slide.badge && (
            <div
              className="inline-block text-[11px] font-semibold px-3.5 py-1 rounded-full mb-4 border"
              style={{
                color: slide.accent,
                borderColor: slide.accent + '40',
                background: slide.accent + '12',
              }}
            >
              {slide.badge}
            </div>
          )}

          {/* Heading — split on \n */}
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 leading-tight tracking-tight mb-3">
            {slide.heading.split('\n').map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>

          {/* Sub */}
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-[26ch] mx-auto">
            {slide.sub}
          </p>
        </div>

        {/* ── Dot Indicators ── */}
        <div className="relative z-10 flex items-center gap-2 mt-10">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goToSlide(i)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                i === activeSlide
                  ? `w-6 h-2 ${slide.dot}`
                  : 'w-2 h-2 bg-stone-300 hover:bg-stone-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="px-6 pb-10 pt-2 flex flex-col items-center gap-3 relative z-10">
        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full max-w-sm py-3.5 px-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Guest entry */}
        <button
          onClick={() =>
            onSignIn({ name: 'Guest', signedIn: false })
          }
          className="text-xs text-stone-400 hover:text-slate-600 transition-colors cursor-pointer underline underline-offset-2"
        >
          Continue as guest
        </button>

        <p className="text-[10px] text-stone-400 text-center max-w-xs mt-1">
          By continuing you agree to Trinity Universe's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
