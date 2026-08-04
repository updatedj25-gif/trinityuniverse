import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '../types';

const TRINITY_LOGO =
  'https://image2url.com/r2/default/images/1767183581317-68102f31-454b-45f6-9d39-025ce8604ac3.png';

const SLIDES = [
  {
    id: 'welcome',
    badge: 'Trinity Universe',
    heading: 'A New Kind of\nIntelligence',
    sub: 'Two minds. One platform. Infinite depth.',
    cardBg: 'linear-gradient(145deg, #1e3a8a 0%, #3730a3 100%)',
    accentBar: '#93c5fd',
    badgeBg: 'rgba(255,255,255,0.13)',
  },
  {
    id: 'gnosis',
    badge: '◉  Gnosis AI',
    heading: 'Sharp. Curious.\nAnalytical.',
    sub: 'Strategy, code, science, philosophy — Gnosis digs deep.',
    cardBg: 'linear-gradient(145deg, #1e40af 0%, #2563eb 100%)',
    accentBar: '#60a5fa',
    badgeBg: 'rgba(255,255,255,0.13)',
  },
  {
    id: 'yada',
    badge: '✦  Yada Guide',
    heading: 'Wisdom.\nClarity. Soul.',
    sub: 'Ancient traditions, tarot, astrology, mindfulness — Yada walks with you.',
    cardBg: 'linear-gradient(145deg, #78350f 0%, #b45309 100%)',
    accentBar: '#fcd34d',
    badgeBg: 'rgba(255,255,255,0.13)',
  },
  {
    id: 'both',
    badge: 'Your Universe',
    heading: 'One Login.\nTwo Guides.',
    sub: 'Sign in and move freely — your conversations always waiting.',
    cardBg: 'linear-gradient(145deg, #1f2937 0%, #374151 100%)',
    accentBar: '#d1d5db',
    badgeBg: 'rgba(255,255,255,0.10)',
  },
];

// Normalize offset for wrap-around (4 slides)
function wrapOffset(raw: number, total: number): number {
  let d = raw % total;
  if (d > total / 2) d -= total;
  if (d < -total / 2) d += total;
  return d;
}

const GOOGLE_SVG = (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

interface LandingPageProps {
  onSignIn: (profile: UserProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goToSlide = useCallback(
    (idx: number) => {
      if (animating || idx === activeSlide) return;
      setAnimating(true);
      setActiveSlide(idx);
      setTimeout(() => setAnimating(false), 500);
    },
    [animating, activeSlide]
  );

  const goNext = useCallback(() => {
    goToSlide((activeSlide + 1) % SLIDES.length);
  }, [activeSlide, goToSlide]);

  // Auto-advance every 4 s
  useEffect(() => {
    const t = setTimeout(goNext, 4000);
    return () => clearTimeout(t);
  }, [goNext]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) goToSlide((activeSlide + 1) % SLIDES.length);
      else goToSlide((activeSlide - 1 + SLIDES.length) % SLIDES.length);
    }
    touchStartX.current = null;
  };

  const handleGoogleSignIn = () => { window.location.href = '/auth/google'; };
  const handleGuestEntry = () => { onSignIn({ name: 'Guest', signedIn: false }); };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FAF7F2] overflow-hidden select-none">

      {/* ── Top Bar: logo only, clean ── */}
      <div className="w-full px-5 pt-4 pb-2 flex items-center justify-start z-10 relative shrink-0">
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
      </div>

      {/* ── Card Carousel ── */}
      <div
        className="relative shrink-0"
        style={{ height: '46vh' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {SLIDES.map((slide, i) => {
          const d = wrapOffset(i - activeSlide, SLIDES.length);
          const isActive = d === 0;
          const isAdjacent = Math.abs(d) === 1;
          const isVisible = isActive || isAdjacent;

          // translateX: -50% centers the card (card is 76% wide, left:50%)
          // step of 95% (of card own width) gives ~15% peek on each side
          const tx = `calc(-50% + ${d * 95}%)`;
          const scale = isActive ? 1 : 0.88;
          const opacity = isActive ? 1 : isAdjacent ? 0.45 : 0;
          const blur = isActive ? 0 : 4;

          return (
            <div
              key={slide.id}
              onClick={() => !isActive && goToSlide(i)}
              style={{
                position: 'absolute',
                width: '76%',
                height: '88%',
                left: '50%',
                top: '50%',
                transform: `translate(${tx}, -50%) scale(${scale})`,
                opacity,
                filter: blur > 0 ? `blur(${blur}px)` : 'none',
                transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease, filter 0.5s ease',
                zIndex: isActive ? 3 : isAdjacent ? 2 : 1,
                cursor: isActive ? 'default' : 'pointer',
                pointerEvents: isVisible ? 'auto' : 'none',
                borderRadius: '28px',
                background: slide.cardBg,
                padding: '24px 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isActive
                  ? '0 20px 60px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.12)'
                  : '0 8px 24px rgba(0,0,0,0.15)',
                overflow: 'hidden',
              }}
            >
              {/* Top: Badge */}
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    background: slide.badgeBg,
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    marginBottom: '14px',
                  }}
                >
                  {slide.badge}
                </span>

                {/* Heading */}
                <h2
                  style={{
                    color: '#ffffff',
                    fontSize: 'clamp(22px, 5.5vw, 30px)',
                    fontWeight: 800,
                    lineHeight: 1.18,
                    letterSpacing: '-0.02em',
                    whiteSpace: 'pre-line',
                    marginBottom: '10px',
                  }}
                >
                  {slide.heading}
                </h2>

                {/* Sub text */}
                <p
                  style={{
                    color: 'rgba(255,255,255,0.72)',
                    fontSize: 'clamp(12px, 3vw, 14px)',
                    lineHeight: 1.55,
                    fontWeight: 400,
                  }}
                >
                  {slide.sub}
                </p>
              </div>

              {/* Bottom: accent bar */}
              <div
                style={{
                  height: '3px',
                  borderRadius: '999px',
                  background: slide.accentBar,
                  opacity: 0.6,
                  marginTop: '16px',
                  width: '40%',
                }}
              />

              {/* Subtle inner glow */}
              <div
                style={{
                  position: 'absolute',
                  top: '-30%',
                  right: '-20%',
                  width: '70%',
                  height: '70%',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Dot Indicators ── */}
      <div className="flex items-center justify-center gap-2 mt-3 mb-1 shrink-0">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goToSlide(i)}
            className="cursor-pointer transition-all duration-300"
            style={{
              width: i === activeSlide ? '20px' : '7px',
              height: '7px',
              borderRadius: '999px',
              background: i === activeSlide ? '#1e3a8a' : '#d1d5db',
            }}
          />
        ))}
      </div>

      {/* ── CTA — right below the slider ── */}
      <div className="flex flex-col items-center gap-2.5 px-6 mt-4 shrink-0">

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full max-w-sm py-3.5 px-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
        >
          {GOOGLE_SVG}
          <span>Continue with Google</span>
        </button>

        {/* Guest entry */}
        <button
          onClick={handleGuestEntry}
          className="text-xs text-stone-400 hover:text-slate-600 transition-colors cursor-pointer underline underline-offset-2"
        >
          Continue as guest
        </button>

        <p className="text-[10px] text-stone-400 text-center max-w-xs">
          By continuing you agree to Trinity Universe's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
