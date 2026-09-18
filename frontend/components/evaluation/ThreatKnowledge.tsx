"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, BookOpen, ExternalLink, ShieldCheck, 
  ChevronDown, ChevronUp, Search, Info, Award
} from 'lucide-react';
import type { ThreatKnowledgeItem } from './types';

interface ThreatKnowledgeProps {
  knowledge?: ThreatKnowledgeItem[] | null;
  scenarioClues?: string[] | null;
  channel?: string;
}

export const ThreatKnowledge: React.FC<ThreatKnowledgeProps> = ({
  knowledge = [],
  scenarioClues = [],
  channel = 'email'
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const items = Array.isArray(knowledge) ? knowledge : [];
  const clues = Array.isArray(scenarioClues) ? scenarioClues.filter(c => Boolean(c)) : [];

  if (items.length === 0 && clues.length === 0) {
    return null;
  }

  const formatSourceBadge = (source?: string) => {
    if (!source) return 'CYBERGUARD THREAT CORPUS';
    const s = source.toUpperCase();
    if (s.includes('NIST')) return 'NIST SP 800-63';
    if (s.includes('MITRE')) return 'MITRE ATT&CK';
    if (s.includes('CISA')) return 'CISA ADVISORY';
    if (s.includes('OWASP')) return 'OWASP TOP 10';
    if (s.includes('ISO')) return 'ISO/IEC 27001';
    return source.replace(/[_-]+/g, ' ').toUpperCase();
  };

  const getSourceIcon = (source?: string) => {
    const s = (source || '').toLowerCase();
    if (s.includes('nist') || s.includes('iso')) return ShieldCheck;
    if (s.includes('mitre') || s.includes('cisa')) return Database;
    return BookOpen;
  };

  return (
    <div className="bg-[#111A24] border border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]/70">
        <div>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue shrink-0 animate-pulse"></span>
            THREAT INTELLIGENCE & CITATIONS
          </h2>
          <p className="text-xs text-muted mt-0.5">
            RAG knowledge retrieved from verified cybersecurity frameworks and MITRE/NIST corpus
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-blue/10 border border-blue/30 text-blue font-semibold flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            <span>{items.length} {items.length === 1 ? 'CITATION' : 'CITATIONS'}</span>
          </span>
          {clues.length > 0 && (
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-cyan/10 border border-cyan/30 text-cyan font-semibold flex items-center gap-1.5">
              <Search className="w-3 h-3" />
              <span>{clues.length} EMBEDDED CLUES</span>
            </span>
          )}
        </div>
      </div>

      {/* Embedded Scenario Clues (if present) */}
      {clues.length > 0 && (
        <div className="p-3.5 rounded-xl bg-surface/60 border border-[#1E293B] space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-cyan">
            <Search className="w-3.5 h-3.5" />
            <span>Embedded Deception Artifacts in Scenario</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {clues.map((clue, idx) => (
              <span 
                key={`clue-${idx}`}
                className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#080D12] border border-cyan/25 text-primary/90 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan shrink-0"></span>
                <span>{clue}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Retrieved Threat Knowledge Cards */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            const SourceIcon = getSourceIcon(item.source);
            const sourceBadge = formatSourceBadge(item.source);
            const similarityPercent = typeof item.similarity === 'number' && !isNaN(item.similarity)
              ? Math.round(item.similarity * 100)
              : null;

            return (
              <div 
                key={`know-${idx}`}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isExpanded 
                    ? 'bg-surface border-blue/40 shadow-sm' 
                    : 'bg-surface/50 border-[#1E293B] hover:border-blue/30'
                }`}
              >
                {/* Card Header & Summary Bar */}
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="w-full p-3.5 sm:p-4 text-left flex items-start sm:items-center justify-between gap-3 focus:outline-none"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue/10 border border-blue/25 text-blue flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                      <SourceIcon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue/15 text-blue border border-blue/20">
                          {sourceBadge}
                        </span>

                        {item.category && (
                          <span className="text-[10px] font-mono text-muted uppercase">
                            • {item.category.replace(/[_-]+/g, ' ')}
                          </span>
                        )}

                        {similarityPercent !== null && (
                          <span className="text-[10px] font-mono text-teal font-semibold">
                            {similarityPercent}% RELEVANCE
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-primary line-clamp-1">
                        {item.content || 'Security guidance reference.'}
                      </p>
                    </div>
                  </div>

                  <div className="text-muted shrink-0 ml-2">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Expanded Full Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-[#1E293B]/70 px-4 py-3.5 bg-[#080D12]/60"
                    >
                      <div className="space-y-3">
                        <p className="text-xs sm:text-sm text-primary/90 leading-relaxed font-sans whitespace-pre-line">
                          {item.content}
                        </p>

                        {/* Metadata Details if any */}
                        {item.metadata && Object.keys(item.metadata).length > 0 && (
                          <div className="pt-2 border-t border-[#1E293B]/50 flex flex-wrap items-center gap-2">
                            {Object.entries(item.metadata).map(([k, v]) => {
                              if (!v || typeof v === 'object') return null;
                              return (
                                <span key={k} className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-[#1E293B] text-muted">
                                  <strong className="text-primary font-semibold">{k}:</strong> {String(v)}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-surface/40 border border-dashed border-[#1E293B] text-center">
          <Info className="w-5 h-5 text-muted mx-auto mb-1.5" />
          <p className="text-xs text-muted">
            Knowledge base cross-referencing matched standard baseline policies for this vector.
          </p>
        </div>
      )}
    </div>
  );
};

export default ThreatKnowledge;
