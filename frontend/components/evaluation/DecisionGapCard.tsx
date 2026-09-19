"use client";
import React, { useState } from 'react';
import { ArrowDown, Check, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import type { DecisionGapData } from './types';

interface DecisionGapCardProps {
  data: DecisionGapData;
}

export const DecisionGapCard: React.FC<DecisionGapCardProps> = ({ data }) => {
  const { userAction, expectedAction, isUserActionSafe, policyRuleText, policyCode } = data;
  const [showPolicy, setShowPolicy] = useState(false);

  return (
    <div 
      className="rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col h-full justify-between transition-all duration-300"
      style={{
        background: 'rgba(17, 24, 33, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(16px)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between gap-3 mb-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}
      >
        <div>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-primary flex items-center gap-2">
            <span 
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: isUserActionSafe ? '#34D399' : '#FBBF24' }}
            ></span>
            DECISION GAP
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
            Comparison between your choice and recommended defense
          </p>
        </div>

        {policyRuleText && (
          <button
            onClick={() => setShowPolicy(!showPolicy)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-200"
            style={{
              background: 'rgba(79, 124, 255, 0.08)',
              border: '1px solid rgba(79, 124, 255, 0.2)',
              color: 'rgba(165, 184, 255, 0.85)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(79, 124, 255, 0.16)';
              e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.35)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(79, 124, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.2)';
              e.currentTarget.style.color = 'rgba(165, 184, 255, 0.85)';
            }}
            aria-expanded={showPolicy}
            aria-controls="policy-rule-content"
          >
            <FileText className="w-3 h-3" />
            <span>VIEW POLICY</span>
            {showPolicy ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Two Blocks with Vertical Connector */}
      <div className="space-y-3 flex-1 flex flex-col justify-center">
        {/* Upper Block: YOUR ACTION */}
        <div 
          className="p-4 rounded-xl transition-colors"
          style={isUserActionSafe
            ? {
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }
            : {
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }
          }
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span 
              className="text-[10px] font-mono font-bold tracking-wider uppercase"
              style={{ color: isUserActionSafe ? '#34D399' : '#F87171' }}
            >
              YOUR ACTION
            </span>
            <span 
              className="text-[10px] font-mono uppercase font-semibold"
              style={{ color: isUserActionSafe ? '#34D399' : '#F87171' }}
            >
              {isUserActionSafe ? 'Secured' : 'Exposed'}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-primary leading-relaxed">
            {userAction || 'No action recorded'}
          </p>
        </div>

        {/* Vertical Transition Connector */}
        <div className="flex items-center justify-center gap-2" style={{ color: 'rgba(141, 152, 165, 0.6)' }}>
          <span className="h-3 w-px bg-white/10"></span>
          <div 
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono"
            style={{
              background: 'rgba(11, 15, 20, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {isUserActionSafe ? (
              <>
                <Check className="w-3 h-3" style={{ color: '#34D399' }} />
                <span style={{ color: '#34D399' }}>Aligned Action</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-3 h-3" style={{ color: '#FBBF24' }} />
                <span style={{ color: 'rgba(141, 152, 165, 0.8)' }}>Safer Response</span>
              </>
            )}
          </div>
          <span className="h-3 w-px bg-white/10"></span>
        </div>

        {/* Lower Block: RECOMMENDED ACTION */}
        <div 
          className="p-4 rounded-xl"
          style={{
            background: 'rgba(79, 124, 255, 0.08)',
            border: '1px solid rgba(79, 124, 255, 0.22)'
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span 
              className="text-[10px] font-mono font-bold tracking-wider uppercase"
              style={{ color: 'rgba(165, 184, 255, 0.95)' }}
            >
              RECOMMENDED ACTION
            </span>
            <span 
              className="text-[10px] font-mono uppercase font-semibold"
              style={{ color: 'rgba(165, 184, 255, 0.8)' }}
            >
              Corporate SOP
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-primary leading-relaxed">
            {expectedAction || 'Verify identity through alternate channel before authorizing'}
          </p>
        </div>
      </div>

      {/* Expandable Organizational Policy Rule */}
      {showPolicy && policyRuleText && (
        <div 
          id="policy-rule-content"
          className="mt-3 p-3.5 rounded-xl text-xs space-y-1.5"
          style={{
            background: 'rgba(11, 15, 20, 0.85)',
            border: '1px solid rgba(79, 124, 255, 0.25)'
          }}
        >
          <div className="flex items-center justify-between font-mono text-[10px] uppercase font-bold" style={{ color: 'rgba(165, 184, 255, 0.95)' }}>
            <span>ORGANIZATIONAL SECURITY RULE</span>
            {policyCode && <span>{policyCode}</span>}
          </div>
          <p className="text-primary/90 leading-relaxed font-sans text-xs">
            {policyRuleText}
          </p>
        </div>
      )}
    </div>
  );
};

export default DecisionGapCard;
