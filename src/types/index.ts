export interface Note {
  id: string;
  content: string; // HTML content
  fontSize: number;
  color: string;
  backgroundColor?: string;
  images?: string[]; // base64 or download URLs
  createdAt: number;
  updatedAt: number;
  order: number;
}

export interface Book {
  id: string;
  title: string;
  coverColor: string;
  coverTitleColor?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  notes?: Record<string, Note>;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: number;
}
