import type { FolderType, FileTypeInfo } from '$types';

export const APP_NAME = 'DevVault';
export const APP_VERSION = '0.1.0';
export const DB_NAME = 'sqlite:devvault.db';

// Folder type metadata
export const FOLDER_TYPE_META: Record<FolderType, { label: string; icon: string; color: string }> = {
  general: { label: 'General', icon: 'ph:folder', color: '#71717a' },
  web_dev: { label: 'Web Development', icon: 'ph:globe', color: '#3b82f6' },
  app_dev: { label: 'App Development', icon: 'ph:device-mobile', color: '#8b5cf6' },
  seo: { label: 'SEO Services', icon: 'ph:chart-line-up', color: '#22c55e' },
  frontend_fullstack: { label: 'Frontend Fullstack', icon: 'ph:layout', color: '#f59e0b' },
  backend_fullstack: { label: 'Backend Fullstack', icon: 'ph:database', color: '#ef4444' },
  course: { label: 'Courses', icon: 'ph:graduation-cap', color: '#14b8a6' },
  prompts: { label: 'Prompts', icon: 'ph:chat-dots', color: '#ec4899' },
  reminders: { label: 'Reminders', icon: 'ph:bell', color: '#f97316' },
  notes: { label: 'Notes', icon: 'ph:note-pencil', color: '#6366f1' },
  snippets: { label: 'Code Snippets', icon: 'ph:code', color: '#14b8a6' },
  archive: { label: 'Archive', icon: 'ph:archive', color: '#71717a' }
};

// File extension → type mapping
export const FILE_TYPE_MAP: Record<string, FileTypeInfo> = {
  // PDF
  pdf: { icon: 'ph:file-pdf', color: '#ef4444', category: 'pdf', previewable: true },
  // Documents
  doc: { icon: 'ph:file-doc', color: '#3b82f6', category: 'document', previewable: false },
  docx: { icon: 'ph:file-doc', color: '#3b82f6', category: 'document', previewable: true },
  txt: { icon: 'ph:file-text', color: '#71717a', category: 'document', previewable: true },
  rtf: { icon: 'ph:file-text', color: '#71717a', category: 'document', previewable: false },
  md: { icon: 'ph:markdown-logo', color: '#71717a', category: 'code', previewable: true },
  // Spreadsheets
  csv: { icon: 'ph:file-csv', color: '#22c55e', category: 'spreadsheet', previewable: true },
  tsv: { icon: 'ph:file-csv', color: '#22c55e', category: 'spreadsheet', previewable: true },
  xlsx: { icon: 'ph:file-xls', color: '#22c55e', category: 'spreadsheet', previewable: true },
  xls: { icon: 'ph:file-xls', color: '#22c55e', category: 'spreadsheet', previewable: false },
  // Images
  png: { icon: 'ph:file-image', color: '#8b5cf6', category: 'image', previewable: true },
  jpg: { icon: 'ph:file-image', color: '#8b5cf6', category: 'image', previewable: true },
  jpeg: { icon: 'ph:file-image', color: '#8b5cf6', category: 'image', previewable: true },
  gif: { icon: 'ph:file-image', color: '#8b5cf6', category: 'image', previewable: true },
  webp: { icon: 'ph:file-image', color: '#8b5cf6', category: 'image', previewable: true },
  svg: { icon: 'ph:file-svg', color: '#f59e0b', category: 'image', previewable: true },
  ico: { icon: 'ph:file-image', color: '#8b5cf6', category: 'image', previewable: true },
  // Video
  mp4: { icon: 'ph:file-video', color: '#ec4899', category: 'video', previewable: true },
  webm: { icon: 'ph:file-video', color: '#ec4899', category: 'video', previewable: true },
  mov: { icon: 'ph:file-video', color: '#ec4899', category: 'video', previewable: true },
  avi: { icon: 'ph:file-video', color: '#ec4899', category: 'video', previewable: false },
  // Audio
  mp3: { icon: 'ph:file-audio', color: '#f97316', category: 'audio', previewable: true },
  wav: { icon: 'ph:file-audio', color: '#f97316', category: 'audio', previewable: true },
  ogg: { icon: 'ph:file-audio', color: '#f97316', category: 'audio', previewable: true },
  // Code
  js: { icon: 'ph:file-js', color: '#f59e0b', category: 'code', previewable: true },
  ts: { icon: 'ph:file-ts', color: '#3b82f6', category: 'code', previewable: true },
  jsx: { icon: 'ph:file-jsx', color: '#06b6d4', category: 'code', previewable: true },
  tsx: { icon: 'ph:file-tsx', color: '#3b82f6', category: 'code', previewable: true },
  svelte: { icon: 'ph:code', color: '#ff3e00', category: 'code', previewable: true },
  vue: { icon: 'ph:code', color: '#42b883', category: 'code', previewable: true },
  py: { icon: 'ph:file-py', color: '#3776ab', category: 'code', previewable: true },
  rs: { icon: 'ph:code', color: '#dea584', category: 'code', previewable: true },
  go: { icon: 'ph:code', color: '#00add8', category: 'code', previewable: true },
  java: { icon: 'ph:code', color: '#b07219', category: 'code', previewable: true },
  css: { icon: 'ph:file-css', color: '#264de4', category: 'code', previewable: true },
  scss: { icon: 'ph:file-css', color: '#cd6799', category: 'code', previewable: true },
  html: { icon: 'ph:file-html', color: '#e34c26', category: 'code', previewable: true },
  json: { icon: 'ph:brackets-curly', color: '#71717a', category: 'code', previewable: true },
  yaml: { icon: 'ph:file-text', color: '#71717a', category: 'code', previewable: true },
  yml: { icon: 'ph:file-text', color: '#71717a', category: 'code', previewable: true },
  toml: { icon: 'ph:file-text', color: '#71717a', category: 'code', previewable: true },
  sql: { icon: 'ph:database', color: '#336791', category: 'code', previewable: true },
  sh: { icon: 'ph:terminal', color: '#71717a', category: 'code', previewable: true },
  bash: { icon: 'ph:terminal', color: '#71717a', category: 'code', previewable: true },
  // Archives
  zip: { icon: 'ph:file-zip', color: '#f59e0b', category: 'archive', previewable: false },
  tar: { icon: 'ph:file-zip', color: '#f59e0b', category: 'archive', previewable: false },
  gz: { icon: 'ph:file-zip', color: '#f59e0b', category: 'archive', previewable: false },
  rar: { icon: 'ph:file-zip', color: '#f59e0b', category: 'archive', previewable: false },
};

