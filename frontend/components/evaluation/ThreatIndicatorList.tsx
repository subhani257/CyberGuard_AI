"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, AlertTriangle, Key, Globe, Smartphone, 
  HardDrive, QrCode, Mail, Lock, Shield 
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
  // Title rule: only label "WHAT YOU MISSED" if the backend explicitly classified them as missed;
  // otherwise honestly label "SECURITY SIGNALS IN THIS SCENARIO"
  const sectionTitle = hasMissedFlag ? "WHAT YOU MISSED" : "SECURITY SIGNALS IN THIS SCENARIO";
  const sectionSub = hasMissedFlag 
    ? "Critical threat evidence not addressed in your decision" 
    : "Security evidence and deceptive indicators present in this challenge";

  // Helper to pick contextual icon
  const getIndicatorIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('domain') || t.includes('spoof') || t.includes('url')) return Globe;
    if (t.includes('token') || t.includes('oauth') || t.includes('scope') || t.includes('permission')) return Key;
    if (t.includes('mfa') || t.includes('push') || t.includes('phone')) return Smartphone;
    if (t.includes('qr')) return QrCode;
    if (t.includes('usb') || t.includes('hardware') || t.includes('drive')) return HardDrive;
    if (t.includes('email') || t.includes('sender')) return Mail;
    if (t.includes('lock') || t.includes('auth')) return Lock;
    return AlertTriangle;
  };

  return (
    <div className="bg-[#111A24] border border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col h-full">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1E293B]/70">
        <div>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-coral shrink-0"></span>
            {sectionTitle}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {sectionSub}
          </p>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-[#1E293B] text-muted shrink-0">
          {indicators.length} {indicators.length === 1 ? 'SIGNAL' : 'SIGNALS'}
        </span>
      </div>

      {/* Indicator List Rows */}
      {indicators.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface/40 rounded-xl border border-dashed border-[#1E293B]">
          <Shield className="w-8 h-8 text-muted/60 mb-2" />
          <p className="text-xs text-muted font-medium max-w-sm">
            No specific technical threat indicators were flagged by the evaluation engine for this scenario.
          </p>
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {indicators.map((indicator, idx) => {
            const Icon = getIndicatorIcon(indicator.type);
            const hasConfidence = typeof indicator.confidence === 'number' && !isNaN(indicator.confidence);

            return (
              <div 
                key={indicator.id || idx}
                className="p-3.5 sm:p-4 rounded-xl bg-surface/70 border border-[#1E293B] hover:border-coral/30 transition-colors flex items-start gap-3.5"
              >
                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-coral/10 border border-coral/20 text-coral flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="text-xs font-bold text-primary font-mono tracking-tight truncate">
                      {indicator.title}
                    </h3>

                    {/* Real Confidence percentage — only rendered when supplied by backend */}
                    {hasConfidence && (
                      <span className="text-[10px] font-mono text-coral font-semibold shrink-0">
                        {indicator.confidence}% CONFIDENCE
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted leading-relaxed">
                    {indicator.description}
                  </p>

                  {/* Confidence Bar — only rendered when supplied by backend */}
                  {hasConfidence && (
                    <div className="mt-2.5 w-full h-1 rounded-full bg-coral/15 overflow-hidden">
                      <motion.div
                        className="h-full bg-coral rounded-full"
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
