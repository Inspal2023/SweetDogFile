
export interface Agent {
  id: string;
  name: string;
  description: string;
  masterPrompt: string;
}

export interface FileNode {
  name: string;
  path: string;
  content: string | ArrayBuffer | null;
  type: 'file' | 'directory';
  children?: FileNode[];
  mimeType?: string;
}

export enum AnalysisStatus {
  Idle = 'idle',
  Processing = 'processing',
  Summarizing = 'summarizing',
  Generating = 'generating',
  Success = 'success',
  Error = 'error',
}
