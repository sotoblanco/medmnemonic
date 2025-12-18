
import React from 'react';
import { SavedStory } from '../types';
import { isDue } from '../services/srsService';

interface LearningPathProps {
  savedStories: SavedStory[];
  onSelectStory: (story: SavedStory) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
  onStartReview: () => void;
  t: (key: any) => string;
}

const LearningPath: React.FC<LearningPathProps> = ({ savedStories, onSelectStory, onBack, onDelete, onStartReview, t }) => {
  const dueCount = savedStories.reduce((acc, story) => {
    return acc + story.associations.filter(a => isDue(a.srs)).length;
  }, 0);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white shadow-sm border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
             <div className="bg-teal-700 p-2 rounded-lg">
               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
             </div>
             <h1 className="text-xl font-bold text-slate-800">{t('myLearningPath')}</h1>
          </div>
          <button onClick={onBack} className="text-sm font-medium text-slate-500 hover:text-teal-700">{t('newConcept')}</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Daily Review Header Card */}
        {dueCount > 0 && (
            <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-2xl p-8 mb-10 shadow-lg text-white flex flex-col md:flex-row justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold mb-2">{t('dailyReview')}</h2>
                    <p className="text-teal-100 mb-0 opacity-90">You have <span className="font-bold text-white underline">{dueCount}</span> items due for review using interleaved spaced repetition.</p>
                </div>
                <button 
                    onClick={onStartReview}
                    className="mt-6 md:mt-0 px-8 py-4 bg-white text-teal-800 font-bold rounded-xl shadow-xl hover:bg-teal-50 transition-all transform hover:scale-105"
                >
                    {t('startReview')}
                </button>
            </div>
        )}

        {savedStories.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-slate-900 mb-2">{t('noSavedStories')}</h3>
            <p className="text-slate-500 mb-6">{t('createFirst')}</p>
            <button onClick={onBack} className="px-4 py-2 bg-teal-700 text-white rounded-lg">{t('createMnemonic')}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedStories.map((story) => {
              const storyDue = story.associations.filter(a => isDue(a.srs)).length;
              return (
                <div key={story.id} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
                  <div className="h-32 bg-stone-100 relative">
                     {story.imageData ? <img src={story.imageData} alt={story.topic} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">📷</div>}
                     {storyDue > 0 && (
                         <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                            {storyDue} {t('dueToday')}
                         </div>
                     )}
                  </div>
                  <div className="p-6 flex-grow">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">{story.topic}</h3>
                    <p className="text-sm text-slate-600 line-clamp-3 font-serif mb-4">{story.story}</p>
                  </div>
                  <div className="bg-stone-50 px-6 py-4 border-t border-stone-100 flex justify-between items-center">
                     <button onClick={() => onDelete(story.id)} className="text-sm text-red-500 font-medium">{t('delete')}</button>
                     <button onClick={() => onSelectStory(story)} className="text-sm text-teal-700 font-bold">{t('viewStory')}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPath;
