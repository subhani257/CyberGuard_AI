"use client";
import React, { useState } from 'react';
import { 
  Phone, Play, Pause, Volume2, MessageSquare, QrCode, 
  Shield, AlertTriangle, Lock, Key, HardDrive, Mail, 
  Smartphone, ExternalLink, CheckCircle2, XCircle, ArrowRight,
  Battery, Wifi, MapPin, Laptop, Clock, Info, FileText
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
    <div className="w-full bg-[#0E141D] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-[#1E293B] overflow-hidden text-left font-sans">
      {/* Phone Call Status Bar */}
      <div className="border-b border-[#1E293B] px-6 py-3.5 bg-[#080D12] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-coral"></span>
          </span>
          <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-coral">
            VOICE INTERCEPT · SECURE TELEPHONY ARCHIVE
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-muted">
          <Clock className="w-3.5 h-3.5 text-cyan" />
          <span>RECORDED CALL · {duration}</span>
        </div>
      </div>

      {/* Caller Details & Player Card */}
      <div className="px-6 py-5 bg-surface/70 border-b border-[#1E293B]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-coral/10 border border-coral/30 flex items-center justify-center text-coral shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-primary">{callerName}</p>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber/15 text-amber border border-amber/30">
                  UNVERIFIED CALLER ID
                </span>
              </div>
              <p className="text-xs font-mono text-cyan mt-0.5">{callerId}</p>
              <p className="text-[11px] text-muted">Claimed: Executive Authorization / Urgent Operations</p>
            </div>
          </div>

          {/* Compact Voicemail Audio Player Bar */}
          <div className="flex items-center gap-3 bg-[#080D12]/90 border border-[#1E293B] rounded-xl px-4 py-2.5 min-w-[260px]">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-full bg-blue hover:bg-blue/80 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shrink-0 shadow-[0_0_12px_rgba(79,124,255,0.4)]"
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>

            {/* Visualizer bars */}
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-muted mb-1">
                <span>{isPlaying ? "0:24" : "0:00"}</span>
                <span>{duration}</span>
              </div>
              <div className="flex items-center gap-1 h-4">
                {[14, 28, 45, 75, 32, 60, 90, 50, 65, 35, 80, 55, 30, 70, 40, 20, 50, 75, 30, 15].map((h, i) => (
                  <span 
                    key={i} 
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isPlaying ? 'bg-cyan animate-pulse' : 'bg-muted/30'
                    }`}
                    style={{ 
                      height: isPlaying ? `${Math.max(20, (h + (i % 3) * 15) % 100)}%` : `${Math.max(25, h * 0.5)}%` 
                    }}
                  />
                ))}
              </div>
            </div>

            <Volume2 className="w-3.5 h-3.5 text-muted shrink-0" />
          </div>
        </div>
      </div>

      {/* Speech-to-Text Transcript Section */}
      <div className="px-6 py-5 bg-[#080D12]/50 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-primary/5">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-muted uppercase">
            <FileText className="w-3.5 h-3.5 text-blue" />
            <span>AI Voicemail Transcript (98.6% Confidence)</span>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue/10 text-blue border border-blue/20">
            AUTO-EXTRACTED
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#111821]/80 border border-primary/5 text-sm leading-relaxed text-primary/90 font-mono">
          <p className="italic text-primary/80">&ldquo;{transcript.replace(/^\[.*?\]\s*/, '').replace(/^"|"$/g, '')}&rdquo;</p>
        </div>

        {/* Psychological / Pressure Telemetry */}
        <div className="p-3 rounded-lg bg-amber/5 border border-amber/20 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-amber font-mono uppercase tracking-wide">Urgency Vector: </span>
            <span className="text-primary/80">{urgencyCue}</span>
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
    <div className="w-full bg-[#121720] rounded-[1rem] shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-primary/10 overflow-hidden text-left font-sans">
      {/* Workspace Header Bar */}
      <div className="border-b border-primary/10 px-6 py-4 bg-[#0B0F14] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue/20 border border-blue/40 flex items-center justify-center text-blue">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary">{channelOrDm}</span>
              <span className="h-2 w-2 rounded-full bg-teal"></span>
              <span className="text-[11px] font-mono text-teal">Active Now</span>
            </div>
            <p className="text-xs text-muted font-mono">{platform} Workspace · NovaTech Internal</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted bg-surface px-3 py-1.5 rounded-lg border border-primary/5">
          <span>Search messages & files</span>
        </div>
      </div>

      {/* Message Feed Container */}
      <div className="px-6 py-8 bg-[#121720] space-y-6">
        {/* Date Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-primary/10 w-full"></div>
          <span className="absolute bg-[#121720] px-4 text-[11px] font-mono uppercase text-muted tracking-wider">
            Today
          </span>
        </div>

        {/* Message Thread */}
        {messages.map((m: any, idx: number) => (
          <div key={idx} className="flex items-start gap-4 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-coral/40 to-blue/40 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 shadow-sm">
              {m.sender.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-sm font-bold text-primary">{m.sender}</span>
                <span className="text-xs font-mono text-cyan">{senderHandle}</span>
                <span className="text-[11px] font-mono text-muted">{m.time || "2:14 PM"}</span>
              </div>

              {/* Message Bubble */}
              <div className="text-sm leading-relaxed text-primary/90 bg-surface/70 border border-primary/5 p-4 rounded-xl space-y-3">
                <p className="whitespace-pre-line">{m.text}</p>

                {/* Embedded Link / File Share Preview Card */}
                <div className="mt-3 p-3.5 rounded-lg bg-[#0B0F14] border border-coral/30 hover:border-coral transition-colors flex items-start gap-3">
                  <div className="p-2 rounded bg-coral/10 text-coral shrink-0 mt-0.5">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-semibold text-coral truncate">
                      https://novatech-auth-verify.internal-portal.net/login?token=x99a
                    </p>
                    <p className="text-xs text-muted mt-0.5">
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
      <div className="px-6 py-4 bg-[#0B0F14] border-t border-primary/10">
        <div className="p-3 bg-surface rounded-xl border border-primary/10 flex items-center justify-between text-muted text-xs font-sans">
          <span>Reply to {senderHandle}...</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/5">Markdown enabled</span>
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
    <div className="w-full bg-[#14171d] rounded-[1rem] shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-primary/10 overflow-hidden text-left font-sans">
      {/* Physical Bulletin Header */}
      <div className="border-b border-primary/10 px-8 py-5 bg-[#0e1218] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="p-1.5 rounded-md bg-amber/20 text-amber border border-amber/30">
            <QrCode className="w-4 h-4" />
          </span>
          <div>
            <span className="text-xs font-mono font-semibold tracking-wider text-amber uppercase">
              PHYSICAL ENVIRONMENT DISCOVERY · QUISHING NOTICE
            </span>
            <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-cyan" />
              <span>{location}</span>
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-surface border border-primary/10 text-muted">
          PHYSICAL FLYER
        </span>
      </div>

      {/* Printed Notice Card */}
      <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 bg-surface/50">
        {/* Scannable SVG QR Code Graphic */}
        <div className="w-56 h-56 bg-white p-4 rounded-2xl shadow-xl flex flex-col items-center justify-center shrink-0 border-4 border-[#1c2430]">
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
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-coral/20 text-coral border border-coral/30">
              URGENT COMPLIANCE
            </span>
            <span className="text-xs font-mono text-muted">IT Security & Human Resources Notice</span>
          </div>

          <h3 className="text-xl font-bold text-primary leading-snug">
            {headline}
          </h3>

          <p className="text-sm leading-relaxed text-primary/80">
            {instructions}
          </p>

          {/* Clue / Inspection Bar */}
          <div className="p-4 rounded-xl bg-background/80 border border-primary/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted">Encoded QR Payload (Destination URL):</span>
              <span className="text-amber flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> External Domain
              </span>
            </div>
            <p className="text-xs font-mono text-cyan bg-surface px-3 py-2 rounded-lg border border-primary/5 break-all">
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
    <div className="w-full bg-[#0E141D] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-[#1E293B] overflow-hidden text-left font-sans">
      {/* Provider Header Bar */}
      <div className="border-b border-[#1E293B] px-6 py-3.5 bg-[#080D12] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue/15 border border-blue/30 flex items-center justify-center text-blue">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-semibold tracking-wider text-cyan uppercase">
              NOVASYNC ENTERPRISE · SINGLE SIGN-ON DIRECTORY
            </span>
            <p className="text-[11px] text-muted">Connected Account: user@novatech.com</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-coral/15 text-coral border border-coral/30 font-semibold">
          UNTRUSTED OAUTH REQUEST
        </span>
      </div>

      {/* App Request Details */}
      <div className="p-6 bg-surface/70 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber/20 to-coral/20 border border-amber/30 flex items-center justify-center text-amber text-lg font-bold shrink-0">
            <Key className="w-6 h-6 text-amber" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <span>{appName}</span>
            </h3>
            <p className="text-xs text-muted mt-0.5">Requests authorization to access corporate cloud drive and mailbox data</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-mono text-coral">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Publisher: {publisher}</span>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-3.5 rounded-xl bg-coral/10 border border-coral/30 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
          <div className="text-xs text-primary/90 space-y-0.5">
            <p className="font-bold text-coral uppercase font-mono text-[11px]">Unverified Application Warning</p>
            <p className="text-[12px] text-primary/80">
              This application has not been certified by NovaTech IT Administrators. Authorizing it grants persistent offline access to corporate secrets.
            </p>
          </div>
        </div>

        {/* Requested Scopes */}
        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
            Requested Access Scopes:
          </p>
          <div className="space-y-1.5">
            {scopes.map((scope: string, i: number) => (
              <div key={i} className="px-3.5 py-2.5 rounded-lg bg-[#080D12]/90 border border-primary/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-coral shrink-0"></span>
                  <span className="text-xs font-medium text-primary/90 truncate">{scope}</span>
                </div>
                <span className="shrink-0 text-[9px] font-mono px-2 py-0.5 rounded bg-coral/10 text-coral border border-coral/20">
                  {i === 0 ? 'Mailbox Write' : i === 1 ? 'Offline Sync' : 'Token Access'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons Mock */}
      <div className="px-6 py-3.5 bg-[#080D12] border-t border-[#1E293B] flex items-center justify-between">
        <span className="text-[11px] text-muted font-mono hidden sm:inline">
          By granting consent, third-party servers receive persistent API access tokens.
        </span>
        <div className="flex items-center gap-2.5 ml-auto">
          <span className="px-4 py-1.5 rounded-lg bg-surface border border-primary/10 text-xs font-mono text-muted">
            Deny Access
          </span>
          <span className="px-4 py-1.5 rounded-lg bg-blue/20 border border-blue/30 text-xs font-mono text-blue font-semibold">
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
    <div className="w-full max-w-md mx-auto bg-[#0d1117] rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.7)] border-4 border-[#1e2633] overflow-hidden text-left font-sans">
      {/* Mobile Lock Screen Header */}
      <div className="px-6 pt-5 pb-3 bg-[#0d1117] flex items-center justify-between text-xs font-mono text-muted border-b border-primary/5">
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
          <p className="text-xs text-muted mt-0.5">Thursday, October 24</p>
        </div>

        {/* High Urgency Notification Bombing Badge */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-coral/15 border border-coral/30 text-coral text-xs font-mono">
          <span className="flex items-center gap-2 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-coral"></span>
            </span>
            MFA FATIGUE ATTACK DETECTED
          </span>
          <span className="font-bold">{notifCount} Alerts</span>
        </div>

        {/* Top Active Push Prompt Notification Card */}
        <div className="p-4 rounded-2xl bg-surface border border-coral/40 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue/20 flex items-center justify-center text-blue">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-primary">{serviceName}</span>
            </div>
            <span className="text-[10px] font-mono text-muted">Just now</span>
          </div>

          <div>
            <p className="text-sm font-semibold text-primary">Sign-in Approval Requested</p>
            <p className="text-xs text-muted mt-0.5">Did you just attempt to sign into NovaTech Global SSO?</p>
          </div>

          <div className="p-3 rounded-xl bg-background/80 border border-primary/5 space-y-1 text-xs font-mono">
            <div className="flex items-center gap-2 text-coral">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium truncate">{locationInfo}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Laptop className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{deviceInfo}</span>
            </div>
          </div>

          {/* Prompt Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="py-2.5 px-3 rounded-xl bg-coral/20 border border-coral/40 text-coral text-xs font-bold text-center">
              Deny (Report Fraud)
            </div>
            <div className="py-2.5 px-3 rounded-xl bg-blue/20 border border-blue/40 text-blue text-xs font-bold text-center">
              Approve (Number Match)
            </div>
          </div>
        </div>

        {/* Secondary Stacked SMS Warning */}
        <div className="p-4 rounded-2xl bg-surface/70 border border-primary/10 space-y-1.5 opacity-80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan" />
              <span className="text-xs font-bold text-primary">Messages</span>
            </div>
            <span className="text-[10px] font-mono text-muted">1m ago</span>
          </div>
          <p className="text-xs text-primary/80 font-mono line-clamp-2">
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
    <div className="w-full bg-[#121722] rounded-[1rem] shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-primary/10 overflow-hidden text-left font-sans">
      {/* Incident Header */}
      <div className="border-b border-primary/10 px-8 py-5 bg-[#0a0f16] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-coral/20 text-coral border border-coral/30">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-mono font-semibold tracking-wider text-coral uppercase">
              PHYSICAL INCIDENT DISCOVERY · UNTRUSTED PERIPHERAL
            </span>
            <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-cyan" />
              <span>{discoveryLocation}</span>
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-primary/10 text-muted">
          INCIDENT #PS-2026-09
        </span>
      </div>

      {/* Discovery Visual Container */}
      <div className="p-8 md:p-10 space-y-8 bg-surface/50">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Stylized USB Flash Drive Card */}
          <div className="w-full md:w-72 p-6 rounded-2xl bg-[#090d13] border-2 border-primary/15 flex flex-col items-center justify-center relative shadow-inner">
            <div className="w-16 h-10 border-2 border-primary/30 rounded-t-md bg-[#1a2332] flex items-center justify-center text-[10px] font-mono text-muted">
              USB 3.1
            </div>
            <div className="w-28 h-40 bg-gradient-to-b from-[#161f2d] to-[#0c121a] rounded-b-xl border-x-2 border-b-2 border-primary/30 p-3 flex flex-col justify-between items-center relative shadow-2xl">
              <span className="h-2 w-2 rounded-full bg-cyan animate-pulse"></span>
              {/* Handwritten Tape Label */}
              <div className="w-full bg-[#f6e05e]/90 text-black px-2 py-1.5 rounded transform -rotate-3 shadow text-center">
                <p className="text-[9px] font-bold font-mono tracking-tight leading-tight">
                  {physicalLabel.slice(0, 36)}
                </p>
              </div>
              <span className="text-[10px] font-mono text-muted tracking-widest uppercase">32 GB</span>
            </div>
            <p className="text-xs font-mono text-cyan mt-4 text-center font-semibold">{mediaType}</p>
          </div>

          {/* Incident Description & Workstation Auto-Run Modal */}
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">Incident Narrative:</span>
              <p className="text-sm leading-relaxed text-primary/90 mt-1 font-medium">
                {scenario.body || "A branded high-capacity USB drive was discovered in an executive briefing room. The exterior features a handwritten label suggesting confidential compensation data."}
              </p>
            </div>

            {/* Auto-Run Workstation System Prompt */}
            <div className="p-5 rounded-xl bg-background/90 border border-coral/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-muted pb-2 border-b border-primary/10">
                <span className="text-coral font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Workstation Auto-Run Dialogue
                </span>
                <span>Drive (E:)</span>
              </div>
              <p className="text-sm font-semibold text-primary">
                Choose what to do with this removable drive:
              </p>
              <div className="p-3 rounded-lg bg-surface border border-coral/20 flex items-center justify-between text-xs font-mono">
                <span className="text-coral font-semibold">{autorunPrompt}</span>
                <span className="px-2 py-0.5 rounded bg-coral/20 text-coral text-[10px]">SUSPICIOUS EXECUTABLE</span>
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
    <div className="w-full bg-surface rounded-[1rem] shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-primary/5 overflow-hidden text-left font-sans">
      {/* Webmail Toolbar */}
      <div className="border-b border-primary/10 px-8 py-4 bg-[#0e141c] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue/20 border border-blue/40 flex items-center justify-center text-blue">
            <Mail className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-semibold tracking-wider text-muted uppercase">
            ENTERPRISE DESKTOP WEBMAIL · INBOX
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-coral/15 text-coral border border-coral/30 font-semibold">
            EXTERNAL SENDER
          </span>
        </div>
      </div>

      {/* Email Header */}
      <div className="border-b border-primary/5 px-8 py-6 bg-surface/50 space-y-4">
        <div className="flex gap-4">
          <span className="text-sm text-muted w-16 shrink-0 font-mono">From</span>
          <div>
            <p className="text-base font-semibold text-primary">{senderName}</p>
            <p className="text-sm font-mono text-cyan">&lt;{senderEmail}&gt;</p>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="text-sm text-muted w-16 shrink-0 font-mono">Subject</span>
          <p className="text-base font-medium text-primary">{subject}</p>
        </div>
      </div>
      
      {/* Email Body */}
      <div className="px-8 py-10 text-base leading-relaxed text-primary/90 font-medium bg-background/50 space-y-4">
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
