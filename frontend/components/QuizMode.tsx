
import React, { useState, useEffect } from 'react';
import { QuizQuestion, MnemonicResponse, DailyReviewItem, SRSMetadata } from '../types';

interface QuizModeProps {
  quizData?: QuizQuestion[];
  mnemonicData?: MnemonicResponse;
  isInterleaved?: boolean;
  reviewQueue?: DailyReviewItem[];
  onExit: () => void;
  setHighlightIndex: (index: number | null) => void;
  onUpdateSRS: (storyId: string, assocIdx: number, quality: number) => void;
  onCurrentItemChange?: (item: DailyReviewItem | null) => void;
  t: (key: any) => string;
}

const QuizMode: React.FC<QuizModeProps> = ({ quizData, mnemonicData, isInterleaved, reviewQueue, onExit, setHighlightIndex, onUpdateSRS, onCurrentItemChange, t }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [localQueue, setLocalQueue] = useState<DailyReviewItem[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (isInterleaved && reviewQueue) {
      setLocalQueue([...reviewQueue]);
    }
  }, [isInterleaved, reviewQueue]);

  const currentItem = isInterleaved ? localQueue[currentIndex] : null;
  const currentQuestion = isInterleaved ? currentItem?.question : quizData?.[currentIndex];

  useEffect(() => {
    if (currentQuestion) {
      setHighlightIndex(currentQuestion.associationIndex);
    }
  }, [currentIndex, currentQuestion, setHighlightIndex]);

  // Sync current item change to parent
  useEffect(() => {
    if (isInterleaved && currentItem && onCurrentItemChange) {
      onCurrentItemChange(currentItem);
    }
  }, [currentIndex, localQueue, isInterleaved, currentItem, onCurrentItemChange]);

  const handleOptionClick = (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    const correct = optionIndex === currentQuestion?.correctOptionIndex;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
  };

  const handleRating = (quality: number) => {
    if (!currentItem) {
      // For non-interleaved, we just advance
      handleNext(true);
      return;
    }

    // Pass quality to parent to handle API call
    onUpdateSRS(currentItem.storyId, currentQuestion!.associationIndex, quality);

    if (quality >= 3) {
      // Success logic for interleaved: Failure needs 2 correct answers
      if (currentItem.relearnCount > 0) {
        const updated = [...localQueue];
        updated[currentIndex].relearnCount--;
        if (updated[currentIndex].relearnCount === 0) {
          // Successfully relearned
          handleNext(true);
        } else {
          handleNext(false); // Move to back of queue
        }
      } else {
        handleNext(true); // Permanent move
      }
    } else {
      // Failure logic: enter re-learning loop (must get correct 2 more times)
      const updated = [...localQueue];
      updated[currentIndex].relearnCount = 2;
      setLocalQueue(updated);
      handleNext(false); // Move to back
    }
  };

  const handleNext = (completed: boolean) => {
    if (isInterleaved) {
      if (completed) {
        if (localQueue.length === 1) {
          setShowSummary(true);
        } else {
          const updated = localQueue.filter((_, i) => i !== currentIndex);
          setLocalQueue(updated);
          setCurrentIndex(0);
          resetState();
        }
      } else {
        // Move current to end
        const item = localQueue[currentIndex];
        const updated = [...localQueue.filter((_, i) => i !== currentIndex), item];
        setLocalQueue(updated);
        setCurrentIndex(0);
        resetState();
      }
    } else {
      if (currentIndex < (quizData?.length || 0) - 1) {
        setCurrentIndex(v => v + 1);
        resetState();
      } else {
        setShowSummary(true);
      }
    }
  };

  const resetState = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
  };

  if (showSummary) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 h-full flex flex-col items-center justify-center p-8 animate-fade-in text-center min-h-[400px]">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('quizComplete')}</h2>
        <p className="text-slate-500 mb-8">{t('youScored')} <span className="text-teal-700 font-bold text-xl">{score}</span></p>
        <button onClick={onExit} className="px-6 py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition-colors">{t('backToStudy')}</button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200 flex flex-col h-full animate-fade-in">
      <div className="bg-teal-800 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">
          {isInterleaved ? t('dailyReview') : t('quizMode')}
          {isInterleaved && <span className="text-xs ml-2 opacity-75">({localQueue.length} {t('dueToday')})</span>}
        </h2>
        <div className="text-teal-100 text-sm truncate max-w-[150px]">{isInterleaved ? currentItem?.topic : mnemonicData?.topic}</div>
      </div>

      <div className="p-8 flex-grow overflow-y-auto flex flex-col">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-800 leading-relaxed">{currentQuestion.question}</h3>
          {isInterleaved && currentItem?.relearnCount! > 0 && (
            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase mt-2 inline-block">
              {t('relearning')} ({currentItem?.relearnCount} left)
            </span>
          )}
        </div>

        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, idx) => {
            let stateClass = "border-stone-200 hover:border-teal-300";
            if (isAnswered) {
              if (idx === currentQuestion.correctOptionIndex) stateClass = "border-green-500 bg-green-50 text-green-800";
              else if (idx === selectedOption) stateClass = "border-red-300 bg-red-50 text-red-800";
              else stateClass = "border-stone-100 text-slate-400 opacity-50";
            }
            return (
              <button key={idx} onClick={() => handleOptionClick(idx)} disabled={isAnswered} className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium ${stateClass}`}>
                {String.fromCharCode(65 + idx)}. {option}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-auto animate-fade-in">
            <div className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="text-sm">{currentQuestion.explanation}</p>
            </div>

            {isCorrect && isInterleaved ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase text-center mb-2">How hard was this recall?</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleRating(3)} className="py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-bold hover:bg-amber-100">{t('hard')}</button>
                  <button onClick={() => handleRating(4)} className="py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-bold hover:bg-blue-100">{t('good')}</button>
                  <button onClick={() => handleRating(5)} className="py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-sm font-bold hover:bg-teal-100">{t('easy')}</button>
                </div>
              </div>
            ) : isAnswered && isInterleaved && !isCorrect ? (
              <button onClick={() => handleRating(0)} className="w-full py-3 bg-red-600 text-white font-bold rounded-lg shadow">{t('nextQuestion')}</button>
            ) : (
              <button onClick={() => handleNext(true)} className="w-full py-3 bg-teal-700 text-white font-bold rounded-lg shadow">{t('nextQuestion')}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizMode;
