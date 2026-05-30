// ============================================
// DEVVAULT TYPE DEFINITIONS
// ============================================

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  is_default: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_deleted: number;
}

export interface Folder {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  folder_type: FolderType;
  sort_order: number;
  is_expanded: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_deleted: number;
  children?: Folder[];
  file_count?: number;
}

export type FolderType =
  | 'general'
  | 'web_dev'
  | 'app_dev'
  | 'seo'
  | 'frontend_fullstack'
  | 'backend_fullstack'
  | 'course'
  | 'prompts'
  | 'reminders'
  | 'notes'
  | 'snippets'
  | 'archive';

export interface VaultFile {
  id: string;
  folder_id: string;
  name: string;
  extension: string | null;
  mime_type: string | null;
  size_bytes: number;
  local_path: string | null;
  cloud_path: string | null;
  content_hash: string | null;
  thumbnail_path: string | null;
  is_favorited: number;
  is_pinned: number;
  open_count: number;
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_deleted: number;
}

export interface Note {
  id: string;
  folder_id: string;
  title: string;
  content_json: string | null;
  content_text: string | null;
  content_html: string | null;
  is_favorited: number;
  is_pinned: number;
  word_count: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_deleted: number;
}

export interface Prompt {
  id: string;
  folder_id: string | null;
  title: string;
  content: string;
  category: PromptCategory;
  language: string | null;
  variables: string | null;
  usage_count: number;
  is_favorited: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_deleted: number;
}

export type PromptCategory =
  | 'general'
  | 'coding'
  | 'debugging'
  | 'refactoring'
  | 'testing'
  | 'documentation'
  | 'seo'
  | 'design'
  | 'devops'
  | 'custom';

export interface PromptVariable {
  name: string;
  default_value: string;
}

export interface Reminder {
  id: string;
  folder_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'completed' | 'snoozed' | 'overdue';
  linked_file_id: string | null;
  linked_note_id: string | null;
  notify_before_minutes: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_deleted: number;
}

export interface Course {
  id: string;
  folder_id: string;
  name: string;
  instructor: string | null;
  platform: string | null;
  url: string | null;
  description: string | null;
  thumbnail_path: string | null;
  progress_percent: number;
  total_lessons: number;
  completed_lessons: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  started_at: string | null;
  completed_at: string | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_deleted: number;
}

export interface CourseSection {
  id: string;
  course_id: string;
  name: string;
  sort_order: number;
  is_completed: number;
  created_at: string;
  lessons?: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  section_id: string;
  course_id: string;
  name: string;
  duration_minutes: number | null;
  sort_order: number;
  is_completed: number;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  usage_count: number;
  created_at: string;
}

export interface Snippet {
  id: string;
  folder_id: string | null;
  title: string;
  code: string;
  language: string;
  description: string | null;
  is_favorited: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_deleted: number;
}

export interface Activity {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  action: string;
  metadata: string | null;
  created_at: string;
}

export interface SyncQueueItem {
  id: string;
  entity_type: string;
  entity_id: string;
  action: 'upsert' | 'delete';
  payload: string | null;
  status: string;
  retry_count: number;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface SearchResult {
  entity_type: string;
  entity_id: string;
  title: string;
  content: string;
  tags: string;
}

// UI types
export type ViewMode = 'grid' | 'list';
export type ThemeMode = 'light' | 'dark' | 'system';
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface SidebarSection {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
  children?: SidebarSection[];
}

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  category: string;
}

export interface FileTypeInfo {
  icon: string;
  color: string;
  category: 'document' | 'spreadsheet' | 'image' | 'video' | 'audio' | 'code' | 'archive' | 'pdf' | 'other';
  previewable: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}
