import React, { useEffect, useState } from 'react';
import { Topic, Concept, UserProgress } from '../types';
import { curriculum } from '../services/api';

interface LearningPathProps {
  onSelectConcept: (concept: Concept) => void;
  onBack: () => void;
  t: (key: any) => string;
}

const LearningPath: React.FC<LearningPathProps> = ({
  onSelectConcept,
  onBack,
  t
}) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsData, progressData] = await Promise.all([
          curriculum.topics(),
          curriculum.getProgress()
        ]);
        setTopics(topicsData);
        setProgress(progressData);
      } catch (e) {
        console.error("Failed to fetch curriculum", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getConceptProgress = (conceptId: string) => {
    return progress.find(p => p.concept_id === conceptId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white shadow-sm border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
            <div className="bg-teal-700 p-2 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800">{t('curriculum') || 'Medical Curriculum'}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">{t('yourLearningJourney') || 'Your Learning Journey'}</h2>
          <p className="text-slate-600 text-lg">Master the core concepts of medicine with our curated mnemonic-powered learning paths.</p>
        </div>

        <div className="space-y-12">
          {topics.map((topic, topicIdx) => (
            <div key={topic.id} className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xl border-2 border-teal-200 shadow-sm">
                  {topicIdx + 1}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{topic.name}</h3>
                  <p className="text-slate-500 text-sm">{topic.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-stone-200 ml-6">
                {topic.concepts?.map((concept) => {
                  const p = getConceptProgress(concept.id);
                  const isCompleted = p?.is_completed;

                  return (
                    <button
                      key={concept.id}
                      onClick={() => onSelectConcept(concept)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${isCompleted
                          ? 'bg-teal-50 border-teal-200 hover:border-teal-300'
                          : 'bg-white border-stone-200 hover:border-teal-200 hover:shadow-md'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-teal-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                          {isCompleted ? '✓' : '•'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{concept.name}</p>
                          <p className="text-xs text-slate-500">{concept.facts.length} facts</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {topics.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 border-dashed">
              <h3 className="text-xl font-bold text-slate-400">No curriculum content available yet.</h3>
              <p className="text-slate-400">Please check back later or contact an administrator.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPath;
