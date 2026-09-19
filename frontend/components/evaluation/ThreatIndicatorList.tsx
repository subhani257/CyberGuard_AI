"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, AlertTriangle, Key, Globe, Smartphone, 
  HardDrive, QrCode, Mail, Lock, Shield, CreditCard, 
  Clock, UserX, Paperclip, Truck, PhoneCall, Monitor, BellRing, Link2
} from 'lucide-react';
import type { NormalizedIndicator } from './types';

interface ThreatIndicatorListProps {
  indicators: NormalizedIndicator[];
  channel: string;
  hasMissedFlag?: boolean;
}

export const ThreatIndicatorList: React.FC<ThreatIndicatorListProps> = ({
  indicators,
  channel,
  hasMissedFlag = false
}) => {
  const sectionTitle = hasMissedFlag ? "WHAT YOU MISSED" : "SECURITY SIGNALS IN THIS SCENARIO";
  const sectionSub = hasMissedFlag 
    ? "Critical threat evidence not addressed in your decision" 
    : "Security evidence and deceptive indicators present in this challenge";

  // Helper to pick contextual icon across all threat types
  const getIndicatorIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('financial') || t.includes('wire') || t.includes('invoice') || t.includes('payment')) return CreditCard;
    if (t.includes('urgency') || t.includes('pressure') || t.includes('deadline')) return Clock;
    if (t.includes('authority') || t.includes('executive') || t.includes('impersonation') || t.includes('ceo')) return UserX;
    if (t.includes('mfa') || t.includes('push') || t.includes('bombing') || t.includes('fatigue')) return BellRing;
    if (t.includes('qr') || t.includes('quishing')) return QrCode;
    if (t.includes('supply') || t.includes('vendor') || t.includes('supplier')) return Truck;
    if (t.includes('vishing') || t.includes('call') || t.includes('voice')) return PhoneCall;
    if (t.includes('remote') || t.includes('anydesk') || t.includes('desktop')) return Monitor;
    if (t.includes('attachment') || t.includes('file') || t.includes('payload')) return Paperclip;
    if (t.includes('token') || t.includes('oauth') || t.includes('scope') || t.includes('consent') || t.includes('permission')) return Key;
    if (t.includes('domain') || t.includes('spoof') || t.includes('lookalike')) return Globe;
    if (t.includes('url') || t.includes('link') || t.includes('phishing')) return Link2;
    if (t.includes('usb') || t.includes('hardware') || t.includes('drive')) return HardDrive;
    if (t.includes('email') || t.includes('sender')) return Mail;
    if (t.includes('lock') || t.includes('auth')) return Lock;
    return AlertTriangle;
  };

  return (
    <div 
      className="rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col h-full transition-all duration-300"
      style={{
        background: 'rgba(17, 24, 33, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(16px)'
      }}
    >
      {/* Section Header */}
      <div 
        className="flex items-center justify-between gap-3 mb-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}
      >
        <div>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#F87171' }}></span>
            {sectionTitle}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
            {sectionSub}
          </p>
        </div>

        <span 
          className="text-[10px] font-mono px-2.5 py-0.5 rounded shrink-0 uppercase tracking-wider font-semibold"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            color: 'rgba(141, 152, 165, 0.8)'
          }}
        >
          {indicators.length} {indicators.length === 1 ? 'SIGNAL' : 'SIGNALS'}
        </span>
      </div>

      {/* Indicator List Rows */}
      {indicators.length === 0 ? (
        <div 
          className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed"
          style={{
            background: 'rgba(11, 15, 20, 0.5)',
            borderColor: 'rgba(255, 255, 255, 0.08)'
          }}
        >
          <Shield className="w-8 h-8 mb-2" style={{ color: 'rgba(141, 152, 165, 0.5)' }} />
          <p className="text-xs font-medium max-w-sm" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
            No specific technical threat indicators were flagged by the evaluation engine for this scenario.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1">
          {indicators.map((indicator, idx) => {
            const Icon = getIndicatorIcon(indicator.type);
            const hasConfidence = typeof indicator.confidence === 'number' && !isNaN(indicator.confidence);

            return (
              <div 
                key={indicator.id || idx}
                className="p-3.5 sm:p-4 rounded-xl flex items-start gap-3.5 transition-all duration-200 group"
                style={{
                  background: 'rgba(11, 15, 20, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.background = 'rgba(11, 15, 20, 0.9)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.background = 'rgba(11, 15, 20, 0.75)';
                }}
              >
                {/* Icon */}
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#F87171'
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="text-xs font-bold text-primary font-mono tracking-tight truncate">
                      {indicator.title}
                    </h3>

                    {/* Real Confidence percentage */}
                    {hasConfidence && (
                      <span className="text-[10px] font-mono font-semibold shrink-0" style={{ color: '#F87171' }}>
                        {indicator.confidence}% CONFIDENCE
                      </span>
                    )}
                  </div>

                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(141, 152, 165, 0.85)' }}>
                    {indicator.description}
                  </p>

                  {/* Confidence Bar */}
                  {hasConfidence && (
                    <div 
                      className="mt-2.5 w-full h-1 rounded-full overflow-hidden"
                      style={{ background: 'rgba(239, 68, 68, 0.12)' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.6), rgba(248, 113, 113, 0.95))' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${indicator.confidence}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThreatIndicatorList;
