import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { MnemonicResponse, MnemonicAssociation, KeyFactsData, QuizQuestion, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FULL_MNEMONIC_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING, description: "The main medical topic identified." },
    facts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of essential medical facts extracted."
    },
    story: { type: Type.STRING, description: "A creative, memorable, narrative story using mnemonic devices. Uses simple language." },
    associations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          medicalTerm: { type: Type.STRING },
          character: { type: Type.STRING, description: "The object or character in the story representing the term." },
          explanation: { type: Type.STRING, description: "Why this character represents this term." }
        },
        required: ["medicalTerm", "character", "explanation"]
      }
    },
    visualPrompt: { type: Type.STRING, description: "A highly detailed visual description of a cartoon scene that depicts the story elements. Optimized for image generation." }
  },
  required: ["topic", "facts", "story", "associations", "visualPrompt"]
};

// Sub-schema for partial regeneration
const STORY_SECTION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    story: { type: Type.STRING },
    associations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          medicalTerm: { type: Type.STRING },
          character: { type: Type.STRING },
          explanation: { type: Type.STRING }
        }
      }
    },
    visualPrompt: { type: Type.STRING }
  },
  required: ["story", "associations", "visualPrompt"]
};

// Schema for Quiz
const QUIZ_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      associationIndex: { type: Type.INTEGER, description: "The index of the association in the provided list." },
      question: { type: Type.STRING, description: "The question asking about the medical fact." },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "4 options: 1 correct, 3 incorrect distractors." 
      },
      correctOptionIndex: { type: Type.INTEGER, description: "0-3 index of the correct option." },
      explanation: { type: Type.STRING, description: "Brief explanation of the correct answer." }
    },
    required: ["associationIndex", "question", "options", "correctOptionIndex", "explanation"]
  }
};

const getLanguageInstruction = (lang: Language) => {
  return lang === 'es' 
    ? "IMPORTANT: Provide ALL output (Story, Facts, Explanations, Topic, Characters) in SPANISH. The JSON structure keys must remain in English, but the string values must be in Spanish."
    : "Provide all output in English.";
};

export const generateFullMnemonic = async (text: string, pdfBase64?: string, language: Language = 'en'): Promise<MnemonicResponse> => {
  try {
    const parts: any[] = [];

    if (pdfBase64) {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64
        }
      });
      parts.push({ text: "Analyze this PDF content." });
    } else {
      parts.push({ text: text });
    }

    const prompt = `
    Act as an expert medical educator (like Picmonic or SketchyMedical).
    ${getLanguageInstruction(language)}
    
    1. Analyze the input to extract high-yield medical facts, dosages, symptoms, and treatments.
    2. Create a wacky, memorable mnemonic story to explain these facts. 
       - Use sound-alike characters (e.g., 'Macrolide' -> 'Macaroni Slide').
       - Keep language simple and narrative.
       - The tone should be humorous and absurd.
    3. List the associations between characters and medical terms.
    4. Create a visual prompt for an illustration of this story.

    Output a single JSON object.
    `;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: FULL_MNEMONIC_SCHEMA,
      }
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini.");
    }

    return JSON.parse(response.text) as MnemonicResponse;
  } catch (error) {
    console.error("Error generating mnemonic:", error);
    throw error;
  }
};

export const regenerateStoryFromFacts = async (topic: string, facts: string[], language: Language = 'en'): Promise<Pick<MnemonicResponse, 'story' | 'associations' | 'visualPrompt'>> => {
  try {
    const prompt = `
    ${getLanguageInstruction(language)}
    Topic: ${topic}
    Facts:
    ${facts.map(f => `- ${f}`).join('\n')}

    Based on these SPECIFIC facts, generate:
    1. A wacky mnemonic story.
    2. The list of associations.
    3. A visual prompt for the image.
    
    Maintain the humorous, mnemonic style.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: STORY_SECTION_SCHEMA,
      }
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error regenerating story:", error);
    throw error;
  }
};

export const regenerateVisualPrompt = async (topic: string, story: string, associations: any[], language: Language = 'en'): Promise<string> => {
  try {
    const prompt = `
    Topic: ${topic}
    Story: ${story}
    Associations: ${JSON.stringify(associations)}

    Create a highly detailed visual description (visual prompt) for an image generator to illustrate this story in a cartoon/mnemonic style. 
    Focus on visual clarity of the characters.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "text/plain",
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Error regenerating visual prompt:", error);
    throw error;
  }
};

