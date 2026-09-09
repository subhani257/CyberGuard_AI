"use client";
import React from 'react';

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
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Needs Improvement';
        return 'Critical';
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden font-sans">
            <div className="p-8 md:p-10 space-y-8">
                
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                    <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Evaluation Results</h2>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">Your security decision analysis</p>
                    </div>
                </div>

                {/* Overall Score */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600 mb-1">Overall Score</p>
                            <div className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-2xl ${getScoreColor(evaluation.final_score)}`}>
                                {evaluation.final_score}/100
                            </div>
                            <p className={`text-sm font-semibold mt-2 ${getScoreColor(evaluation.final_score).split(' ')[0]}`}>
                                {getScoreLabel(evaluation.final_score)}
                            </p>
                        </div>
                        <div className="text-right space-y-2">
                            <div className="text-sm">
                                <span className="text-slate-600">Action:</span>
                                <span className="font-semibold ml-2 text-slate-900">{evaluation.action_score}</span>
                            </div>
                            <div className="text-sm">
                                <span className="text-slate-600">Reasoning:</span>
                                <span className="font-semibold ml-2 text-slate-900">{evaluation.reasoning_score}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Threat Indicators */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider ml-1">Threat Indicators Detected</h3>
                    <div className="grid gap-3">
                        {evaluation.threat_indicators.map((indicator, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                                <div className="h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-red-900 text-sm">{indicator.type}</p>
                                    <p className="text-red-700 text-xs mt-1">{indicator.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="h-1.5 flex-1 bg-red-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-red-500 rounded-full transition-all"
                                                style={{ width: `${indicator.confidence}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-red-600 font-medium">{indicator.confidence}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Your Action vs Expected */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider ml-1">Action Analysis</h3>
                    <div className="space-y-3">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-xs font-medium text-slate-500 mb-1">Your Action</p>
                            <p className="text-sm text-slate-800">{userAction}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                            <p className="text-xs font-medium text-green-600 mb-1">Recommended Safe Behavior</p>
                            <p className="text-sm text-green-900">{evaluation.expected_behavior}</p>
                        </div>
                    </div>
                </div>

                {/* Reasoning Analysis */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider ml-1">Reasoning Analysis</h3>
                    <div className="space-y-3">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-xs font-medium text-slate-500 mb-1">Your Reasoning</p>
                            <p className="text-sm text-slate-800">{userReasoning}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <p className="text-xs font-medium text-blue-600 mb-1">Classification</p>
                            <p className="text-sm font-semibold text-blue-900 capitalize">{evaluation.reasoning_category}</p>
                        </div>
                    </div>
                </div>

                {/* LLM Evaluation */}
                {evaluation.llm_evaluation && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider ml-1">AI Analysis</h3>
                        <div className="p-5 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <p className="text-xs font-medium text-purple-600">AI Confidence: {evaluation.llm_evaluation.confidence}%</p>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{evaluation.llm_evaluation.explanation}</p>
                        </div>
                    </div>
                )}

                {/* Educational Tip */}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-amber-900">Learning Tip</p>
                        <p className="text-xs text-amber-700 mt-1">Always verify suspicious requests through alternate channels before taking action, especially when urgency or authority is used to pressure you.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};
