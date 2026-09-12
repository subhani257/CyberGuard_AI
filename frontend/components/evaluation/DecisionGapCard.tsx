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
    <div className="bg-[#111A24] border border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col h-full justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1E293B]/70">
        <div>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-primary flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isUserActionSafe ? 'bg-teal' : 'bg-amber'}`}></span>
            DECISION GAP
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Comparison between your choice and the recommended defense
          </p>
        </div>

        {policyRuleText && (
          <button
            onClick={() => setShowPolicy(!showPolicy)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface border border-cyan/30 text-cyan hover:bg-cyan/10 text-xs font-mono transition-colors"
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
        <div className={`p-4 rounded-xl border transition-colors ${
          isUserActionSafe
            ? 'bg-teal/10 border-teal/30'
            : 'bg-coral/10 border-coral/30'
        }`}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
              isUserActionSafe ? 'text-teal' : 'text-coral'
            }`}>
              YOUR ACTION
            </span>
            <span className={`text-[10px] font-mono uppercase ${
              isUserActionSafe ? 'text-teal/80' : 'text-coral/80'
            }`}>
              {isUserActionSafe ? 'Secured' : 'Exposed'}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-primary leading-relaxed">
            {userAction || 'No action recorded'}
          </p>
        </div>

        {/* Vertical Transition Connector */}
        <div className="flex items-center justify-center gap-2 text-muted">
          <span className="h-3 w-px bg-[#1E293B]"></span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface border border-[#1E293B] text-[10px] font-mono">
            {isUserActionSafe ? (
              <>
                <Check className="w-3 h-3 text-teal" />
                <span className="text-teal">Aligned Action</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-3 h-3 text-amber" />
                <span className="text-muted">Safer Response</span>
              </>
            )}
          </div>
          <span className="h-3 w-px bg-[#1E293B]"></span>
        </div>

        {/* Lower Block: RECOMMENDED ACTION */}
        <div className="p-4 rounded-xl bg-teal/10 border border-teal/30">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-teal">
              RECOMMENDED ACTION
            </span>
            <span className="text-[10px] font-mono text-teal/80 uppercase">
              Corporate SOP
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-primary leading-relaxed">
            {expectedAction || 'Verify identity through alternate channel before authorizing'}
          </p>
        </div>
      </div>

      {/* Expandable Organizational Policy Rule (Only rendered when genuine policy exists) */}
      {showPolicy && policyRuleText && (
        <div 
          id="policy-rule-content"
          className="mt-3 p-3.5 rounded-xl bg-cyan/5 border border-cyan/20 text-xs space-y-1.5"
        >
          <div className="flex items-center justify-between font-mono text-[10px] text-cyan uppercase font-bold">
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
