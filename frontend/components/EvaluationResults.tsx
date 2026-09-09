"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface ThreatIndicator {
    type: string;
    confidence: number;
    description: string;
}

interface EvaluationData {
    action_score: number;
    reasoning_score: number;
    final_score: number;
    threat_indicators: ThreatIndicator[];
    reasoning_category: string;
    expected_behavior: string;
    llm_evaluation?: {
        confidence: number;
        explanation: string;
    };
}

interface EvaluationResultsProps {
    evaluation: EvaluationData;
    userAction: string;
    userReasoning: string;
}

export const EvaluationResults: React.FC<EvaluationResultsProps> = ({ 
    evaluation, 
    userAction, 
    userReasoning 
}) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-teal';
        if (score >= 60) return 'text-blue';
        if (score >= 40) return 'text-amber';
        return 'text-red-500';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return 'bg-teal/10';
        if (score >= 60) return 'bg-blue/10';
        if (score >= 40) return 'bg-amber/10';
        return 'bg-red-500/10';
    };

    const getScoreBorderColor = (score: number) => {
        if (score >= 80) return 'border-teal/30';
        if (score >= 60) return 'border-blue/30';
        if (score >= 40) return 'border-amber/30';
        return 'border-red-500/30';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Needs Improvement';
        return 'Critical';
    };

    const fadeUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8">
            
            {/* Header Section */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex items-center justify-between">
                <div>
                    <p className="text-sm tracking-widest uppercase text-muted font-semibold mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan opacity-50"></span> Decision Analysis
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-primary">
                        Your security decision
                    </h1>
                </div>
                <div className="text-right">
                    <div className={`text-[80px] font-semibold tracking-tighter leading-none ${getScoreColor(evaluation.final_score)} flex items-start justify-end`}>
                        {evaluation.final_score}<span className="text-2xl font-medium text-muted mt-4 ml-2">/100</span>
                    </div>
                    <p className={`text-sm font-medium mt-2 ${getScoreColor(evaluation.final_score)}`}>
                        {getScoreLabel(evaluation.final_score)}
                    </p>
                </div>
            </motion.div>

            {/* Score Breakdown */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="grid grid-cols-2 gap-6">
                <div className={`bg-surface rounded-[2rem] p-8 border ${getScoreBorderColor(evaluation.action_score)} ${getScoreBgColor(evaluation.action_score)}`}>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-4">Action Score</p>
                    <div className="text-5xl font-semibold tracking-tighter text-primary">
                        {evaluation.action_score}
                    </div>
                </div>
                <div className={`bg-surface rounded-[2rem] p-8 border ${getScoreBorderColor(evaluation.reasoning_score)} ${getScoreBgColor(evaluation.reasoning_score)}`}>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-4">Reasoning Score</p>
                    <div className="text-5xl font-semibold tracking-tighter text-primary">
                        {evaluation.reasoning_score}
                    </div>
                </div>
            </motion.div>

            {/* Threat Indicators */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-surface rounded-[2.5rem] p-10 border border-primary/5">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-primary">Threat Indicators Detected</h2>
                        <p className="text-sm font-medium text-muted mt-0.5">Security signals identified in the scenario</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {evaluation.threat_indicators.map((indicator, index) => (
                        <div key={index} className="flex items-start gap-4 p-6 bg-red-500/5 rounded-2xl border border-red-500/10">
                            <div className="h-10 w-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold text-red-400 text-base">{indicator.type}</p>
                                    <span className="text-sm font-medium text-red-400">{indicator.confidence}%</span>
                                </div>
                                <p className="text-muted text-sm leading-relaxed">{indicator.description}</p>
                                <div className="mt-3 h-1.5 bg-red-500/20 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${indicator.confidence}%` }}
                                        transition={{ duration: 1, delay: 0.2 }}
                                        className="h-full bg-red-500 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Action Comparison */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface rounded-[2.5rem] p-10 border border-primary/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-8 rounded-full bg-blue/10 text-blue flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-primary">Your Action</h2>
                        </div>
                    </div>
                    <p className="text-muted leading-relaxed">{userAction}</p>
                </div>
                
                <div className="bg-surface rounded-[2.5rem] p-10 border border-teal/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-teal/50"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-8 rounded-full bg-teal/10 text-teal flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-primary">Recommended Safe Behavior</h2>
                        </div>
                    </div>
                    <p className="text-muted leading-relaxed">{evaluation.expected_behavior}</p>
                </div>
            </motion.div>

            {/* Reasoning Analysis */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-surface rounded-[2.5rem] p-10 border border-primary/5">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-8 rounded-full bg-cyan/10 text-cyan flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-primary">Reasoning Analysis</h2>
                        <p className="text-sm font-medium text-muted mt-0.5">Classification of your thought process</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-3">Your Reasoning</p>
                        <p className="text-muted leading-relaxed">{userReasoning}</p>
                    </div>
                    
                    <div className="p-6 bg-cyan/5 rounded-2xl border border-cyan/20">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-cyan mb-3">Classification</p>
                        <p className="text-primary font-semibold text-lg capitalize">{evaluation.reasoning_category}</p>
                    </div>
                </div>
            </motion.div>

            {/* AI Analysis */}
            {evaluation.llm_evaluation && (
                <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-gradient-to-br from-purple/5 to-blue/5 rounded-[2.5rem] p-10 border border-purple/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-8 rounded-full bg-purple/10 text-purple flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-primary">AI Analysis</h2>
                            <span className="text-xs font-medium text-purple">Confidence: {evaluation.llm_evaluation.confidence}%</span>
                        </div>
                    </div>
                    <p className="text-muted leading-relaxed">{evaluation.llm_evaluation.explanation}</p>
                </motion.div>
            )}

            {/* Learning Tip */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-amber/5 rounded-[2rem] p-8 border border-amber/20 flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-amber/10 text-amber flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm font-semibold text-amber mb-2">Learning Tip</p>
                    <p className="text-muted text-sm leading-relaxed">Always verify suspicious requests through alternate channels before taking action, especially when urgency or authority is used to pressure you.</p>
                </div>
            </motion.div>

        </div>
    );
};
