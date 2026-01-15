
export interface Template {
  id: string;
  title: string;
  content: string;
  category: 'work' | 'personal' | 'creative';
  createdAt: number;
}

export interface MemoryItem {
  id: string;
  text: string;
  category: 'personal' | 'style' | 'professional';
  createdAt: number;
}

export interface FeedbackEntry {
  id: string;
  type: 'bug' | 'feature' | 'ui';
  description: string;
  createdAt: number;
}

export interface PromptExample {
  input: string;
  output: string;
}

export interface CustomPrompt {
  id: string;
  name: string;
  category: string; 
  model: 'gemini-3-flash-preview' | 'gemini-3-pro-preview' | 'gemini-3-pro-image-preview';
  systemInstruction?: string;
  template: string; 
  personaId?: string; 
  examples?: PromptExample[];
  tags?: string[]; // Added tags
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
  isThinking?: boolean;
  images?: string[]; 
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: number;
  modelUsed?: string;
}

export type Tone = 'professional' | 'casual' | 'friendly' | 'empathetic';
export type Length = 'short' | 'medium' | 'long';

export interface AssistantConfig {
  tone: Tone;
  length: Length;
  action: 'check' | 'rephrase' | 'summarize' | 'synonyms';
}

// Planner Types
export interface CalendarEvent {
  id: string;
  title: string;
  date: string; 
  endDate?: string; 
  type: 'visit' | 'date' | 'call' | 'other';
  owner: 'chris' | 'jette' | 'both';
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'; // Added recurrence
}

export interface KanbanItem {
  id: string;
  content: string;
  tags: string[];
}

export interface KanbanColumn {
  id: 'ideas' | 'todo' | 'done';
  title: string;
  items: KanbanItem[];
}

export interface Persona {
  id: string;
  name: string;
  age: string;
  voice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  interests: string;
  hobbies: string;
  family: string;
  socialStatus: string;
  strengths: string;
  personalityTraits: string;
  communicationStyle: string;
  expertise: string;
  avatarColor: string;
}

export interface AppSettings {
  lengthDefinitions: {
    short: string;
    medium: string;
    long: string;
  };
  trainConfig: {
    origin: string;
    destination: string;
    card: string;
  };
  emailConfig: {
    userEmail: string;
    partnerEmail: string;
  };
  podcastConfig: {
    personas: Persona[];
    activePersonaIds: string[];
  };
  apiKeys?: {
    openai?: string;
  };
}

export interface ExcelTemplate {
  id: string;
  name: string;
  description: string;
  headers: string[];
  rows: string[][];
  aiPrompt: string; // New field for pre-filled AI explanation
}

// Knowledge Base Types
export interface KnowledgeMetadata {
  title: string;
  summary: string;
  type: 'document' | 'video' | 'audio' | 'webpage' | 'spreadsheet';
  tags: string[];
  key_entities: string[];
  created_at: string;
  chunk_count: number;
  original_source?: string;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  content: string; // Base64 or Text content
  mimeType: string; // 'application/pdf', 'text/plain', 'youtube/url', etc.
  metadata: KnowledgeMetadata;
  chunks: string[]; // Processed text chunks for vector-like retrieval
  status: 'processing' | 'ready' | 'error';
}
