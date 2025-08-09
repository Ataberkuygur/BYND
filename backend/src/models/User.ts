export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  voiceSampleUrl?: string;
  elevenLabsVoiceId?: string;
  profile?: {
    name?: string;
    values?: string[];
    goals?: string[];
  };
}
