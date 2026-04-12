'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Globe, MapPin, Code2, Sparkles } from 'lucide-react';

function InstagramIcon({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function GithubIcon({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}
import Image from 'next/image';

interface OwnersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOCIALS = [
  {
    label: 'Github',
    handle: 'azrilgg',
    url: 'https://github.com/azrilgg',
    icon: GithubIcon,
    color: '#E2E8F0',
  },
  {
    label: 'Instagram',
    handle: '@azrielfzx',
    url: 'https://instagram.com/azrielfzx',
    icon: InstagramIcon,
    color: '#E879F9',
  },
  {
    label: 'WhatsApp',
    handle: 'Direct Secure Line',
    url: 'https://api.whatsapp.com/send?phone=6285280721275&text=Halo%20Azriel!%20Saya%20tertarik%20dengan%20portofolio%20Anda',
    icon: Smartphone,
    color: '#34D399',
  },
  {
    label: 'Portfolio',
    handle: 'ahmadazriel.vercel.app',
    url: 'https://ahmadazriel.vercel.app',
    icon: Globe,
    color: '#00F0FF',
  },
];

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modal: any = {
  hidden: { opacity: 0, scale: 0.92, y: 30, filter: 'blur(10px)' },
  visible: {
    opacity: 1, scale: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.19, 1, 0.22, 1] as any },
  },
  exit: {
    opacity: 0, scale: 0.95, y: 20, filter: 'blur(6px)',
    transition: { duration: 0.3 },
  },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.19, 1, 0.22, 1] as any } },
};

