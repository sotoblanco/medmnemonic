import React, { useState, useEffect, useRef } from 'react';
import { MnemonicResponse, Language } from '../types';
import { generateSpeech } from '../services/geminiService';

interface StoryDisplayProps {
  data: MnemonicResponse;
  highlightedIndex: number | null;
  onHighlight: (index: number | null) => void;
  t: (key: any) => string;
  language: Language;
}

type Tab = 'facts' | 'story' | 'anchors';

const StoryDisplay: React.FC<StoryDisplayProps> = ({ data, highlightedIndex, onHighlight, t, language }) => {
  const [activeTab, setActiveTab] = useState<Tab>('anchors');
  
  // Audio State
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  // Audio playback references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Record<string, string>>({}); // Cache blob URLs by content key

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Revoke all cached object URLs to avoid leaks
      Object.values(audioCache.current).forEach((url) => URL.revokeObjectURL(url as string));
    };
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
      audioRef.current.onpause = () => {
        setIsPlaying(false);
      };
      audioRef.current.onplay = () => {
        setIsPlaying(true);
      };
      audioRef.current.onerror = (e) => {
        console.error("Audio playback error", e);
        setIsPlaying(false);
        setIsLoadingAudio(false);
      };
    }
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleTabChange = (tab: Tab) => {
    stopAudio(); 
    setActiveTab(tab);
    
    if (tab !== 'anchors') {
      onHighlight(null); 
    }
  };

  const getReadableText = () => {
    if (activeTab === 'story') {
      return `Here is the mnemonic story for ${data.topic}. ${data.story}`;
    } else if (activeTab === 'facts') {
      // Natural reading: Join with periods and pauses.
      const factsText = data.facts?.join('. ') || "No facts available.";
      return `Here are the key facts for ${data.topic}. ${factsText}`;
    }
    return '';
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      // If we have a source and are just paused/stopped but on the same track
      if (audio.src && !audio.ended && audio.currentTime > 0) {
         audio.play();
         return;
      }

      // Need to load or create audio
      const text = getReadableText();
      if (!text) return;

      // Use cache key based on tab + topic + language (simple unique key)
      const cacheKey = `${data.topic}-${activeTab}-${language}`;
      
      if (audioCache.current[cacheKey]) {
        // Play from cache
        if (audio.src !== audioCache.current[cacheKey]) {
            audio.src = audioCache.current[cacheKey];
            audio.playbackRate = playbackRate;
        }
        audio.play().catch(e => console.error("Play error", e));
      } else {
        // Generate new
        setIsLoadingAudio(true);
        try {
          const base64Pcm = await generateSpeech(text, language);
          const wavUrl = pcmToBase64Wav(base64Pcm);
          
          audioCache.current[cacheKey] = wavUrl;
          audio.src = wavUrl;
          audio.playbackRate = playbackRate;
          audio.play();
        } catch (error) {
          console.error("Failed to generate speech", error);
          alert("Could not generate audio narration.");
        } finally {
          setIsLoadingAudio(false);
        }
      }
    }
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.5, 1.75, 2.0];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newRate = speeds[nextIndex];
    
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200 flex flex-col h-full">
      <div className="bg-teal-800 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {data.topic}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 bg-stone-50">
        <button
          onClick={() => handleTabChange('anchors')}
          className={`flex-1 py-3 text-sm font-bold text-center transition-all ${
            activeTab === 'anchors'
              ? 'text-teal-800 border-b-2 border-teal-700 bg-white'
              : 'text-slate-500 hover:text-slate-700 hover:bg-stone-100'
          }`}
        >
          {t('memoryAnchors')}
        </button>
        <button
          onClick={() => handleTabChange('story')}
          className={`flex-1 py-3 text-sm font-bold text-center transition-all ${
            activeTab === 'story'
              ? 'text-teal-800 border-b-2 border-teal-700 bg-white'
              : 'text-slate-500 hover:text-slate-700 hover:bg-stone-100'
          }`}
        >
          {t('theStory')}
        </button>
        <button
          onClick={() => handleTabChange('facts')}
          className={`flex-1 py-3 text-sm font-bold text-center transition-all ${
            activeTab === 'facts'
              ? 'text-teal-800 border-b-2 border-teal-700 bg-white'
              : 'text-slate-500 hover:text-slate-700 hover:bg-stone-100'
          }`}
        >
          {t('keyFacts')}
        </button>
      </div>

      {/* Narrator Control Bar - Visible for Story and Facts */}
      {(activeTab === 'story' || activeTab === 'facts') && (
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-2 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-teal-800 uppercase tracking-wide mr-2 hidden sm:inline">
               {t('narrator')} ({activeTab === 'story' ? t('theStory') : t('keyFacts')})
             </span>
             
             {/* Play/Pause Button */}
             <button 
               onClick={togglePlayback}
               disabled={isLoadingAudio}
               className={`flex items-center justify-center w-8 h-8 rounded-full text-white transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 ${isLoadingAudio ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
               title={isPlaying ? "Pause" : "Play Zephyr Voice"}
             >
               {isLoadingAudio ? (
                 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
               ) : isPlaying ? (
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                 </svg>
               ) : (
                 <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                 </svg>
               )}
             </button>

             {/* Stop Button */}
             {(isPlaying || (!isPlaying && audioRef.current && audioRef.current.currentTime > 0)) && (
               <button 
                 onClick={stopAudio}
                 className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors shadow-sm"
                 title="Stop"
               >
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                 </svg>
               </button>
             )}

             {/* Speed Control Button */}
             <button
                onClick={cycleSpeed}
                className="flex items-center justify-center px-3 h-8 rounded-full bg-white border border-teal-200 text-teal-700 text-xs font-bold hover:bg-teal-50 transition-colors ml-1 shadow-sm w-16"
                title="Change Playback Speed"
             >
               {playbackRate}x
             </button>
           </div>

           {/* Audio Visualizer (Fake) */}
           {isPlaying && (
             <div className="flex space-x-1 items-center">
                <span className="w-1 h-3 bg-teal-400 rounded-full animate-[pulse_0.6s_infinite]"></span>
                <span className="w-1 h-4 bg-teal-500 rounded-full animate-[pulse_0.8s_infinite]"></span>
                <span className="w-1 h-2 bg-teal-400 rounded-full animate-[pulse_1.0s_infinite]"></span>
                <span className="w-1 h-5 bg-teal-300 rounded-full animate-[pulse_0.7s_infinite]"></span>
             </div>
           )}
        </div>
      )}
      
      <div className="p-8 flex-grow overflow-y-auto">
        {activeTab === 'facts' && (
           <div className="animate-fade-in space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{t('extractedInfo')}</h3>
              <ul className="space-y-3">
                {data.facts?.map((fact, index) => (
                  <li key={index} className="flex items-start text-slate-700 leading-relaxed font-medium">
                    <svg className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
              {(!data.facts || data.facts.length === 0) && (
                  <p className="text-slate-500 italic">No specific facts extracted.</p>
              )}
           </div>
        )}

        {activeTab === 'story' && (
          <div className="prose prose-slate max-w-none animate-fade-in">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{t('mnemonicStory')}</h3>
            <p className="text-lg leading-relaxed text-slate-800 whitespace-pre-wrap font-serif">
              {data.story}
            </p>
          </div>
        )}

        {activeTab === 'anchors' && (
          <div className="animate-fade-in">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t('interactiveAnchors')}</h3>
            <div className="space-y-4">
              {data.associations.map((assoc, index) => (
                <div 
                  key={index} 
                  onClick={() => onHighlight(index === highlightedIndex ? null : index)}
                  className={`flex items-start rounded-xl p-4 border transition-all cursor-pointer ${
                    highlightedIndex === index 
                      ? 'bg-amber-50 border-amber-300 shadow-md scale-[1.02]' 
                      : 'bg-white border-stone-200 hover:border-amber-200 hover:bg-stone-50'
                  }`}
                >
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold mr-4 transition-colors ${
                    highlightedIndex === index ? 'bg-amber-500 text-white' : 'bg-stone-200 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                      <h4 className={`font-bold ${highlightedIndex === index ? 'text-amber-900' : 'text-teal-900'}`}>
                        {assoc.character}
                      </h4>
                      <span className="hidden sm:inline text-slate-400 text-xs">{t('represents')}</span>
                      <span className="font-semibold text-teal-700">{assoc.medicalTerm}</span>
                    </div>
                    <p className={`text-sm mt-1 ${highlightedIndex === index ? 'text-slate-800' : 'text-slate-600'}`}>
                      {assoc.explanation}
                    </p>
                    {highlightedIndex === index && !assoc.boundingBox && (
                      <p className="text-xs text-amber-600 mt-2 italic flex items-center font-medium">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('locationNotSet')}
                      </p>
                    )}
                  </div>
                  <div className="ml-2 flex flex-col justify-center h-full">
                     {highlightedIndex === index ? (
                       <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                       </svg>
                     ) : (
                       <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                       </svg>
                     )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Helper Functions ---
const pcmToBase64Wav = (base64Pcm: string): string => {
  const binaryString = atob(base64Pcm);
  const len = binaryString.length;
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buffer[i] = binaryString.charCodeAt(i);
  }

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + buffer.length, true); // File size - 8
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, buffer.length, true); // Subchunk2Size

  const blob = new Blob([view, buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

export default StoryDisplay;