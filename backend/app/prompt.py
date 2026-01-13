from typing import List, Dict, Any
import json

# --- Model Constants ---
MODEL_FLASH = "gemini-3-flash-preview"
MODEL_VISUAL_PROMPT = "gemini-3-flash-preview"
MODEL_IMAGE_GEN = "gemini-3-pro-image-preview"
MODEL_TTS = "gemini-2.5-flash-preview-tts"

# --- Language Instructions ---
LANGUAGE_INSTRUCTION_ES = """
        IMPORTANT: OUTPUT MUST BE IN SPANISH (ESPAÑOL).
        - The internal JSON keys (like 'story', 'medicalTerm') MUST remain in English.
        - ALL values, text, descriptions, story content, explanations, and terms MUST be in Spanish.
        - The characters should have Spanish names or names that make sense in a Spanish pun context.
        """
LANGUAGE_INSTRUCTION_EN = "Provide all output in English."

def get_language_instruction(lang: str) -> str:
    if lang == 'es':
        return LANGUAGE_INSTRUCTION_ES
    return LANGUAGE_INSTRUCTION_EN

# --- Prompts ---

def get_mnemonic_prompt(language: str) -> str:
    return f"""
    Act as an expert medical educator (like Picmonic or SketchyMedical).
    {get_language_instruction(language)}
    
    1. Analyze the input to extract high-yield medical facts, dosages, symptoms, and treatments.
    2. Create a wacky, memorable mnemonic story to explain these facts. 
       - Use sound-alike characters (e.g., 'Macrolide' -> 'Macaroni Slide').
       - Keep language simple and narrative.
       - The tone should be humorous and absurd.
    3. List the associations between characters and medical terms.
    4. Create a visual prompt for an illustration of this story.

    Output a single JSON object.
    """

def get_regenerate_story_prompt(topic: str, facts: List[str], language: str) -> str:
    facts_str = "\n".join([f"- {f}" for f in facts])
    return f"""
    {get_language_instruction(language)}
    Topic: {topic}
    Facts:
    {facts_str}

    Based on these SPECIFIC facts, generate:
    1. A wacky mnemonic story.
    2. The list of associations.
    3. A visual prompt for the image.
    
    Maintain the humorous, mnemonic style.
    """

def get_regenerate_visual_prompt_prompt(topic: str, story: str, associations: List[Any]) -> str:
    # associations should be a list of dicts or objects with .dict()
    # We'll assume the caller passes the list of dicts or handles serialization before calling if complex
    # But for type safety let's assume it's data we can serialize
    
    # If associations are pydantic models, caller should dump them. 
    # Or we can handle it if we type hint Any.
    
    # Let's assume serialization happens outside or we just json.dumps it here if it's a list.
    assoc_str = json.dumps(associations) if isinstance(associations, list) else str(associations)

    return f"""
    Topic: {topic}
    Story: {story}
    Associations: {assoc_str}

    Create a highly detailed visual description (visual prompt) for an image generator to illustrate this story in a cartoon/mnemonic style. 
    Focus on visual clarity of the characters.
    """

def get_image_generation_prompt(visual_prompt: str) -> str:
    return f"""A vivid, cartoon-style educational illustration. 
    Subject: {visual_prompt}. 
    Style: Hand-drawn animation style, bright colors, bold outlines, caricature-like characters, humorous, clear visual metaphors. 
    Composition: A single cohesive scene. High quality, detailed."""

def get_bbox_analysis_prompt(targets_desc: str) -> str:
    return f"""
        You are an expert visual analyzer for medical mnemonic illustrations.
        
        Task: Identify the 2D bounding box for the specific characters listed below in the provided image.
        
        List of Targets:
        {targets_desc}

        Instructions:
        1. Analyze the image to locate the character described. Use the "Visual Description/Context" to disambiguate if necessary.
        2. Return the bounding box [ymin, xmin, ymax, xmax] (scale 0-100) for each character found.
        3. If a character is not found, omit it from the list or return 0,0,0,0.
        
        Output Format:
        Return a JSON array of objects. Each object must have:
        - 'character': The exact "Target Character" name.
        - 'box_2d': [ymin, xmin, ymax, xmax].
        """

def get_quiz_prompt(context: str, language: str) -> str:
    return f"""
    {get_language_instruction(language)}
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
    """

def get_speech_prompt(text: str, language: str) -> str:
    lang_name = 'Spanish' if language == 'es' else 'English'
    return f"Read the following aloud in a warm, friendly and engaging tone ({lang_name}): {text}"
