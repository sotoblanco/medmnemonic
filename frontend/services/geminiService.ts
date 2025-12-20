import request from './api';
import { MnemonicResponse, MnemonicAssociation, QuizQuestion, Language } from "../types";

export const generateFullMnemonic = async (text: string, pdfBase64?: string, language: Language = 'en'): Promise<MnemonicResponse> => {
  return request<MnemonicResponse>('/ai/generate/mnemonic', {
    method: 'POST',
    body: JSON.stringify({ text, pdfBase64, language })
  });
};

export const regenerateStoryFromFacts = async (topic: string, facts: string[], language: Language = 'en'): Promise<Pick<MnemonicResponse, 'story' | 'associations' | 'visualPrompt'>> => {
  return request<Pick<MnemonicResponse, 'story' | 'associations' | 'visualPrompt'>>('/ai/generate/story', {
    method: 'POST',
    body: JSON.stringify({ topic, facts, language })
  });
};

export const regenerateVisualPrompt = async (topic: string, story: string, associations: any[], language: Language = 'en'): Promise<string> => {
  const result = await request<{ visualPrompt: string }>('/ai/generate/visual-prompt', {
    method: 'POST',
    body: JSON.stringify({ topic, story, associations, language })
  });
  return result.visualPrompt;
};

export const generateMnemonicImage = async (visualPrompt: string): Promise<string> => {
  const result = await request<{ imageData: string }>('/ai/generate/image', {
    method: 'POST',
    body: JSON.stringify({ visualPrompt })
  });
  return result.imageData;
};

export const analyzeImageForBoundingBoxes = async (
  base64Image: string,
  associations: MnemonicAssociation[]
): Promise<MnemonicAssociation[]> => {
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  return request<MnemonicAssociation[]>('/ai/analyze/bounding-boxes', {
    method: 'POST',
    body: JSON.stringify({ imageBase64: cleanBase64, associations })
  });
};

export const generateQuiz = async (data: MnemonicResponse, language: Language = 'en'): Promise<QuizQuestion[]> => {
  return request<QuizQuestion[]>('/ai/generate/quiz', {
    method: 'POST',
    body: JSON.stringify({ mnemonicData: data, language })
  });
};

export const generateSpeech = async (text: string, language: Language = 'en'): Promise<string> => {
  const result = await request<{ audioData: string }>('/ai/generate/speech', {
    method: 'POST',
    body: JSON.stringify({ text, language })
  });
  return result.audioData;
};