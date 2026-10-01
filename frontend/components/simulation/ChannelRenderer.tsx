"use client";
import React, { useState } from 'react';
import { 
  Phone, Play, Pause, Volume2, MessageSquare, QrCode, 
  Shield, AlertTriangle, Lock, Key, HardDrive, Mail, 
  Smartphone, ExternalLink, Battery, Wifi, MapPin, Laptop, Clock, FileText, CheckCircle2
} from 'lucide-react';

export interface ScenarioData {
  situation_title?: string;
  situation_tagline?: string;
  sender_name?: string;
  sender_email?: string;
  subject?: string;
  body?: string;
  choices?: string[];
  threat_type?: string;
  difficulty?: string;
  channel?: string;
  channel_data?: any;
}

interface ChannelRendererProps {
  scenario: ScenarioData;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. VOICE & VISHING SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
export function VoiceSimulation({ scenario }: { scenario: ScenarioData }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const cd = scenario.channel_data || {};
  const callerName = cd.claimed_identity || scenario.sender_name || "Unknown Caller";
  const callerId = cd.caller_id || scenario.sender_email || "+1 (800) 555-0194 ext. 4421";
  const duration = cd.call_duration || "0:48";
  const transcript = cd.voicemail_transcript || scenario.body || "";
  const urgencyCue = cd.urgency_cue || "Voice urgency pressuring dual-control bypass.";

  return (
    <div 
      className="w-full rounded-2xl overflow-hidden text-left font-sans transition-all duration-300"
      style={{
        background: 'rgba(17, 24, 33, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(16px)'
      }}
    >
      {/* Phone Call Status Bar */}
      <div 
        className="px-6 py-3.5 flex items-center justify-between"
        style={{
          background: 'rgba(11, 15, 20, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#F87171' }}></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#EF4444' }}></span>
          </span>
          <span 
            className="text-[11px] font-mono font-semibold tracking-wider uppercase"
            style={{ color: '#F87171' }}
          >
            VOICE INTERCEPT · SECURE TELEPHONY ARCHIVE
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
          <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(165, 184, 255, 0.9)' }} />
          <span>RECORDED CALL · {duration}</span>
        </div>
      </div>

      {/* Caller Details & Player Card */}
      <div 
        className="px-6 py-5"
        style={{
          background: 'rgba(17, 24, 33, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#F87171',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.1)'
              }}
            >
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-primary">{callerName}</p>
                <span 
                  className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase"
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#FBBF24'
                  }}
                >
                  UNVERIFIED CALLER ID
                </span>
              </div>
              <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(165, 184, 255, 0.9)' }}>{callerId}</p>
              <p className="text-[11px]" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>Claimed: Executive Authorization / Urgent Operations</p>
            </div>
          </div>

          {/* Compact Voicemail Audio Player Bar */}
          <div 
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 min-w-[260px]"
            style={{
              background: 'rgba(11, 15, 20, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
            }}
          >
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
              style={{
                background: 'rgba(79, 124, 255, 0.18)',
                border: '1px solid rgba(79, 124, 255, 0.35)',
                color: '#FFFFFF',
                boxShadow: '0 0 16px rgba(79, 124, 255, 0.18)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(79, 124, 255, 0.28)';
                e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.5)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(79, 124, 255, 0.28)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(79, 124, 255, 0.18)';
                e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.35)';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(79, 124, 255, 0.18)';
              }}
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>

            {/* Visualizer bars */}
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] font-mono mb-1" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
                <span>{isPlaying ? "0:24" : "0:00"}</span>
                <span>{duration}</span>
              </div>
              <div className="flex items-center gap-1 h-4">
                {[14, 28, 45, 75, 32, 60, 90, 50, 65, 35, 80, 55, 30, 70, 40, 20, 50, 75, 30, 15].map((h, i) => (
                  <span 
                    key={i} 
                    className="w-1 rounded-full transition-all duration-300"
                    style={{ 
                      height: isPlaying ? `${Math.max(20, (h + (i % 3) * 15) % 100)}%` : `${Math.max(25, h * 0.5)}%`,
                      background: isPlaying ? 'rgba(79, 124, 255, 0.9)' : 'rgba(141, 152, 165, 0.25)',
                      boxShadow: isPlaying ? '0 0 6px rgba(79, 124, 255, 0.4)' : 'none'
                    }}
                  />
                ))}
              </div>
            </div>

            <Volume2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(141, 152, 165, 0.6)' }} />
          </div>
        </div>
      </div>

      {/* Speech-to-Text Transcript Section */}
      <div 
        className="px-6 py-5 space-y-3"
        style={{
          background: 'rgba(11, 15, 20, 0.5)'
        }}
      >
        <div 
          className="flex items-center justify-between pb-2"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
        >
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider uppercase" style={{ color: 'rgba(141, 152, 165, 0.85)' }}>
            <FileText className="w-3.5 h-3.5" style={{ color: 'rgba(165, 184, 255, 0.9)' }} />
            <span>AI Voicemail Transcript (98.6% Confidence)</span>
          </div>
          <span 
            className="text-[9px] font-mono px-2 py-0.5 rounded uppercase tracking-wider font-semibold"
            style={{
              background: 'rgba(79, 124, 255, 0.08)',
              border: '1px solid rgba(79, 124, 255, 0.18)',
              color: 'rgba(165, 184, 255, 0.85)'
            }}
          >
            AUTO-EXTRACTED
          </span>
        </div>

        <div 
          className="p-4 rounded-xl text-sm leading-relaxed font-mono"
          style={{
            background: 'rgba(11, 15, 20, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            color: 'rgba(240, 244, 248, 0.9)'
          }}
        >
          <p className="italic">&ldquo;{transcript.replace(/^\[.*?\]\s*/, '').replace(/^"|"$/g, '')}&rdquo;</p>
        </div>

        {/* Psychological / Pressure Telemetry */}
        <div 
          className="p-3.5 rounded-xl flex items-start gap-2.5"
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.22)'
          }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#FBBF24' }} />
          <div className="text-xs">
            <span className="font-semibold font-mono uppercase tracking-wide" style={{ color: '#FBBF24' }}>Urgency Vector: </span>
            <span className="text-primary/90">{urgencyCue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SLACK / MICROSOFT TEAMS CHAT SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
export function ChatSimulation({ scenario }: { scenario: ScenarioData }) {
  const cd = scenario.channel_data || {};
  const platform = cd.platform || "Slack";
  const channelOrDm = cd.channel_or_dm || "Direct Message";
  const senderName = scenario.sender_name || "Coworker";
  const senderHandle = cd.sender_handle || `@${senderName.toLowerCase().replace(/\s+/g, '.')}`;
  const messages = cd.messages || [
    {
      sender: senderName,
      time: "2:14 PM",
      text: scenario.body || "Hey, are you around? Need your quick review on this urgent item.",
      is_user: false
    }
  ];

  return (
    <div 
      className="w-full rounded-2xl overflow-hidden text-left font-sans transition-all duration-300"
      style={{
        background: 'rgba(17, 24, 33, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(16px)'
      }}
    >
      {/* Workspace Header Bar */}
      <div 
        className="px-6 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(11, 15, 20, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(79, 124, 255, 0.12)',
              border: '1px solid rgba(79, 124, 255, 0.25)',
              color: 'rgba(165, 184, 255, 0.95)'
            }}
          >
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary">{channelOrDm}</span>
              <span className="h-2 w-2 rounded-full" style={{ background: '#34D399', boxShadow: '0 0 6px #34D399' }}></span>
              <span className="text-[11px] font-mono" style={{ color: '#34D399' }}>Active Now</span>
            </div>
            <p className="text-xs font-mono" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>{platform} Workspace · NovaTech Internal</p>
          </div>
        </div>

        <div 
          className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            color: 'rgba(141, 152, 165, 0.65)'
          }}
        >
          <span>Search messages & files</span>
        </div>
      </div>

      {/* Message Feed Container */}
      <div 
        className="px-6 py-8 space-y-6"
        style={{ background: 'rgba(17, 24, 33, 0.45)' }}
      >
        {/* Date Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}></div>
          <span 
            className="absolute px-4 text-[11px] font-mono uppercase tracking-wider rounded-full"
            style={{
              background: 'rgba(11, 15, 20, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: 'rgba(141, 152, 165, 0.7)'
            }}
          >
            Today
          </span>
        </div>

        {/* Message Thread */}
        {messages.map((m: any, idx: number) => (
          <div key={idx} className="flex items-start gap-4 group">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(79, 124, 255, 0.25), rgba(96, 165, 250, 0.15))',
                border: '1px solid rgba(79, 124, 255, 0.3)',
                color: 'rgba(165, 184, 255, 0.95)'
              }}
            >
              {m.sender.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-sm font-bold text-primary">{m.sender}</span>
                <span className="text-xs font-mono" style={{ color: 'rgba(165, 184, 255, 0.85)' }}>{senderHandle}</span>
                <span className="text-[11px] font-mono" style={{ color: 'rgba(141, 152, 165, 0.6)' }}>{m.time || "2:14 PM"}</span>
              </div>

              {/* Message Bubble */}
              <div 
                className="text-sm leading-relaxed p-4 rounded-2xl space-y-3"
                style={{
                  background: 'rgba(11, 15, 20, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  color: 'rgba(240, 244, 248, 0.92)'
                }}
              >
                <p className="whitespace-pre-line">{m.text}</p>

                {/* Embedded Link / File Share Preview Card */}
                <div 
                  className="mt-3 p-3.5 rounded-xl flex items-start gap-3 transition-all duration-200"
                  style={{
                    background: 'rgba(239, 68, 68, 0.07)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
                  }}
                >
                  <div 
                    className="p-2 rounded-lg shrink-0 mt-0.5"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#F87171'
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-semibold truncate" style={{ color: '#F87171' }}>
                      https://novatech-auth-verify.internal-portal.net/login?token=x99a
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
                      Authentication Portal · Emergency System Re-verification
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Realistic Disabled Reply Box */}
      <div 
        className="px-6 py-4"
        style={{
          background: 'rgba(11, 15, 20, 0.85)',
          borderTop: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <div 
          className="p-3 rounded-xl flex items-center justify-between text-xs font-sans"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            color: 'rgba(141, 152, 165, 0.6)'
          }}
        >
          <span>Reply to {senderHandle}...</span>
          <div className="flex items-center gap-2">
            <span 
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(141, 152, 165, 0.6)'
              }}
            >
              Markdown enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. QR / QUISHING SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
export function QuishingSimulation({ scenario }: { scenario: ScenarioData }) {
  const cd = scenario.channel_data || {};
  const location = cd.context_location || "Found taped to 2nd-floor printer & breakroom bulletin";
  const headline = cd.poster_headline || scenario.subject || "Mandatory Workplace System Upgrade";
  const instructions = cd.instructions || scenario.body || "Scan the QR code below with your corporate camera to confirm active employment.";
  const targetUrl = cd.qr_target_url || "https://novatech-auth-portal.net/scan-verify";

  return (
    <div 
      className="w-full rounded-2xl overflow-hidden text-left font-sans transition-all duration-300"
      style={{
        background: 'rgba(17, 24, 33, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(16px)'
      }}
    >
      {/* Physical Bulletin Header */}
      <div 
        className="px-8 py-5 flex items-center justify-between"
        style={{
          background: 'rgba(11, 15, 20, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <div className="flex items-center gap-3">
          <span 
            className="p-1.5 rounded-lg"
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#FBBF24'
            }}
          >
            <QrCode className="w-4 h-4" />
          </span>
          <div>
            <span 
              className="text-xs font-mono font-semibold tracking-wider uppercase"
              style={{ color: '#FBBF24' }}
            >
              PHYSICAL ENVIRONMENT DISCOVERY · QUISHING NOTICE
            </span>
            <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
              <MapPin className="w-3 h-3" style={{ color: 'rgba(165, 184, 255, 0.9)' }} />
              <span>{location}</span>
            </p>
          </div>
        </div>
        <span 
          className="text-[11px] font-mono px-2.5 py-1 rounded"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            color: 'rgba(141, 152, 165, 0.75)'
          }}
        >
          PHYSICAL FLYER
        </span>
      </div>

      {/* Printed Notice Card */}
      <div 
        className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8"
        style={{ background: 'rgba(17, 24, 33, 0.45)' }}
      >
        {/* Scannable SVG QR Code Graphic */}
        <div 
          className="w-56 h-56 bg-white p-4 rounded-2xl flex flex-col items-center justify-center shrink-0"
          style={{
            border: '4px solid rgba(79, 124, 255, 0.25)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}
        >
          <svg className="w-full h-full text-black" viewBox="0 0 100 100" fill="currentColor">
            {/* Top-Left Finder */}
            <rect x="5" y="5" width="26" height="26" fill="black" rx="4" />
            <rect x="9" y="9" width="18" height="18" fill="white" rx="2" />
            <rect x="13" y="13" width="10" height="10" fill="black" rx="1" />

            {/* Top-Right Finder */}
            <rect x="69" y="5" width="26" height="26" fill="black" rx="4" />
            <rect x="73" y="9" width="18" height="18" fill="white" rx="2" />
            <rect x="77" y="13" width="10" height="10" fill="black" rx="1" />

            {/* Bottom-Left Finder */}
            <rect x="5" y="69" width="26" height="26" fill="black" rx="4" />
            <rect x="9" y="73" width="18" height="18" fill="white" rx="2" />
            <rect x="13" y="77" width="10" height="10" fill="black" rx="1" />

            {/* Grid Pattern Dots */}
            <rect x="36" y="8" width="6" height="6" />
            <rect x="46" y="8" width="6" height="6" />
            <rect x="56" y="14" width="6" height="6" />
            <rect x="36" y="20" width="6" height="6" />
            <rect x="48" y="22" width="6" height="6" />
            <rect x="10" y="38" width="6" height="6" />
            <rect x="22" y="38" width="6" height="6" />
            <rect x="34" y="38" width="6" height="6" />
            <rect x="46" y="38" width="6" height="6" />
            <rect x="58" y="38" width="6" height="6" />
            <rect x="70" y="38" width="6" height="6" />
            <rect x="82" y="38" width="6" height="6" />
            <rect x="38" y="48" width="6" height="6" />
            <rect x="48" y="48" width="6" height="6" />
            <rect x="62" y="48" width="6" height="6" />
            <rect x="76" y="54" width="6" height="6" />
            <rect x="36" y="62" width="6" height="6" />
            <rect x="48" y="68" width="6" height="6" />
            <rect x="60" y="62" width="6" height="6" />
            <rect x="72" y="70" width="6" height="6" />
            <rect x="84" y="62" width="6" height="6" />
            <rect x="36" y="78" width="6" height="6" />
            <rect x="50" y="82" width="6" height="6" />
            <rect x="64" y="78" width="6" height="6" />
            <rect x="78" y="84" width="6" height="6" />
          </svg>
          <span className="text-[10px] font-mono font-bold text-black tracking-widest mt-1 uppercase">
            SCAN TO AUTHENTICATE
          </span>
        </div>

        {/* Poster Content */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <span 
              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#F87171'
              }}
            >
              URGENT COMPLIANCE
            </span>
            <span className="text-xs font-mono" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>IT Security & Human Resources Notice</span>
          </div>

          <h3 className="text-xl font-bold text-primary leading-snug">
            {headline}
          </h3>

          <p className="text-sm leading-relaxed" style={{ color: 'rgba(240, 244, 248, 0.88)' }}>
            {instructions}
          </p>

          {/* Clue / Inspection Bar */}
          <div 
            className="p-4 rounded-xl space-y-2"
            style={{
              background: 'rgba(11, 15, 20, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span style={{ color: 'rgba(141, 152, 165, 0.75)' }}>Encoded QR Payload (Destination URL):</span>
              <span className="flex items-center gap-1 font-semibold" style={{ color: '#FBBF24' }}>
                <AlertTriangle className="w-3.5 h-3.5" /> External Domain
              </span>
            </div>
            <p 
              className="text-xs font-mono px-3 py-2 rounded-lg break-all"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: 'rgba(165, 184, 255, 0.95)'
              }}
            >
              {targetUrl}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CLOUD & OAUTH APP CONSENT SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
export function OAuthSimulation({ scenario }: { scenario: ScenarioData }) {
  const cd = scenario.channel_data || {};
  const appName = cd.app_name || scenario.sender_name || "CloudSync Office Suite 2026";
  const publisher = cd.publisher || "Unverified Third-Party Developer (cloudsync-portal.io)";
  const scopes = cd.requested_scopes || [
    "Read, update, and delete all corporate email messages",
    "Access corporate OneDrive / Google Drive files offline",
    "Maintain access to data you have given it permission to view"
  ];

  return (
    <div 
      className="w-full rounded-2xl overflow-hidden text-left font-sans transition-all duration-300"
      style={{
        background: 'rgba(17, 24, 33, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(16px)'
      }}
    >
      {/* Provider Header Bar */}
      <div 
        className="px-6 py-3.5 flex items-center justify-between"
        style={{
          background: 'rgba(11, 15, 20, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <div className="flex items-center gap-2.5">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(79, 124, 255, 0.12)',
              border: '1px solid rgba(79, 124, 255, 0.25)',
              color: 'rgba(165, 184, 255, 0.95)'
            }}
          >
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span 
              className="text-[11px] font-mono font-semibold tracking-wider uppercase"
              style={{ color: 'rgba(165, 184, 255, 0.9)' }}
            >
              NOVASYNC ENTERPRISE · SINGLE SIGN-ON DIRECTORY
            </span>
            <p className="text-[11px]" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>Connected Account: user@novatech.com</p>
          </div>
        </div>
        <span 
          className="text-[10px] font-mono px-2.5 py-0.5 rounded font-semibold uppercase tracking-wider"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#F87171'
          }}
        >
          UNTRUSTED OAUTH REQUEST
        </span>
      </div>

      {/* App Request Details */}
      <div 
        className="p-6 space-y-4"
        style={{ background: 'rgba(17, 24, 33, 0.5)' }}
      >
        <div className="flex items-start gap-3.5">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.15))',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#FBBF24'
            }}
          >
            <Key className="w-6 h-6" style={{ color: '#FBBF24' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <span>{appName}</span>
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
              Requests authorization to access corporate cloud drive and mailbox data
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-mono" style={{ color: '#F87171' }}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Publisher: {publisher}</span>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div 
          className="p-3.5 rounded-xl flex items-start gap-2.5"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)'
          }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#F87171' }} />
          <div className="text-xs space-y-0.5">
            <p className="font-bold uppercase font-mono text-[11px]" style={{ color: '#F87171' }}>
              Unverified Application Warning
            </p>
            <p style={{ color: 'rgba(240, 244, 248, 0.88)' }}>
              This application has not been certified by NovaTech IT Administrators. Authorizing it grants persistent offline access to corporate secrets.
            </p>
          </div>
        </div>

        {/* Requested Scopes */}
        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-wider font-semibold" style={{ color: 'rgba(141, 152, 165, 0.85)' }}>
            Requested Access Scopes:
          </p>
          <div className="space-y-1.5">
            {scopes.map((scope: string, i: number) => (
              <div 
                key={i} 
                className="px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3"
                style={{
                  background: 'rgba(11, 15, 20, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: '#F87171' }}></span>
                  <span className="text-xs font-medium truncate" style={{ color: 'rgba(240, 244, 248, 0.92)' }}>{scope}</span>
                </div>
                <span 
                  className="shrink-0 text-[9px] font-mono px-2 py-0.5 rounded font-semibold uppercase tracking-wider"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#F87171'
                  }}
                >
                  {i === 0 ? 'Mailbox Write' : i === 1 ? 'Offline Sync' : 'Token Access'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons Mock */}
      <div 
        className="px-6 py-3.5 flex items-center justify-between"
        style={{
          background: 'rgba(11, 15, 20, 0.85)',
          borderTop: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <span className="text-[11px] font-mono hidden sm:inline" style={{ color: 'rgba(141, 152, 165, 0.65)' }}>
          By granting consent, third-party servers receive persistent API access tokens.
        </span>
        <div className="flex items-center gap-2.5 ml-auto">
          <span 
            className="px-4 py-1.5 rounded-lg text-xs font-mono"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'rgba(141, 152, 165, 0.7)'
            }}
          >
            Deny Access
          </span>
          <span 
            className="px-4 py-1.5 rounded-lg text-xs font-mono font-semibold"
            style={{
              background: 'rgba(79, 124, 255, 0.15)',
              border: '1px solid rgba(79, 124, 255, 0.3)',
              color: 'rgba(165, 184, 255, 0.95)'
            }}
          >
            Grant Consent
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MFA FATIGUE & SMS PUSH SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
export function PushSimulation({ scenario }: { scenario: ScenarioData }) {
  const cd = scenario.channel_data || {};
  const serviceName = cd.service_name || "Okta Verify / Azure AD Authenticator";
  const notifCount = cd.notification_count || 14;
  const deviceInfo = cd.device_info || "Chrome 124 on Windows 11 (Unrecognized)";
  const locationInfo = cd.location_info || "St. Petersburg, Russia (IP: 185.220.101.4)";
  const smsPreview = cd.sms_preview || scenario.body || "14 repeated MFA push prompts received in 3 minutes.";

  return (
    <div 
      className="w-full max-w-md mx-auto rounded-[2.25rem] overflow-hidden text-left font-sans transition-all duration-300"
      style={{
        background: 'rgba(11, 15, 20, 0.92)',
        border: '2px solid rgba(79, 124, 255, 0.25)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Mobile Lock Screen Header */}
      <div 
        className="px-6 pt-5 pb-3 flex items-center justify-between text-xs font-mono"
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          color: 'rgba(141, 152, 165, 0.75)'
        }}
      >
        <span className="font-bold text-primary">14:32</span>
        <div className="flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-4 h-4" />
        </div>
      </div>

      {/* Phone Lock Screen Content */}
      <div className="p-6 space-y-4">
        <div className="text-center pb-2">
          <p className="text-3xl font-light text-primary tracking-tight">14:32</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>Thursday, October 24</p>
        </div>

        {/* High Urgency Notification Bombing Badge */}
        <div 
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-mono"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171'
          }}
        >
          <span className="flex items-center gap-2 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#F87171' }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#EF4444' }}></span>
            </span>
            MFA FATIGUE ATTACK DETECTED
          </span>
          <span className="font-bold">{notifCount} Alerts</span>
        </div>

        {/* Top Active Push Prompt Notification Card */}
        <div 
          className="p-4 rounded-2xl space-y-3 shadow-lg"
          style={{
            background: 'rgba(17, 24, 33, 0.85)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.08)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{
                  background: 'rgba(79, 124, 255, 0.15)',
                  color: 'rgba(165, 184, 255, 0.95)'
                }}
              >
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-primary">{serviceName}</span>
            </div>
            <span className="text-[10px] font-mono" style={{ color: 'rgba(141, 152, 165, 0.65)' }}>Just now</span>
          </div>

          <div>
            <p className="text-sm font-semibold text-primary">Sign-in Approval Requested</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>Did you just attempt to sign into NovaTech Global SSO?</p>
          </div>

          <div 
            className="p-3 rounded-xl space-y-1 text-xs font-mono"
            style={{
              background: 'rgba(11, 15, 20, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div className="flex items-center gap-2" style={{ color: '#F87171' }}>
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium truncate">{locationInfo}</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: 'rgba(141, 152, 165, 0.7)' }}>
              <Laptop className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{deviceInfo}</span>
            </div>
          </div>

          {/* Prompt Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div 
              className="py-2.5 px-3 rounded-xl text-xs font-bold text-center"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#F87171'
              }}
            >
              Deny (Report Fraud)
            </div>
            <div 
              className="py-2.5 px-3 rounded-xl text-xs font-bold text-center"
              style={{
                background: 'rgba(79, 124, 255, 0.15)',
                border: '1px solid rgba(79, 124, 255, 0.35)',
                color: 'rgba(165, 184, 255, 0.95)'
              }}
            >
              Approve (Number Match)
            </div>
          </div>
        </div>

        {/* Secondary Stacked SMS Warning */}
        <div 
          className="p-4 rounded-2xl space-y-1.5 opacity-80"
          style={{
            background: 'rgba(17, 24, 33, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.07)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" style={{ color: 'rgba(165, 184, 255, 0.9)' }} />
              <span className="text-xs font-bold text-primary">Messages</span>
            </div>
            <span className="text-[10px] font-mono" style={{ color: 'rgba(141, 152, 165, 0.65)' }}>1m ago</span>
          </div>
          <p className="text-xs font-mono line-clamp-2" style={{ color: 'rgba(240, 244, 248, 0.85)' }}>
            {smsPreview}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PHYSICAL MEDIA / USB DROP SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
export function PhysicalSimulation({ scenario }: { scenario: ScenarioData }) {
  const cd = scenario.channel_data || {};
  const mediaType = cd.media_type || "Kingston 32GB DataTraveler Flash Drive";
  const discoveryLocation = cd.discovery_location || "Found on conference room desk next to visitor badges";
  const physicalLabel = cd.physical_label || "CONFIDENTIAL - FY26 EXECUTIVE COMPENSATION & AUDIT.xlsx";
  const autorunPrompt = cd.autorun_prompt || "Removable Drive (E:) — Run Executive_Review.exe";

  return (
    <div 
      className="w-full rounded-2xl overflow-hidden text-left font-sans transition-all duration-300"
      style={{
        background: 'rgba(17, 24, 33, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(16px)'
      }}
    >
      {/* Incident Header */}
      <div 
        className="px-8 py-5 flex items-center justify-between"
        style={{
          background: 'rgba(11, 15, 20, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-1.5 rounded-lg"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#F87171'
            }}
          >
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <span 
              className="text-xs font-mono font-semibold tracking-wider uppercase"
              style={{ color: '#F87171' }}
            >
              PHYSICAL INCIDENT DISCOVERY · UNTRUSTED PERIPHERAL
            </span>
            <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
              <MapPin className="w-3 h-3" style={{ color: 'rgba(165, 184, 255, 0.9)' }} />
              <span>{discoveryLocation}</span>
            </p>
          </div>
        </div>
        <span 
          className="text-[11px] font-mono px-2.5 py-1 rounded uppercase tracking-wider"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            color: 'rgba(141, 152, 165, 0.75)'
          }}
        >
          INCIDENT #PS-2026-09
        </span>
      </div>

      {/* Discovery Visual Container */}
      <div 
        className="p-8 md:p-10 space-y-8"
        style={{ background: 'rgba(17, 24, 33, 0.45)' }}
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Stylized USB Flash Drive Card */}
          <div 
            className="w-full md:w-72 p-6 rounded-2xl flex flex-col items-center justify-center relative"
            style={{
              background: 'rgba(11, 15, 20, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div 
              className="w-16 h-10 rounded-t-md flex items-center justify-center text-[10px] font-mono"
              style={{
                background: 'rgba(79, 124, 255, 0.15)',
                border: '1px solid rgba(79, 124, 255, 0.3)',
                color: 'rgba(165, 184, 255, 0.8)'
              }}
            >
              USB 3.1
            </div>
            <div 
              className="w-28 h-40 rounded-b-xl p-3 flex flex-col justify-between items-center relative shadow-2xl"
              style={{
                background: 'linear-gradient(180deg, #1A2332 0%, #0B1017 100%)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: '#60A5FA', boxShadow: '0 0 8px #60A5FA' }}></span>
              {/* Handwritten Tape Label */}
              <div 
                className="w-full text-black px-2 py-1.5 rounded transform -rotate-3 shadow text-center"
                style={{
                  background: 'rgba(253, 230, 138, 0.95)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}
              >
                <p className="text-[9px] font-bold font-mono tracking-tight leading-tight">
                  {physicalLabel.slice(0, 36)}
                </p>
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'rgba(141, 152, 165, 0.7)' }}>32 GB</span>
            </div>
            <p className="text-xs font-mono mt-4 text-center font-semibold" style={{ color: 'rgba(165, 184, 255, 0.9)' }}>{mediaType}</p>
          </div>

          {/* Incident Description & Workstation Auto-Run Modal */}
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider font-semibold" style={{ color: 'rgba(141, 152, 165, 0.8)' }}>Incident Narrative:</span>
              <p className="text-sm leading-relaxed mt-1 font-medium text-primary/90">
                {scenario.body || "A branded high-capacity USB drive was discovered in an executive briefing room. The exterior features a handwritten label suggesting confidential compensation data."}
              </p>
            </div>

            {/* Auto-Run Workstation System Prompt */}
            <div 
              className="p-5 rounded-2xl space-y-3"
              style={{
                background: 'rgba(11, 15, 20, 0.85)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.06)'
              }}
            >
              <div 
                className="flex items-center justify-between text-xs font-mono pb-2"
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: 'rgba(141, 152, 165, 0.75)' }}
              >
                <span className="font-bold flex items-center gap-1.5" style={{ color: '#F87171' }}>
                  <AlertTriangle className="w-3.5 h-3.5" /> Workstation Auto-Run Dialogue
                </span>
                <span>Drive (E:)</span>
              </div>
              <p className="text-sm font-semibold text-primary">
                Choose what to do with this removable drive:
              </p>
              <div 
                className="p-3 rounded-xl flex items-center justify-between text-xs font-mono"
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                <span className="font-semibold" style={{ color: '#F87171' }}>{autorunPrompt}</span>
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#F87171'
                  }}
                >
                  SUSPICIOUS EXECUTABLE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. EMAIL SIMULATION (WEBMAIL CLIENT)
// ─────────────────────────────────────────────────────────────────────────────
export function EmailSimulation({ scenario }: { scenario: ScenarioData }) {
  const senderName = scenario.sender_name || "Executive Office";
  const senderEmail = scenario.sender_email || "billing@novatech-corp.net";
  const subject = scenario.subject || "Security Notification";
  const bodyParagraphs = (scenario.body || "").split('\n').filter(p => p.trim().length > 0);

  return (
    <div 
      className="w-full rounded-2xl overflow-hidden text-left font-sans transition-all duration-300"
      style={{
        background: 'rgba(17, 24, 33, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(16px)'
      }}
    >
      {/* Webmail Toolbar */}
      <div 
        className="px-8 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(11, 15, 20, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(79, 124, 255, 0.12)',
              border: '1px solid rgba(79, 124, 255, 0.25)',
              color: 'rgba(165, 184, 255, 0.95)'
            }}
          >
            <Mail className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-semibold tracking-wider uppercase" style={{ color: 'rgba(141, 152, 165, 0.85)' }}>
            ENTERPRISE DESKTOP WEBMAIL · INBOX
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wider"
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#FBBF24'
            }}
          >
            EXTERNAL SENDER
          </span>
        </div>
      </div>

      {/* Email Header */}
      <div 
        className="px-8 py-6 space-y-3"
        style={{
          background: 'rgba(17, 24, 33, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        <div className="flex gap-4">
          <span className="text-sm w-16 shrink-0 font-mono" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>From</span>
          <div>
            <p className="text-base font-semibold text-primary">{senderName}</p>
            <p className="text-sm font-mono mt-0.5" style={{ color: 'rgba(165, 184, 255, 0.9)' }}>&lt;{senderEmail}&gt;</p>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="text-sm w-16 shrink-0 font-mono" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>Subject</span>
          <p className="text-base font-medium text-primary">{subject}</p>
        </div>
      </div>
      
      {/* Email Body */}
      <div 
        className="px-8 py-10 text-base leading-relaxed font-medium space-y-4"
        style={{
          background: 'rgba(11, 15, 20, 0.55)',
          color: 'rgba(240, 244, 248, 0.92)'
        }}
      >
        {bodyParagraphs.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CHANNEL RENDERER DISPATCHER
// ─────────────────────────────────────────────────────────────────────────────
export default function ChannelRenderer({ scenario }: ChannelRendererProps) {
  const channel = scenario.channel || 'email';

  switch (channel) {
    case 'voice_phone':
      return <VoiceSimulation scenario={scenario} />;
    case 'slack_teams':
      return <ChatSimulation scenario={scenario} />;
    case 'qr_code':
      return <QuishingSimulation scenario={scenario} />;
    case 'cloud_oauth':
      return <OAuthSimulation scenario={scenario} />;
    case 'sms_push':
      return <PushSimulation scenario={scenario} />;
    case 'physical_media':
      return <PhysicalSimulation scenario={scenario} />;
    case 'email':
    default:
      return <EmailSimulation scenario={scenario} />;
  }
}
