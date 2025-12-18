import React, { useState, useCallback } from 'react';
import { InputMode } from '../types';

interface InputFormProps {
  onSubmit: (text: string, pdfBase64?: string) => void;
  isLoading: boolean;
  t: (key: any) => string;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, t }) => {
  const [mode, setMode] = useState<InputMode>(InputMode.TEXT);
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === InputMode.TEXT) {
      if (!textInput.trim()) return;
      onSubmit(textInput);
    } else {
      if (!selectedFile) return;
      
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        onSubmit("", base64String);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, [mode, textInput, selectedFile, onSubmit]);

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200">
      <div className="bg-stone-50 border-b border-stone-200 p-2 flex">
        <button
          onClick={() => setMode(InputMode.TEXT)}
          className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
            mode === InputMode.TEXT 
              ? 'bg-white text-teal-700 shadow-sm ring-1 ring-stone-200' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('textDescription')}
        </button>
        <button
          onClick={() => setMode(InputMode.PDF)}
          className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
            mode === InputMode.PDF 
              ? 'bg-white text-teal-700 shadow-sm ring-1 ring-stone-200' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('uploadPdf')}
        </button>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === InputMode.TEXT ? (
            <div>
              <label htmlFor="text-input" className="block text-sm font-medium text-slate-700 mb-2">
                {t('pasteNotes')}
              </label>
              <textarea
                id="text-input"
                rows={6}
                className="w-full rounded-xl border-stone-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-4 text-slate-700 bg-stone-50 resize-none"
                placeholder={t('pastePlaceholder')}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-stone-300 rounded-xl p-12 text-center bg-stone-50 hover:bg-stone-100 transition-colors">
              <input
                id="file-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="mx-auto h-12 w-12 text-slate-400 mb-4">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="mt-2 block text-sm font-medium text-teal-700">
                  {selectedFile ? selectedFile.name : t('selectPdf')}
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  Up to 10MB
                </p>
              </label>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading || (mode === InputMode.TEXT && !textInput) || (mode === InputMode.PDF && !selectedFile)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-teal-700 hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('processing')}
                </>
              ) : (
                t('generateMnemonic')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputForm;