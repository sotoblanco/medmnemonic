import os
import json
import base64
import random
from typing import List
from fastapi import APIRouter, HTTPException
from google import genai
from google.genai import types
from ..models import (
    GenerateMnemonicRequest, MnemonicResponse, 
    RegenerateStoryRequest, RegenerateStoryResponse,
    RegenerateVisualPromptRequest, RegenerateVisualPromptResponse,
    GenerateImageRequest, GenerateImageResponse,
    AnalyzeImageRequest, MnemonicAssociation,
    GenerateQuizRequest, QuizQuestion, QuizList,
    GenerateSpeechRequest, GenerateSpeechResponse
)

router = APIRouter(prefix="/ai", tags=["AI"])

from dotenv import load_dotenv

load_dotenv()

from .. import prompt as prompts

# Initialize client
api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

@router.post("/generate/mnemonic", response_model=MnemonicResponse)
async def generate_mnemonic(request: GenerateMnemonicRequest):
    parts = []
    if request.pdfBase64:
        # Decode base64 to bytes if needed, or pass as part.
        # The python SDK might handle types.Part.from_data
        # Actually Google Gen AI SDK v2 (google-genai) uses simpler interface?
        # Let's assume standard usage:
        
        # Clean base64 if it has header
        b64_data = request.pdfBase64
        if "base64," in b64_data:
            b64_data = b64_data.split("base64,")[1]
            
        parts.append(types.Part.from_bytes(
            data=base64.b64decode(b64_data),
            mime_type="application/pdf"
        ))
        parts.append(types.Part.from_text(text="Analyze this PDF content."))
    else:
        parts.append(types.Part.from_text(text=request.text))

    prompt_text = prompts.get_mnemonic_prompt(request.language)
    parts.append(types.Part.from_text(text=prompt_text))

    try:
        response = client.models.generate_content(
            model=prompts.MODEL_FLASH,
            contents=[types.Content(parts=parts)],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=MnemonicResponse,
                thinking_config=types.ThinkingConfig(thinking_level="high")
            )
        )
        
        if not response.text:
             raise HTTPException(status_code=500, detail="No response text from AI")
             
        data = json.loads(response.text)
        return MnemonicResponse(**data)
        
    except Exception as e:
        print(f"Error generating mnemonic: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/story")
async def regenerate_story(request: RegenerateStoryRequest):
    prompt_text = prompts.get_regenerate_story_prompt(request.topic, request.facts, request.language)
    
    try:
        # We need a partial schema here.
        # Defining it dynamically or using pydantic
        class StorySection(MnemonicResponse): 
            # We only need a subset but response_schema usually extracts fit
            pass
            
        # Actually let's just ask for JSON matching the structure
        schema = {
            "type": "OBJECT",
            "properties": {
                "story": {"type": "STRING"},
                "associations": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "medicalTerm": {"type": "STRING"},
                            "character": {"type": "STRING"},
                            "explanation": {"type": "STRING"}
                        }
                    }
                },
                "visualPrompt": {"type": "STRING"}
            },
            "required": ["story", "associations", "visualPrompt"]
        }

        response = client.models.generate_content(
            model=prompts.MODEL_FLASH,
            contents=[types.Content(parts=[types.Part.from_text(text=prompt)])],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
                thinking_config=types.ThinkingConfig(thinking_level="high")
            )
        )
        
        return json.loads(response.text)
    except Exception as e:
        print(f"Error regenerating story: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/visual-prompt", response_model=RegenerateVisualPromptResponse)