export const generateMnemonicImage = async (visualPrompt: string): Promise<string> => {
  try {
    // Enhance the prompt for the specific image model style
    const enhancedPrompt = `A vivid, cartoon-style educational illustration. 
    Subject: ${visualPrompt}. 
    Style: Hand-drawn animation style, bright colors, bold outlines, caricature-like characters, humorous, clear visual metaphors. 
    Composition: A single cohesive scene. High quality, detailed.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3"
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response.");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const analyzeImageForBoundingBoxes = async (
  base64Image: string, 
  associations: MnemonicAssociation[]
): Promise<MnemonicAssociation[]> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    const targetsDescription = associations.map(a => 
      `- Target Character: "${a.character}"\n  Medical Concept: "${a.medicalTerm}"\n  Visual Description/Context: ${a.explanation}`
    ).join('\n\n');
    
    const prompt = `
    You are an expert visual analyzer for medical mnemonic illustrations.
    
    Task: Identify the 2D bounding box for the specific characters listed below in the provided image.
    
    List of Targets:
    ${targetsDescription}

    Instructions:
    1. Analyze the image to locate the character described. Use the "Visual Description/Context" to disambiguate if necessary.
    2. Return the bounding box [ymin, xmin, ymax, xmax] (scale 0-100) for each character found.
    3. If a character is not found, omit it from the list or return 0,0,0,0.
    
    Output Format:
    Return a JSON array of objects. Each object must have:
    - 'character': The exact "Target Character" name.
    - 'box_2d': [ymin, xmin, ymax, xmax].
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              character: { type: Type.STRING },
              box_2d: { 
                type: Type.ARRAY, 
                items: { type: Type.NUMBER },
                description: "[ymin, xmin, ymax, xmax] 0-100"
              }
            }
          }
        }
      }
    });

    if (!response.text) return associations;

    const boxData = JSON.parse(response.text) as Array<{character: string, box_2d: [number, number, number, number]}>;
    
    return associations.map(assoc => {
      const match = boxData.find(b => b.character.toLowerCase().includes(assoc.character.toLowerCase()) || assoc.character.toLowerCase().includes(b.character.toLowerCase()));
      if (match && match.box_2d) {
        return { ...assoc, boundingBox: match.box_2d };
      }
      return assoc;
    });

  } catch (error) {
    console.error("Error analyzing image for bounding boxes:", error);
    return associations; 
  }
};

function shuffleQuizOptions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map(q => {
    const originalOptions = [...q.options];
    const correctAnswer = originalOptions[q.correctOptionIndex];
    
    for (let i = originalOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [originalOptions[i], originalOptions[j]] = [originalOptions[j], originalOptions[i]];
    }

    const newCorrectIndex = originalOptions.indexOf(correctAnswer);

    return {
      ...q,
      options: originalOptions,
      correctOptionIndex: newCorrectIndex
    };
  });
}

export const generateQuiz = async (data: MnemonicResponse, language: Language = 'en'): Promise<QuizQuestion[]> => {
  try {
    const context = `
    Topic: ${data.topic}
    Key Facts: ${data.facts.join('; ')}
    Associations:
    ${data.associations.map((a, i) => `${i}. Character: ${a.character} -> Medical Concept: ${a.medicalTerm}`).join('\n')}
    `;

    const prompt = `
    ${getLanguageInstruction(language)}
    Generate a challenging multiple-choice quiz based on the provided associations for a medical student audience.
    
    For each association listed above:
    1. Create a question that tests understanding of the medical concept.
       - Do NOT just ask "What does this character represent?".
       - Instead, ask about the *implication* of the fact (e.g., "What is the mechanism of action associated with this symbol?" or "What clinical presentation does this character signify?", "What is the treatment indicated by this symbol?").
       - If the association is simple, ask a second-order question related to that fact.
    2. Provide 4 options: 
       - 1 correct answer (the medical concept or fact).
       - 3 plausible, tricky medical distractors. These should be real medical terms or concepts that might be confused with the correct answer. Do not use obvious fillers.
    3. Ensure the 'correctOptionIndex' points to the right answer (0-3).
    4. Provide a brief explanation.

    Generate questions for ALL associations.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: context }, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: QUIZ_SCHEMA
      }
    });

    if (!response.text) throw new Error("No quiz data generated");
    
    const rawQuestions = JSON.parse(response.text) as QuizQuestion[];
    return shuffleQuizOptions(rawQuestions);

  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, language: Language = 'en'): Promise<string> => {
  try {
    const voiceName = language === 'es' ? 'Puck' : 'Kore'; // Use Puck for Spanish-like or just variety, though 2.5 flash native audio supports multilingual.
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [{ text: `Read the following aloud in a warm, friendly and engaging tone (${language === 'es' ? 'Spanish' : 'English'}): ${text}` }]
      },
      config: {
        responseModalities: [Modality.AUDIO], 
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName }
          }
        }
      }
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.[0];
    if (audioPart?.inlineData?.data) {
      return audioPart.inlineData.data;
    }
    throw new Error("No audio data generated");
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};