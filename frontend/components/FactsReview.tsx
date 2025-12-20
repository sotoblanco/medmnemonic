import React, { useState, useEffect } from 'react';
import { KeyFactsData } from '../types';

interface FactsReviewProps {
  data: KeyFactsData;
  onApprove: (updatedData: KeyFactsData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const FactsReview: React.FC<FactsReviewProps> = ({ data, onApprove, onCancel, isLoading }) => {
  const [topic, setTopic] = useState(data.topic);
  const [facts, setFacts] = useState(data.facts);

  // Sync state if props change (e.g. when parent updates state with approved data)
  useEffect(() => {
    setTopic(data.topic);
    setFacts(data.facts);
  }, [data]);

  const handleFactChange = (index: number, value: string) => {
    const newFacts = [...facts];
    newFacts[index] = value;
    setFacts(newFacts);
  };

  const handleAddFact = () => {
    setFacts([...facts, '']);
  };

  const handleRemoveFact = (index: number) => {
    setFacts(facts.filter((_, i) => i !== index));
  };

  const handleApproveClick = () => {
    const cleanFacts = facts.filter(f => f.trim() !== '');
    onApprove({
      topic: topic,
      facts: cleanFacts
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in">
      <div className="bg-slate-50 border-b border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-800">Review Key Facts</h2>
        <p className="text-slate-500 text-sm mt-1">
          Review and edit the extracted facts. You can add missing details or remove irrelevant ones to customize your story.
        </p>
      </div>

      <div className="p-8">
        <div className="mb-6">
            <label className="block text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Topic</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
              className="w-full text-lg font-medium text-slate-900 border-b-2 border-slate-200 focus:border-indigo-500 focus:outline-none py-1 bg-transparent transition-colors"
            />
        </div>

        <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Extracted Points</h3>
            </div>
            
            <ul className="space-y-3">
            {facts.map((fact, index) => (
                <li key={index} className="flex items-start group">
                  <div className="flex-shrink-0 mt-3 mr-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-grow relative">
                    <textarea
                      value={fact}
                      onChange={(e) => handleFactChange(index, e.target.value)}
                      disabled={isLoading}
                      rows={Math.max(2, Math.ceil(fact.length / 80))}
                      className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 resize-none transition-all"
                      placeholder="Enter a fact..."
                    />
                  </div>
                  {!isLoading && (
                    <button 
                      onClick={() => handleRemoveFact(index)}
                      className="ml-2 mt-3 text-slate-300 hover:text-red-500 transition-colors p-1"
                      title="Remove fact"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </li>
            ))}
            </ul>

            {!isLoading && (
              <button 
                onClick={handleAddFact}
                className="mt-4 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add another fact
              </button>
            )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 text-slate-600 font-medium hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApproveClick}
            disabled={isLoading || facts.filter(f => f.trim()).length === 0}
            className="inline-flex items-center px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
             {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Story...
                </>
              ) : (
                <>
                    Approve & Generate Story
                    <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </>
              )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FactsReview;