export const DEFAULT_FILE_TYPE: FileTypeInfo = {
  icon: 'ph:file',
  color: '#71717a',
  category: 'other',
  previewable: false,
};

export function getFileTypeInfo(extension: string | null): FileTypeInfo {
  if (!extension) return DEFAULT_FILE_TYPE;
  return FILE_TYPE_MAP[extension.toLowerCase()] ?? DEFAULT_FILE_TYPE;
}

// Prompt categories
export const PROMPT_CATEGORIES = [
  { value: 'general', label: 'General', icon: 'ph:chat-dots' },
  { value: 'coding', label: 'Coding', icon: 'ph:code' },
  { value: 'debugging', label: 'Debugging', icon: 'ph:bug' },
  { value: 'refactoring', label: 'Refactoring', icon: 'ph:arrows-clockwise' },
  { value: 'testing', label: 'Testing', icon: 'ph:test-tube' },
  { value: 'documentation', label: 'Documentation', icon: 'ph:book-open' },
  { value: 'seo', label: 'SEO', icon: 'ph:chart-line-up' },
  { value: 'design', label: 'Design', icon: 'ph:paint-brush' },
  { value: 'devops', label: 'DevOps', icon: 'ph:cloud' },
  { value: 'custom', label: 'Custom', icon: 'ph:star' },
];

// Supported languages for snippets
export const LANGUAGES = [
  'javascript', 'typescript', 'python', 'rust', 'go', 'java', 'svelte',
  'html', 'css', 'scss', 'sql', 'json', 'yaml', 'toml', 'markdown',
  'bash', 'shell', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'c',
  'cpp', 'csharp', 'plaintext',
];

// Course platforms
export const COURSE_PLATFORMS = [
  'Udemy', 'Coursera', 'YouTube', 'Pluralsight', 'LinkedIn Learning',
  'Frontend Masters', 'Egghead', 'Codecademy', 'freeCodeCamp', 'Custom',
];