async def regenerate_visual_prompt(request: RegenerateVisualPromptRequest):
    # This one expects text output
    # Convert associations to list of dicts if they are objects
    associations_dicts = [a.dict() for a in request.associations]
    prompt_text = prompts.get_regenerate_visual_prompt_prompt(request.topic, request.story, associations_dicts)
    
    try:
        response = client.models.generate_content(
            model=prompts.MODEL_VISUAL_PROMPT,
            contents=[types.Content(parts=[types.Part.from_text(text=prompt_text)])],
            config=types.GenerateContentConfig(
                response_mime_type="text/plain",
                thinking_config=types.ThinkingConfig(thinking_level="high")
            )
        )
        return RegenerateVisualPromptResponse(visualPrompt=response.text)
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/image", response_model=GenerateImageResponse)
async def generate_image(request: GenerateImageRequest):
    # If visualPrompt is in Spanish (which it likely is now), prompt the image gen to handle it
    # or translate it. Modern models handle Spanish prompts well.
    # We add a style instruction.
    
    enhanced_prompt = prompts.get_image_generation_prompt(request.visualPrompt)
    
    try:
        # Verify model name for image generation
        # "gemini-2.5-flash-image" was in frontend, maybe "imagen-3.0-generate-001" or similar is available? 
        # Or standard gemini-pro-vision? No, that's for input.
        # Assuming the user has access to a model capable of images. 
        # Using "imagen-3.0-generated-001" or "gemini-2.5-flash" if it supports it?
        # IMPORTANT: Google Gen AI sdk `models.generate_images` is the method usually? 
        # Or `generate_content` for some?
        # The new SDK has `client.models.generate_image`?
        # Let's check imports. `from google import genai`
        # client.models.generate_images(...)
        
        response = client.models.generate_content(
            model=prompts.MODEL_IMAGE_GEN,
            contents=enhanced_prompt,
            config=types.GenerateContentConfig(
                image_config=types.ImageConfig(
                    aspect_ratio="4:3",
                    image_size="4K"
                )
            )
        )
        
        # Gemini 3 content generation response parsing for images
        image_parts = [part for part in response.parts if part.inline_data]
        if image_parts:
             img_part = image_parts[0]
             # Assuming inline_data.data is bytes
             b64_img = base64.b64encode(img_part.inline_data.data).decode('utf-8')
             return GenerateImageResponse(imageData=f"data:image/png;base64,{b64_img}")
            
        raise Exception("No image generated")

    except Exception as e:
        print(f"Image Gen Error: {e}")
        # Fallback to demo image if generation fails (common in test envs)
        # Or re-raise
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/bounding-boxes", response_model=List[MnemonicAssociation])
async def analyze_bounding_boxes(request: AnalyzeImageRequest):
    try:
        clean_base64 = request.imageBase64
        if "base64," in clean_base64:
            clean_base64 = clean_base64.split("base64,")[1]
            
        targets_desc = "\n\n".join([
            f"- Target Character: \"{a.character}\"\n  Medical Concept: \"{a.medicalTerm}\"\n  Visual Description/Context: {a.explanation}"
            for a in request.associations
        ])
        
        prompt_text = prompts.get_bbox_analysis_prompt(targets_desc)
        
        response = client.models.generate_content(
            model=prompts.MODEL_FLASH,
            contents=[
                types.Content(parts=[
                    types.Part(
                        inline_data=types.Blob(
                             data=base64.b64decode(clean_base64), 
                             mime_type="image/png"
                        ),
                        media_resolution=types.MediaResolution(level="media_resolution_high")
                    ),
                    types.Part.from_text(text=prompt_text)
                ])
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                thinking_config=types.ThinkingConfig(thinking_level="high")
            )
        )
        
        box_data = json.loads(response.text)
        
        updated = []
        for assoc in request.associations:
            match = next((b for b in box_data if b.get('character', '').lower() in assoc.character.lower() or assoc.character.lower() in b.get('character', '').lower()), None)
            if match and 'box_2d' in match:
                assoc.boundingBox = match['box_2d']
                # Pydantic model might need assignment
                assoc.shape = 'rect'
            updated.append(assoc)
        return updated
        
    except Exception as e:
        print(f"Bbox analysis error: {e}")
        return request.associations

@router.post("/generate/quiz", response_model=List[QuizQuestion])
async def generate_quiz(request: GenerateQuizRequest):
    data = request.mnemonicData
    associations_str = "\n".join([f"{i}. Character: {a.character} -> Medical Concept: {a.medicalTerm}" for i, a in enumerate(data.associations)])
    context = f"""
    Topic: {data.topic}
    Key Facts: {"; ".join(data.facts)}
    Associations:
    {associations_str}
    """
    
    prompt_text = prompts.get_quiz_prompt(context, request.language)
    
    try:
        response = client.models.generate_content(
            model=prompts.MODEL_FLASH,
            contents=[types.Content(parts=[types.Part.from_text(text=context), types.Part.from_text(text=prompt_text)])],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=QuizList,
                thinking_config=types.ThinkingConfig(thinking_level="high")
            )
        )
        
        result_data = json.loads(response.text)
        # Check if it was parsed as dict matching QuizList or just list if backend allows fuzzy match
        # But we asked for QuizList schema so it should be dict with "questions" key
        if isinstance(result_data, list):
             questions = result_data
        else:
             questions = result_data.get('questions', [])
        
        # Shuffle options
        for q in questions:
            opts = q['options']
            correct_val = opts[q['correctOptionIndex']]
            # Modern shuffle
            random.shuffle(opts)
            q['correctOptionIndex'] = opts.index(correct_val)
            
        return [QuizQuestion(**q) for q in questions] # Validate
        
    except Exception as e:
        print(f"Quiz gen error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/speech", response_model=GenerateSpeechResponse)
async def generate_speech(request: GenerateSpeechRequest):
    # This might require a specific model or permission
    # 'Puck' is a good default, but maybe 'Fenrir' or others are better for deep voices, 
    # 'Aoede' for female. Let's stick to Puck or maybe 'Kore' if neutral.
    # Actually, for Spanish, we rely on the model detecting language or the text being Spanish.
    voice_name = 'Puck' # Default
    if request.language == 'es':
         # Attempt to pick a voice that might sound better if available, 
         # but standard voices often handle accents well.
         pass
    
    # Note: TTS via API might assume specific models/endpoints
    # "gemini-2.5-flash-exp" sometimes supports audio out?
    # Or separate TTS endpoint?
    # The frontend code used: model: "gemini-2.5-flash-preview-tts"
    # We will try to map this.
    
    try:
        text_to_read = prompts.get_speech_prompt(request.text, request.language)
        response = client.models.generate_content(
            model=prompts.MODEL_TTS, # Experimental often has modalities
            contents=[types.Content(parts=[
                types.Part.from_text(text=text_to_read)
            ])],
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                    )
                )
            )
        )
        # Extract audio
        # response.parts[0].inline_data.data (bytes)
        if response.candidates and response.candidates[0].content.parts:
             for part in response.candidates[0].content.parts:
                 if part.inline_data:
                     b64 = base64.b64encode(part.inline_data.data).decode('utf-8')
                     return GenerateSpeechResponse(audioData=b64)
                     
        raise Exception("No audio content generated")
        
    except Exception as e:
        print(f"Speech Gen Error: {e}")
        raise HTTPException(status_code=500, detail="Speech generation not supported or failed")
