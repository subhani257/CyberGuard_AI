"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Choice {
    id: string;
    text: string;
}

interface ScenarioCardProps {
    scenarioText: string;
    choices: Choice[];
    onSubmitReasoning?: (choiceId: string, reasoning: string) => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenarioText, choices, onSubmitReasoning }) => {
    const router = useRouter();
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [reasoning, setReasoning] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChoiceClick = (choiceId: string) => {
        setSelectedChoice(choiceId);
    };

    const handleSubmit = () => {
        if (selectedChoice && reasoning) {
            setIsSubmitting(true);
            
            // If callback provided, use it, else default routing behavior
            if (onSubmitReasoning) {
                onSubmitReasoning(selectedChoice, reasoning);
            } else {
                // Simulate network delay for realism before routing
                setTimeout(() => {
                    router.push('/evaluation');
                }, 600);
            }
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden font-sans">
            <div className="p-8 md:p-10 space-y-8">
                
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                    <div className="h-10 w-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Security Incident Simulation</h2>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">Please review the situation carefully.</p>
                    </div>
                </div>

                {/* Scenario Text */}
                <div className="bg-[#F5F5F7] p-6 rounded-2xl text-slate-700 leading-relaxed font-medium text-sm md:text-base border border-slate-200/60">
                    {scenarioText}
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider ml-1">Available Actions</h3>
                    <div className="space-y-3">
                        {choices.map((choice) => (
                            <button
                                key={choice.id}
                                onClick={() => handleChoiceClick(choice.id)}
                                className={`w-full text-left px-5 py-4 border rounded-2xl transition-all duration-200 ease-in-out font-medium text-sm md:text-base
                                    ${selectedChoice === choice.id 
                                        ? 'bg-blue-50 border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,1)] text-blue-900' 
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'
                                    }`}
                            >
                                {choice.text}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reasoning Box - only shows if choice is selected */}
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${selectedChoice ? 'max-h-[400px] opacity-100 mt-8' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-900 ml-1">
                            Why did you choose this action?
                        </label>
                        <textarea
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none shadow-inner"
                            rows={3}
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                            placeholder="Briefly explain your reasoning so your Coach can help you..."
                        />
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={!reasoning.trim() || isSubmitting}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-3 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Analyzing...
                                    </>
                                ) : (
                                    'Submit Response'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