export default function OwnersModal({ isOpen, onClose }: OwnersModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border"
            style={{
              background: 'linear-gradient(180deg, rgba(10,10,18,0.98) 0%, rgba(6,6,11,0.99) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 80px rgba(0, 240, 255, 0.08), 0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl transition-all hover:bg-white/5"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <X size={18} />
            </button>

            {/* ═══ Top Glow Bar ═══ */}
            <div
              className="w-full h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #00F0FF, #8B5CF6, transparent)' }}
            />

            <motion.div className="p-6 sm:p-8" variants={stagger} initial="hidden" animate="visible">

              {/* ═══ Section A: Biometric Header ═══ */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-5 mb-8">
                {/* Avatar with God-Tier Effect */}
                <div className="relative shrink-0 group perspective-[1000px]">
                  <motion.div
                    whileHover={{ scale: 1.05, rotateY: 10, rotateX: -5 }}
                    transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                    className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden p-[3px] z-10"
                  >
                    {/* Rotating Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#00F0FF] via-[#8B5CF6] to-[#00F0FF] animate-[spin_4s_linear_infinite] opacity-80" />
                    <div className="absolute inset-0 bg-transparent blur-md group-hover:blur-xl transition-all duration-500 bg-gradient-to-tr from-[#00F0FF] via-[#8B5CF6] to-[#00F0FF] animate-[spin_4s_linear_infinite]" />
                    
                    {/* Inner Image Container */}
                    <div 
                      className="relative w-full h-full rounded-xl overflow-hidden bg-[#06060B] cursor-pointer"
                      onClick={() => window.open('https://ahmadazriel.vercel.app', '_blank', 'noopener,noreferrer')}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://ahmadazriel.vercel.app/image/riel.jpeg"
                        alt="Ahmad Azriel"
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-30 transition-all duration-500 scale-100 group-hover:scale-110"
                      />
                      {/* Inner Glass Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#06060B] opacity-60 mix-blend-overlay" />
                      
                      {/* Click Instruction FX Overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                        <Globe size={24} className="text-[#00F0FF] mb-2 animate-pulse shadow-[0_0_15px_rgba(0,240,255,0.8)] rounded-full" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#00F0FF] text-center px-1 text-shadow-glow">
                          Access Core
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* High-Tech Status Badge */}
                  <div
                    className="absolute -bottom-2 -right-2 z-20 flex items-center justify-center p-[2px] rounded-md backdrop-blur-md"
                    style={{ background: 'rgba(6, 6, 11, 0.8)', border: '1px solid rgba(52, 211, 153, 0.5)' }}
                  >
                    <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ background: 'rgba(52, 211, 153, 0.1)' }}>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                    </div>
                  </div>
                </div>

                {/* Identity Data */}
                <div className="text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <div
                      className="text-[8px] font-mono uppercase tracking-[0.3em] px-2 py-1 rounded-md"
                      style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', border: '1px solid rgba(139, 92, 246, 0.2)' }}
                    >
                      System Architect
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Ahmad <span className="text-gradient-cyan">Azriel</span>
                  </h2>

                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                      <Code2 size={10} className="opacity-60" />
                      Junior Software Engineering (RPL) Student
                    </p>
                    <p className="text-[10px] font-mono uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                      <MapPin size={10} className="opacity-60" />
                      Bogor, Indonesia [ID-BGR]
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* ═══ Divider ═══ */}
              <motion.div variants={fadeUp} className="w-full h-px mb-6" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />

              {/* ═══ Section B: Connection Matrix ═══ */}
              <motion.div variants={fadeUp}>
                <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  Connection Matrix
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
                  {SOCIALS.map((social, i) => (
                    <motion.a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div
                        className="p-2 rounded-lg transition-all"
                        style={{ background: `${social.color}10`, border: `1px solid ${social.color}20` }}
                      >
                        <social.icon size={14} style={{ color: social.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: social.color }}>
                          {social.label}
                        </p>
                        <p className="text-[9px] font-mono truncate" style={{ color: 'var(--text-tertiary)' }}>
                          {social.handle}
                        </p>
                      </div>
                      <div className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: social.color }}>→</div>
                    </motion.a>
                  ))}
                </div>
              </motion.div>

              {/* ═══ Section C: The Architect's Philosophy ═══ */}
              <motion.div variants={fadeUp}>
                <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  The Architect&apos;s Philosophy
                </p>
                <div
                  className="relative p-5 rounded-xl overflow-hidden"
                  style={{
                    background: 'rgba(139, 92, 246, 0.04)',
                    border: '1px solid rgba(139, 92, 246, 0.12)',
                  }}
                >
                  <Sparkles size={14} className="absolute top-4 right-4 opacity-30" style={{ color: '#8B5CF6' }} />
                  <blockquote className="text-sm sm:text-base font-mono italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    &ldquo;Design is the silence between the code. Performance is the soul of the interface.&rdquo;
                  </blockquote>
                  <p className="mt-3 text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: 'var(--text-tertiary)' }}>
                    — Ahmad Azriel, System Architect
                  </p>
                </div>
              </motion.div>

              {/* ═══ Mission Statement ═══ */}
              <motion.div variants={fadeUp} className="mt-6">
                <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  Mission Protocol
                </p>
                <div className="space-y-3">
                  {[
                    { tag: 'OBJECTIVE', text: 'Beyond mere website construction, I architect precision-engineered digital ecosystems. My objective is to merge high-tier visual aesthetics with uncompromising performance.' },
                    { tag: 'PROCESS', text: 'Every line of Next.js code is optimized for velocity. Every Framer Motion transition is calibrated for haptic satisfaction. Zenith OS stands as a testament that futuristic design can coexist with raw functionality.' },
                    { tag: 'GENERATION', text: 'A Gen-Z Engineer driven by a modern perspective, focused exclusively on bleeding-edge technologies and fluid user experiences.' },
                  ].map((item) => (
                    <div key={item.tag} className="group">
                      <div className="flex items-start gap-2">
                        <span
                          className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 shrink-0"
                          style={{ background: 'rgba(0,240,255,0.08)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,240,255,0.15)' }}
                        >
                          {item.tag}
                        </span>
                        <p className="text-[11px] sm:text-xs font-mono leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* ═══ Bottom Tech Signature ═══ */}
              <motion.div variants={fadeUp} className="mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: 'var(--text-tertiary)' }}>
                    System Online · v1.0
                  </span>
                </div>
                <span className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: 'var(--text-tertiary)' }}>
                  Cyber-Minimalism · Deep Glassmorphism
                </span>
              </motion.div>

            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
