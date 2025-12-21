
import React, { useState } from 'react';
import { SavedStory, Playlist } from '../types';
import { isDue } from '../services/srsService';

interface LearningPathProps {
  savedStories: SavedStory[];
  playlists: Playlist[];
  onSelectStory: (story: SavedStory) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
  onStartReview: () => void;
  onCreatePlaylist: (name: string) => void;
  onAddToPlaylist: (playlistId: string, storyId: string) => void;
  onRemoveFromPlaylist: (playlistId: string, storyId: string) => void;
  onDeletePlaylist: (id: string) => void;
  t: (key: any) => string;
}

const LearningPath: React.FC<LearningPathProps> = ({
  savedStories,
  playlists,
  onSelectStory,
  onBack,
  onDelete,
  onStartReview,
  onCreatePlaylist,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onDeletePlaylist,
  t
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<string | null>(null); // storyId

  const dueCount = savedStories.reduce((acc, story) => {
    return acc + story.associations.filter(a => isDue(a.srs)).length;
  }, 0);

  const filteredStories = selectedPlaylistId
    ? savedStories.filter(s => {
      const p = playlists.find(pl => pl.id === selectedPlaylistId);
      return p?.story_ids.includes(s.id);
    })
    : savedStories;

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
        {/* Playlists Sidebar/Toolbar */}
        <div className="mb-10 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" /></svg>
              {t('playlists')}
            </h2>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder={t('playlistName')}
                className="flex-grow md:w-64 px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <button
                onClick={() => { if (newPlaylistName) { onCreatePlaylist(newPlaylistName); setNewPlaylistName(''); } }}
                className="px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-bold whitespace-nowrap"
              >
                {t('createPlaylist')}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPlaylistId(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedPlaylistId === null ? 'bg-teal-700 text-white shadow-md' : 'bg-stone-100 text-slate-600 hover:bg-stone-200'}`}
            >
              All Stories
            </button>
            {playlists.map(p => (
              <div key={p.id} className="relative group">
                <button
                  onClick={() => setSelectedPlaylistId(p.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all pr-8 ${selectedPlaylistId === p.id ? 'bg-teal-600 text-white shadow-md' : 'bg-stone-100 text-slate-600 hover:bg-stone-200'}`}
                >
                  {p.name} ({p.story_ids.length})
                  <span
                    onClick={(e) => { e.stopPropagation(); onDeletePlaylist(p.id); if (selectedPlaylistId === p.id) setSelectedPlaylistId(null); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-0 group-hover:opacity-100 hover:text-red-500 p-1"
                  >
                    ✕
                  </span>
                </button>
              </div>
            ))}
            {playlists.length === 0 && <span className="text-sm text-slate-400 italic py-2">{t('noPlaylists')}</span>}
          </div>
        </div>

        {/* Daily Review Header Card */}
        {dueCount > 0 && selectedPlaylistId === null && (
          <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-2xl p-8 mb-10 shadow-lg text-white flex flex-col md:flex-row justify-between items-center animate-fade-in">
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

        {filteredStories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 border-dashed">
            <h3 className="text-lg font-medium text-slate-900 mb-2">{selectedPlaylistId ? "No stories in this playlist" : t('noSavedStories')}</h3>
            <p className="text-slate-500 mb-6">{selectedPlaylistId ? "Add some stories from your library." : t('createFirst')}</p>
            {!selectedPlaylistId && <button onClick={onBack} className="px-6 py-3 bg-teal-700 text-white font-bold rounded-xl shadow-md hover:bg-teal-800 transition-all">{t('createMnemonic')}</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStories.map((story) => {
              const storyDue = story.associations.filter(a => isDue(a.srs)).length;
              const inSelectedPlaylist = selectedPlaylistId ? true : false;

              return (
                <div key={story.id} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-teal-100 group">
                  <div className="h-40 bg-stone-100 relative overflow-hidden">
                    {story.imageData ? <img src={story.imageData} alt={story.topic} className="w-full h-full object-cover transition-transform group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    {storyDue > 0 && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg animate-pulse">
                        {storyDue} {t('dueToday')}
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-grow">
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{story.topic}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2 font-serif leading-relaxed mb-4">{story.story}</p>
                  </div>
                  <div className="bg-stone-50 px-6 py-4 border-t border-stone-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <button onClick={() => onDelete(story.id)} className="text-xs text-red-400 hover:text-red-500 font-medium transition-colors">{t('delete')}</button>
                      <button onClick={() => onSelectStory(story)} className="text-sm text-teal-700 font-bold hover:text-teal-800 transition-colors">{t('viewStory')}</button>
                    </div>

                    <div className="border-t border-stone-200 pt-3 relative">
                      <button
                        onClick={() => setShowAddToPlaylist(showAddToPlaylist === story.id ? null : story.id)}
                        className="w-full text-xs text-slate-500 hover:text-teal-600 flex items-center justify-center gap-1 font-semibold"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        {t('addToPlaylist')}
                      </button>

                      {showAddToPlaylist === story.id && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-stone-200 p-2 z-10 animate-fade-in-up">
                          <div className="max-h-40 overflow-y-auto scrollbar-thin">
                            {playlists.map(p => {
                              const isAdded = p.story_ids.includes(story.id);
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    if (isAdded) onRemoveFromPlaylist(p.id, story.id);
                                    else onAddToPlaylist(p.id, story.id);
                                    setShowAddToPlaylist(null);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex justify-between items-center ${isAdded ? 'bg-teal-50 text-teal-700 font-bold' : 'hover:bg-stone-50 text-slate-600'}`}
                                >
                                  {p.name}
                                  {isAdded && <span>✓</span>}
                                </button>
                              );
                            })}
                            {playlists.length === 0 && <span className="p-2 text-[10px] text-slate-400">{t('noPlaylists')}</span>}
                          </div>
                        </div>
                      )}
                    </div>
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

