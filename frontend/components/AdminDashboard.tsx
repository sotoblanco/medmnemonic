import React, { useEffect, useState } from 'react';
import { Topic, Concept } from '../types';
import { curriculum, admin } from '../services/api';

interface AdminDashboardProps {
    onBack: () => void;
    t: (key: any) => string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, t }) => {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTopic, setEditingTopic] = useState<Partial<Topic> | null>(null);
    const [editingConcept, setEditingConcept] = useState<Partial<Concept> | null>(null);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        setLoading(true);
        try {
            const data = await curriculum.topics();
            setTopics(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTopic = async () => {
        if (!editingTopic?.name) return;
        try {
            await admin.createTopic(editingTopic);
            setEditingTopic(null);
            fetchTopics();
        } catch (e) { alert("Failed to create topic"); }
    };

    const handleUpdateTopic = async () => {
        if (!editingTopic?.id || !editingTopic.name) return;
        try {
            await admin.updateTopic(editingTopic.id, editingTopic);
            setEditingTopic(null);
            fetchTopics();
        } catch (e) { alert("Failed to update topic"); }
    };

    const handleDeleteTopic = async (id: string) => {
        if (!confirm("Are you sure? This will delete all associated concepts.")) return;
        try {
            await admin.deleteTopic(id);
            fetchTopics();
        } catch (e) { alert("Failed to delete topic"); }
    };

    const handleCreateConcept = async () => {
        if (!editingConcept?.name || !editingConcept.topic_id) return;
        try {
            // Split facts by newline
            const facts = editingConcept.facts as any;
            const factsArray = typeof facts === 'string' ? facts.split('\n').filter(f => f.trim()) : facts;
            await admin.createConcept({ ...editingConcept, facts: factsArray });
            setEditingConcept(null);
            fetchTopics();
        } catch (e) { alert("Failed to create concept"); }
    };

    const handleUpdateConcept = async () => {
        if (!editingConcept?.id || !editingConcept.name) return;
        try {
            const facts = editingConcept.facts as any;
            const factsArray = typeof facts === 'string' ? facts.split('\n').filter(f => f.trim()) : facts;
            await admin.updateConcept(editingConcept.id, { ...editingConcept, facts: factsArray });
            setEditingConcept(null);
            fetchTopics();
        } catch (e) { alert("Failed to update concept"); }
    };

    const handleDeleteConcept = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await admin.deleteConcept(id);
            fetchTopics();
        } catch (e) { alert("Failed to delete concept"); }
    };

    if (loading && topics.length === 0) return <div className="p-20 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-stone-50 pb-20">
            <header className="bg-slate-900 text-white p-6 shadow-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <h1 className="text-2xl font-bold tracking-tight">Admin <span className="text-teal-400">Content Studio</span></h1>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setEditingTopic({ name: '', description: '', order: topics.length })} className="bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded-lg font-bold transition-all shadow-lg">New Topic</button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-10">
                {/* Topic Editor Modal-ish */}
                {editingTopic && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
                            <h2 className="text-2xl font-bold mb-6 text-slate-900">{editingTopic.id ? 'Edit Topic' : 'New Topic'}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Topic Name</label>
                                    <input value={editingTopic.name} onChange={e => setEditingTopic({ ...editingTopic, name: e.target.value })} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Cardiology" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                    <textarea value={editingTopic.description} onChange={e => setEditingTopic({ ...editingTopic, description: e.target.value })} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 h-24" placeholder="Brief overview..." />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setEditingTopic(null)} className="flex-1 py-3 bg-stone-100 text-slate-600 font-bold rounded-xl hover:bg-stone-200">Cancel</button>
                                    <button onClick={editingTopic.id ? handleUpdateTopic : handleCreateTopic} className="flex-1 py-3 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 shadow-md">Save</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Concept Editor Modal-ish */}
                {editingConcept && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-fade-in-up overflow-y-auto max-h-[90vh]">
                            <h2 className="text-2xl font-bold mb-6 text-slate-900">{editingConcept.id ? 'Edit Concept' : 'New Concept'}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Concept Name</label>
                                    <input value={editingConcept.name} onChange={e => setEditingConcept({ ...editingConcept, name: e.target.value })} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Heart Failure" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                    <textarea value={editingConcept.description} onChange={e => setEditingConcept({ ...editingConcept, description: e.target.value })} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 h-20" placeholder="Optional notes..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">High-Yield Facts (One per line)</label>
                                    <textarea value={Array.isArray(editingConcept.facts) ? editingConcept.facts.join('\n') : editingConcept.facts} onChange={e => setEditingConcept({ ...editingConcept, facts: e.target.value })} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 h-40 font-mono text-sm" placeholder="Fact 1\nFact 2..." />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setEditingConcept(null)} className="flex-1 py-3 bg-stone-100 text-slate-600 font-bold rounded-xl hover:bg-stone-200">Cancel</button>
                                    <button onClick={editingConcept.id ? handleUpdateConcept : handleCreateConcept} className="flex-1 py-3 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 shadow-md">Save</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8">
                    {topics.map(topic => (
                        <div key={topic.id} className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
                            <div className="bg-stone-50 p-6 border-b border-stone-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900">{topic.name}</h3>
                                    <p className="text-stone-500 text-xs mt-1">{topic.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingTopic(topic)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-white rounded-lg transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                    <button onClick={() => handleDeleteTopic(topic.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Concepts</h4>
                                    <button onClick={() => setEditingConcept({ name: '', topic_id: topic.id, facts: [], order: topic.concepts?.length || 0 })} className="text-teal-700 text-sm font-bold hover:underline">+ Add Concept</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {topic.concepts?.map(concept => (
                                        <div key={concept.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex justify-between items-start group">
                                            <div>
                                                <p className="font-bold text-slate-800">{concept.name}</p>
                                                <p className="text-[10px] text-stone-400 uppercase mt-1 font-bold">{concept.facts.length} Facts</p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setEditingConcept(concept)} className="p-1.5 hover:bg-white rounded-md text-slate-400 hover:text-teal-600 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                                <button onClick={() => handleDeleteConcept(concept.id)} className="p-1.5 hover:bg-white rounded-md text-slate-400 hover:text-red-500 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </div>
                                        </div>
                                    ))}
                                    {(topic.concepts?.length === 0 || !topic.concepts) && <div className="col-span-full py-4 text-center text-slate-400 text-sm italic">No concepts yet.</div>}
                                </div>
                            </div>
                        </div>
                    ))}

                    {topics.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 border-dashed">
                            <h3 className="text-xl font-bold text-slate-400">No topics created.</h3>
                            <button onClick={() => setEditingTopic({ name: '' })} className="mt-4 text-teal-700 font-bold underline">Create your first topic</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
