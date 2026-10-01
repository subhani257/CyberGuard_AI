"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, BookOpen, ExternalLink, ShieldCheck, 
  ChevronDown, ChevronUp, Search, Info
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
    <div 
      className="rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col space-y-5 transition-all duration-300"
      style={{
        background: 'rgba(17, 24, 33, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(16px)'
      }}
    >
      {/* Header */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}
      >
        <div>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: 'rgba(79, 124, 255, 0.9)' }}></span>
            THREAT INTELLIGENCE & CITATIONS
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
            RAG knowledge retrieved from verified cybersecurity frameworks and MITRE/NIST corpus
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span 
            className="text-[10px] font-mono px-2.5 py-1 rounded font-semibold flex items-center gap-1.5 uppercase tracking-wider"
            style={{
              background: 'rgba(79, 124, 255, 0.1)',
              border: '1px solid rgba(79, 124, 255, 0.22)',
              color: 'rgba(165, 184, 255, 0.9)'
            }}
          >
            <Database className="w-3 h-3" />
            <span>{items.length} {items.length === 1 ? 'CITATION' : 'CITATIONS'}</span>
          </span>
          {clues.length > 0 && (
            <span 
              className="text-[10px] font-mono px-2.5 py-1 rounded font-semibold flex items-center gap-1.5 uppercase tracking-wider"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                color: 'rgba(141, 152, 165, 0.8)'
              }}
            >
              <Search className="w-3 h-3" />
              <span>{clues.length} CLUES</span>
            </span>
          )}
        </div>
      </div>

      {/* Embedded Scenario Clues (if present) */}
      {clues.length > 0 && (
        <div 
          className="p-3.5 rounded-xl space-y-2"
          style={{
            background: 'rgba(11, 15, 20, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase" style={{ color: 'rgba(165, 184, 255, 0.9)' }}>
            <Search className="w-3.5 h-3.5" />
            <span>Embedded Deception Artifacts in Scenario</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {clues.map((clue, idx) => (
              <span 
                key={`clue-${idx}`}
                className="text-xs font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                style={{
                  background: 'rgba(79, 124, 255, 0.08)',
                  border: '1px solid rgba(79, 124, 255, 0.2)',
                  color: 'rgba(240, 244, 248, 0.9)'
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'rgba(79, 124, 255, 0.9)' }}></span>
                <span>{clue}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Retrieved Threat Knowledge Cards */}
      {items.length > 0 ? (
        <div className="space-y-2.5">
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
                className="rounded-xl transition-all duration-200 overflow-hidden"
                style={isExpanded
                  ? {
                      background: 'rgba(11, 15, 20, 0.9)',
                      border: '1px solid rgba(79, 124, 255, 0.35)',
                      boxShadow: '0 0 20px rgba(79, 124, 255, 0.08)'
                    }
                  : {
                      background: 'rgba(11, 15, 20, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }
                }
              >
                {/* Card Header & Summary Bar */}
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="w-full p-3.5 sm:p-4 text-left flex items-start sm:items-center justify-between gap-3 focus:outline-none"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 sm:mt-0"
                      style={{
                        background: 'rgba(79, 124, 255, 0.12)',
                        border: '1px solid rgba(79, 124, 255, 0.25)',
                        color: 'rgba(165, 184, 255, 0.95)'
                      }}
                    >
                      <SourceIcon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span 
                          className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                          style={{
                            background: 'rgba(79, 124, 255, 0.1)',
                            border: '1px solid rgba(79, 124, 255, 0.22)',
                            color: 'rgba(165, 184, 255, 0.9)'
                          }}
                        >
                          {sourceBadge}
                        </span>

                        {item.category && (
                          <span className="text-[10px] font-mono uppercase" style={{ color: 'rgba(141, 152, 165, 0.65)' }}>
                            • {item.category.replace(/[_-]+/g, ' ')}
                          </span>
                        )}

                        {similarityPercent !== null && (
                          <span className="text-[10px] font-mono font-semibold" style={{ color: '#34D399' }}>
                            {similarityPercent}% RELEVANCE
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-primary line-clamp-1">
                        {item.content || 'Security guidance reference.'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2" style={{ color: 'rgba(141, 152, 165, 0.6)' }}>
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
                      className="px-4 py-3.5"
                      style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        background: 'rgba(8, 13, 18, 0.7)'
                      }}
                    >
                      <div className="space-y-3">
                        <p className="text-xs sm:text-sm text-primary/90 leading-relaxed font-sans whitespace-pre-line">
                          {item.content}
                        </p>

                        {/* Metadata Details if any */}
                        {item.metadata && Object.keys(item.metadata).length > 0 && (
                          <div className="pt-2 flex flex-wrap items-center gap-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            {Object.entries(item.metadata).map(([k, v]) => {
                              if (!v || typeof v === 'object') return null;
                              return (
                                <span 
                                  key={k} 
                                  className="text-[10px] font-mono px-2 py-0.5 rounded"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    color: 'rgba(141, 152, 165, 0.7)'
                                  }}
                                >
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
        <div 
          className="p-4 rounded-xl border border-dashed text-center"
          style={{
            background: 'rgba(11, 15, 20, 0.5)',
            borderColor: 'rgba(255, 255, 255, 0.08)'
          }}
        >
          <Info className="w-5 h-5 mx-auto mb-1.5" style={{ color: 'rgba(141, 152, 165, 0.6)' }} />
          <p className="text-xs" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
            Knowledge base cross-referencing matched standard baseline policies for this vector.
          </p>
        </div>
      )}
    </div>
  );
};

export default ThreatKnowledge;
