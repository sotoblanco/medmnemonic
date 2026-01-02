from typing import List, Optional, Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- Auth Models ---
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    username: str
    email: str
    is_admin: bool = False

# --- Learning Path Models ---
class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None
    order: int = 0

class TopicCreate(TopicBase):
    pass

class Topic(TopicBase):
    model_config = ConfigDict(from_attributes=True)
    id: str

class ConceptBase(BaseModel):
    topic_id: str
    name: str
    description: Optional[str] = None
    facts: List[str]
    order: int = 0

class ConceptCreate(ConceptBase):
    pass

class Concept(ConceptBase):
    model_config = ConfigDict(from_attributes=True)
    id: str

class UserProgressBase(BaseModel):
    concept_id: str
    is_completed: bool = False
    last_accessed: int

class UserProgress(UserProgressBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Domain Models ---
class SRSMetadata(BaseModel):
    n: int = Field(description="Consecutive correct answers")
    ef: float = Field(description="Ease Factor")
    i: int = Field(description="Interval in days")
    lastReview: int = Field(description="Timestamp of last review")
    nextReview: int = Field(description="Timestamp of next review")

class MnemonicAssociation(BaseModel):
    medicalTerm: str
    character: str
    explanation: str
    boundingBox: Optional[List[float]] = Field(None, min_length=4, max_length=4)
    shape: Optional[Literal['rect', 'ellipse']] = None
    srs: Optional[SRSMetadata] = None

class KeyFactsData(BaseModel):
    topic: str
    facts: List[str]

class MnemonicResponse(KeyFactsData):
    story: str
    associations: List[MnemonicAssociation]
    visualPrompt: str

class SavedStory(MnemonicResponse):
    model_config = ConfigDict(from_attributes=True)
    id: str
    createdAt: int
    imageData: Optional[str] = None

class QuizQuestion(BaseModel):
    associationIndex: int
    question: str
    options: List[str]
    correctOptionIndex: int
    explanation: str

class QuizList(BaseModel):
    questions: List[QuizQuestion]

# --- Request Bodies ---
class GenerateMnemonicRequest(BaseModel):
    text: str
    pdfBase64: Optional[str] = None
    language: Literal['en', 'es'] = 'en'

class RegenerateStoryRequest(BaseModel):
    topic: str
    facts: List[str]
    language: Literal['en', 'es'] = 'en'

class RegenerateStoryResponse(BaseModel):
    story: str
    associations: List[MnemonicAssociation]
    visualPrompt: str

class RegenerateVisualPromptRequest(BaseModel):
    topic: str
    story: str
    associations: List[MnemonicAssociation]
    language: Literal['en', 'es'] = 'en'

class RegenerateVisualPromptResponse(BaseModel):
    visualPrompt: str

class GenerateImageRequest(BaseModel):
    visualPrompt: str

class GenerateImageResponse(BaseModel):
    imageData: str

class AnalyzeImageRequest(BaseModel):
    imageBase64: str
    associations: List[MnemonicAssociation]

class GenerateQuizRequest(BaseModel):
    mnemonicData: MnemonicResponse
    language: Literal['en', 'es'] = 'en'

class GenerateSpeechRequest(BaseModel):
    text: str
    language: Literal['en', 'es'] = 'en'

class GenerateSpeechResponse(BaseModel):
    audioData: str

class ReviewRequest(BaseModel):
    associationIndex: int
    quality: int = Field(..., ge=0, le=5)

# --- Playlist Models ---
class PlaylistBase(BaseModel):
    name: str
    description: Optional[str] = None

class PlaylistCreate(PlaylistBase):
    pass

class Playlist(PlaylistBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    createdAt: int
    story_ids: List[str] = []

