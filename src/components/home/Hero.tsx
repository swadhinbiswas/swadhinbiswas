'use client';

import React, { useState, useEffect } from 'react';
import { siteConfig } from '../../config/site';

const GREETINGS = [
  "Hello", "Hola", "Bonjour", "Namaste", "Ciao", "Zdravstvuyte", "Konnichiwa", "Guten Tag", "Ola", "Ahlan", "Hallå", "Yassou", "Cześć", "Halo", "Selam", "Hey!"
];

const GreetingAnimation = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % GREETINGS.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block min-w-[3ch] transition-opacity duration-500 text-gray-100">
      {GREETINGS[index]}
    </span>
  );
};

interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  logoUrl: string | null; // Allow null
  url?: string | null; // Allow null
  details?: string | null;
  companyDescription?: string | null;
}

interface HeroProps {
  experiences?: Experience[];
}

export default function Hero({ experiences = [] }: HeroProps) {
  const displayExperiences = experiences.length > 0 ? experiences : siteConfig.experience;
  const [activeExpIndex, setActiveExpIndex] = useState<number | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveExpIndex(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    if (activeExpIndex !== null) {
      const handleClickOutside = () => setActiveExpIndex(null);
    }
  }, [activeExpIndex]);

  return (
    <section className="min-h-[80vh] flex flex-col justify-center relative overflow-hidden py-12 sm:py-20">

      {/* Background Grid Accent */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div className="z-10 max-w-4xl w-full mx-auto px-4 sm:px-6">

        {/* Intro Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold font-mono tracking-tight mb-6 sm:mb-8 text-center md:text-left">
          <div className="mb-2 sm:mb-4">
            <GreetingAnimation />
          </div>
          <span className="text-gray-100">I'm </span>
          <span className="text-cyan-400 block sm:inline mt-1 sm:mt-0">
            {siteConfig.author.split(' ')[0]}
          </span>
          <span className="text-teal-600 opacity-90 block sm:inline">
            {' ' + siteConfig.author.split(' ').slice(1).join(' ')}
          </span>
        </h1>

        {/* Bio Text */}
        <div className="text-base sm:text-lg md:text-xl text-gray-400 font-mono leading-relaxed max-w-3xl space-y-4 sm:space-y-6 text-center md:text-left mx-auto md:mx-0">
          <p>
            I'm currently working as a {siteConfig.experience[0].role} @ <a href={siteConfig.experience[0].url} target="_blank" rel="noopener noreferrer" className="text-white underline decoration-dashed underline-offset-4 decoration-gray-500 hover:decoration-teal-300 hover:text-teal-300 transition-all">{siteConfig.experience[0].company}</a>.
          </p>
          <p>
            I build production ready, scalable systems. Currently researching Artificial Intelligence to make this thing more reliable, cost-effective,  low-energy, and low-precision.
          </p>
        </div>

        {/* Social Links Row */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 mt-8 sm:mt-10 font-mono text-xs sm:text-sm">
          {siteConfig.socials.slice(0, 3).map((social, i) => (
            <React.Fragment key={social.name}>
              {i > 0 && <span className="text-gray-700 hidden sm:inline">|</span>}
              <a
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group bg-white/5 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-full sm:rounded-none border border-white/5 sm:border-none"
              >
                {/* Simple Icon Mapping */}
                {social.icon === 'github' && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                )}
                {social.icon === 'linkedin' && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                )}
                {social.icon === 'twitter' && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                )}
                <span className="group-hover:underline decoration-teal-300/50 underline-offset-4 decoration-dashed">{social.name}</span>
              </a>
            </React.Fragment>
          ))}

          <span className="text-gray-700 hidden sm:inline">|</span>

          <a href="/about" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group bg-white/5 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-full sm:rounded-none border border-white/5 sm:border-none">
            <span className="group-hover:underline decoration-teal-300/50 underline-offset-4 decoration-dashed">More about me</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>

        {/* Work History */}
        <div className="mt-16 pt-8 flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 font-mono text-sm text-gray-500 border-t border-glass-border">
          {displayExperiences.map((exp, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-gray-700">/</span>}
              <div
                className="group relative flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveExpIndex(activeExpIndex === i ? null : i);
                }}
              >
                {/* Active Popover */}
                {activeExpIndex === i && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[320px] p-5 rounded-2xl bg-[#0f1016] border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] z-50 animate-in fade-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header: Logo + Info + Close */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 p-0.5 overflow-hidden border border-white/10">
                          <img
                            src={exp.logoUrl || ''}
                            alt={exp.company}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-base leading-tight">{exp.company}</h3>
                          <p className="text-gray-400 text-xs font-mono mt-0.5">{exp.role}</p>
                          {exp.companyDescription && (
                            <p className="text-teal-400 text-xs font-mono mt-1 italic opacity-80">{exp.companyDescription}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveExpIndex(null);
                        }}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Body: Description */}
                    {exp.details && (
                      <p className="text-sm text-gray-300 leading-relaxed mb-4">
                        {exp.details}
                      </p>
                    )}

                    {/* Footer: Date & Link */}
                    <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {exp.startDate} - {exp.endDate || 'Present'}
                        </span>
                      </div>

                      {exp.url && (
                        <a
                          href={exp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm font-bold transition-colors w-fit"
                          onClick={(e) => e.stopPropagation()} // Allow default navigation
                        >
                          Visit Website
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>

                    {/* Arrow Triangle */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-8 border-transparent border-t-[#0f1016]"></div>
                  </div>
                )}

                <div className={`w-6 h-6 rounded-full bg-white/5 p-0.5 overflow-hidden border transition-colors ${activeExpIndex === i ? 'border-teal-300' : 'border-white/10 group-hover:border-teal-300/50'}`}>
                  <img
                    src={exp.logoUrl || ''}
                    alt={exp.company}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100"
                  />
                </div>
                <span className={`font-bold ${activeExpIndex === i ? 'text-white' : ''}`}>{exp.company}</span>
                {exp.endDate ? (
                  <span className="text-xs text-gray-600 group-hover:text-gray-500 transition-colors">(Past)</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-300/10 text-teal-300 border border-teal-300/20">Current</span>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
