import React, { useState } from 'react';
import { MnemonicResponse, MnemonicAssociation, Language } from '../types';
import { regenerateStoryFromFacts, regenerateVisualPrompt } from '../services/geminiService';

interface PlanReviewProps {
  data: MnemonicResponse;
  onApprove: (updatedData: MnemonicResponse) => void;
  onCancel: () => void;
  t: (key: any) => string;
  language: Language;
}

const PlanReview: React.FC<PlanReviewProps> = ({ data, onApprove, onCancel, t, language }) => {
  const [formData, setFormData] = useState<MnemonicResponse>(data);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null); // 'story' | 'prompt' | null

  // --- Handlers for Local Edits ---

  const handleTopicChange = (val: string) => setFormData({ ...formData, topic: val });

  const handleFactChange = (idx: number, val: string) => {
    const newFacts = [...formData.facts];
    newFacts[idx] = val;
    setFormData({ ...formData, facts: newFacts });
  };
  const addFact = () => setFormData({ ...formData, facts: [...formData.facts, ''] });
  const removeFact = (idx: number) => setFormData({ ...formData, facts: formData.facts.filter((_, i) => i !== idx) });

  const handleStoryChange = (val: string) => setFormData({ ...formData, story: val });
  
  const handleVisualPromptChange = (val: string) => setFormData({ ...formData, visualPrompt: val });

  const handleAssocChange = (idx: number, field: keyof MnemonicAssociation, val: string) => {
    const newAssocs = [...formData.associations];
    newAssocs[idx] = { ...newAssocs[idx], [field]: val };
    setFormData({ ...formData, associations: newAssocs });
  };
  const addAssoc = () => setFormData({ 
    ...formData, 
    associations: [...formData.associations, { medicalTerm: '', character: '', explanation: '' }] 
  });
  const removeAssoc = (idx: number) => setFormData({ 
    ...formData, 
    associations: formData.associations.filter((_, i) => i !== idx) 
  });

  // --- Handlers for AI Regeneration ---

  const handleRegenerateStory = async () => {
    if (!formData.facts.length) return alert("Add some facts first!");
    setIsRegenerating('story');
    try {
      const result = await regenerateStoryFromFacts(formData.topic, formData.facts, language);
      setFormData(prev => ({
        ...prev,
        story: result.story,
        associations: result.associations,
        visualPrompt: result.visualPrompt // Usually updates this too
      }));
    } catch (e) {
      console.error(e);
      alert("Failed to regenerate story.");
    } finally {
      setIsRegenerating(null);
    }
  };

  const handleRegeneratePrompt = async () => {
    setIsRegenerating('prompt');
    try {
      const result = await regenerateVisualPrompt(formData.topic, formData.story, formData.associations, language);
      setFormData(prev => ({ ...prev, visualPrompt: result }));
    } catch (e) {
      console.error(e);
      alert("Failed to regenerate visual prompt.");
    } finally {
      setIsRegenerating(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200 animate-fade-in flex flex-col h-[85vh]">
      <div className="bg-teal-800 px-6 py-4 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold text-white tracking-wide">{t('reviewPlan')}</h2>
        <span className="text-teal-100 text-sm bg-white/10 px-3 py-1 rounded-full border border-white/20">{t('step1')}</span>
      </div>

      <div className="overflow-y-auto p-8 space-y-8 grow bg-stone-50">
        
        {/* Section 1: Topic & Facts */}
        <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
           <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-4 border-b border-stone-100 pb-2">1. {t('keyFacts')}</h3>
           <div className="mb-4">
             <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">{t('topic')}</label>
             <input 
               value={formData.topic} 
               onChange={e => handleTopicChange(e.target.value)}
               className="w-full p-2 rounded border border-stone-300 font-bold text-lg text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none bg-stone-50"
             />
           </div>
           <div className="space-y-2">
             <label className="block text-xs font-semibold text-slate-500 uppercase">{t('factsToMemorize')}</label>
             {formData.facts.map((fact, i) => (
               <div key={i} className="flex gap-2 group">
                 <input 
                   value={fact}
                   onChange={e => handleFactChange(i, e.target.value)}
                   className="flex-grow p-2 rounded border border-stone-300 text-sm focus:border-teal-500 outline-none transition-colors"
                   placeholder="Enter a fact..."
                 />
                 <button onClick={() => removeFact(i)} className="text-slate-300 hover:text-red-500 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   &times;
                 </button>
               </div>
             ))}
             <button onClick={addFact} className="text-sm text-teal-600 font-bold hover:underline mt-2 inline-flex items-center">
               {t('addFact')}
             </button>
           </div>
        </section>

        {/* Section 2: Story */}
        <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm relative">
          <div className="flex justify-between items-center mb-4 border-b border-stone-100 pb-2">
             <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wider">2. {t('theStory')}</h3>
             <button 
                onClick={handleRegenerateStory}
                disabled={!!isRegenerating}
                className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-full hover:bg-teal-100 font-semibold transition-colors flex items-center gap-1"
             >
                {isRegenerating === 'story' ? (
                  <span className="animate-spin text-lg leading-none">&orarr;</span>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                )}
                {t('regenerateFacts')}
             </button>
          </div>
          <textarea
            value={formData.story}
            onChange={e => handleStoryChange(e.target.value)}
            rows={6}
            className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-slate-800 leading-relaxed focus:ring-2 focus:ring-teal-500 outline-none resize-y"
          />
        </section>

        {/* Section 3: Associations */}
        <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
           <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-4 border-b border-stone-100 pb-2">3. {t('memoryAnchors')}</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {formData.associations.map((assoc, i) => (
               <div key={i} className="bg-stone-50 p-4 rounded-lg border border-stone-200 relative group hover:border-teal-200 transition-colors">
                  <button onClick={() => removeAssoc(i)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    &times;
                  </button>
                  <div className="mb-2">
                    <label className="text-[10px] uppercase text-slate-400 font-bold">{t('character')}</label>
                    <input 
                      value={assoc.character}
                      onChange={e => handleAssocChange(i, 'character', e.target.value)}
                      className="w-full border-b border-stone-300 bg-transparent focus:border-teal-500 outline-none text-teal-900 font-bold text-sm"
                      placeholder="e.g. Blue Bear"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="text-[10px] uppercase text-slate-400 font-bold">{t('term')}</label>
                    <input 
                      value={assoc.medicalTerm}
                      onChange={e => handleAssocChange(i, 'medicalTerm', e.target.value)}
                      className="w-full border-b border-stone-300 bg-transparent focus:border-teal-500 outline-none text-slate-800 text-sm font-semibold"
                      placeholder="e.g. Bilirubin"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-400 font-bold">{t('meaning')}</label>
                    <textarea 
                      value={assoc.explanation}
                      onChange={e => handleAssocChange(i, 'explanation', e.target.value)}
                      rows={2}
                      className="w-full border border-stone-300 rounded bg-white text-xs p-2 focus:border-teal-500 outline-none resize-none"
                    />
                  </div>
               </div>
             ))}
             <button 
               onClick={addAssoc}
               className="bg-stone-50 border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-600 min-h-[160px] transition-colors font-medium"
             >
               {t('addAnchor')}
             </button>
           </div>
        </section>

        {/* Section 4: Visual Prompt (Updated for Readability) */}
        <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
           <div className="flex justify-between items-center mb-4 border-b border-stone-100 pb-2">
             <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wider">4. {t('aiImageInstruction')}</h3>
             <button 
                onClick={handleRegeneratePrompt}
                disabled={!!isRegenerating}
                className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full hover:bg-slate-200 font-semibold transition-colors flex items-center gap-1"
             >
                {isRegenerating === 'prompt' ? <span className="animate-spin">&orarr;</span> : <span>&#9998;</span>}
                {t('updateStory')}
             </button>
           </div>
           <p className="text-xs text-slate-500 mb-2">This is the exact prompt sent to the image generator. You can tweak it to add specific visual details.</p>
           <textarea
             value={formData.visualPrompt}
             onChange={e => handleVisualPromptChange(e.target.value)}
             rows={4}
             className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-slate-700 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-teal-500 outline-none resize-y"
           />
        </section>

      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t border-stone-200 p-6 flex justify-between items-center shrink-0">
        <button 
          onClick={onCancel}
          className="px-6 py-3 rounded-lg text-slate-500 font-semibold hover:bg-slate-50 transition-colors"
        >
          {t('discard')}
        </button>
        <button 
          onClick={() => onApprove(formData)}
          className="px-8 py-3 rounded-lg bg-teal-700 text-white font-bold shadow-md hover:bg-teal-800 hover:shadow-lg transition-all flex items-center"
        >
          <span>{t('generateVisual')}</span>
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>
    </div>
  );
};

export default PlanReview;