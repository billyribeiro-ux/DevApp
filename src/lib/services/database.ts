import Database from '@tauri-apps/plugin-sql';
import { DB_NAME } from '$config/constants';
import type {
  Workspace, Folder, VaultFile, Note, Prompt, Reminder,
  Course, CourseSection, CourseLesson, Tag, Snippet, Activity, SearchResult, FolderType
} from '$types';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load(DB_NAME);
  }
  return db;
}

// Column whitelists to prevent SQL injection via dynamic UPDATE queries
const FOLDER_COLUMNS = new Set(['workspace_id', 'parent_id', 'name', 'icon', 'color', 'folder_type', 'sort_order', 'is_expanded', 'is_deleted']);
const FILE_COLUMNS = new Set(['folder_id', 'name', 'extension', 'mime_type', 'size_bytes', 'local_path', 'cloud_path', 'content_hash', 'thumbnail_path', 'is_favorited', 'is_pinned', 'open_count', 'last_opened_at', 'is_deleted']);
const NOTE_COLUMNS = new Set(['folder_id', 'title', 'content_json', 'content_text', 'content_html', 'is_favorited', 'is_pinned', 'word_count', 'is_deleted']);
const PROMPT_COLUMNS = new Set(['folder_id', 'title', 'content', 'category', 'language', 'variables', 'usage_count', 'is_favorited', 'last_used_at', 'is_deleted']);
const REMINDER_COLUMNS = new Set(['folder_id', 'title', 'description', 'due_date', 'due_time', 'recurrence', 'priority', 'status', 'linked_file_id', 'linked_note_id', 'notify_before_minutes', 'completed_at', 'is_deleted']);
const COURSE_COLUMNS = new Set(['folder_id', 'name', 'instructor', 'platform', 'url', 'description', 'thumbnail_path', 'progress_percent', 'total_lessons', 'completed_lessons', 'status', 'started_at', 'completed_at', 'rating', 'notes', 'is_deleted']);
const SNIPPET_COLUMNS = new Set(['folder_id', 'title', 'code', 'language', 'description', 'is_favorited', 'usage_count', 'is_deleted']);

function buildSafeUpdate(table: string, id: string, updates: Record<string, unknown>, allowedColumns: Set<string>): { query: string; values: unknown[] } {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (key !== 'id' && allowedColumns.has(key)) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }
  fields.push(`updated_at = datetime('now')`);
  values.push(id);

  return { query: `UPDATE ${table} SET ${fields.join(', ')} WHERE id = $${idx}`, values };
}

// ============================================
// WORKSPACE OPERATIONS
// ============================================

export async function getWorkspaces(): Promise<Workspace[]> {
  const d = await getDb();
  return d.select('SELECT * FROM workspace WHERE is_deleted = 0 ORDER BY sort_order');
}

export async function createWorkspace(workspace: Partial<Workspace>): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT INTO workspace (id, name, icon, color, sort_order, is_default) VALUES ($1, $2, $3, $4, $5, $6)',
    [workspace.id, workspace.name, workspace.icon ?? 'folder', workspace.color ?? '#6366f1', workspace.sort_order ?? 0, workspace.is_default ?? 0]
  );
}

// ============================================
// FOLDER OPERATIONS
// ============================================

export async function getFolders(workspaceId: string): Promise<Folder[]> {
  const d = await getDb();
  return d.select(
    'SELECT * FROM folder WHERE workspace_id = $1 AND is_deleted = 0 ORDER BY sort_order',
    [workspaceId]
  );
}

export async function getSubfolders(parentId: string): Promise<Folder[]> {
  const d = await getDb();
  return d.select(
    'SELECT * FROM folder WHERE parent_id = $1 AND is_deleted = 0 ORDER BY sort_order',
    [parentId]
  );
}

export async function createFolder(folder: Partial<Folder>): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT INTO folder (id, workspace_id, parent_id, name, icon, color, folder_type, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [folder.id, folder.workspace_id, folder.parent_id ?? null, folder.name, folder.icon ?? null, folder.color ?? null, folder.folder_type ?? 'general', folder.sort_order ?? 0]
  );
}

export async function updateFolder(id: string, updates: Partial<Folder>): Promise<void> {
  const d = await getDb();
  const { query, values } = buildSafeUpdate('folder', id, updates as Record<string, unknown>, FOLDER_COLUMNS);
  await d.execute(query, values);
}

export async function deleteFolder(id: string): Promise<void> {
  const d = await getDb();
  await d.execute("UPDATE folder SET is_deleted = 1, updated_at = datetime('now') WHERE id = $1", [id]);
}

// ============================================
// FILE OPERATIONS
// ============================================

export async function getFiles(folderId: string): Promise<VaultFile[]> {
  const d = await getDb();
  return d.select(
    'SELECT * FROM file WHERE folder_id = $1 AND is_deleted = 0 ORDER BY is_pinned DESC, name ASC',
    [folderId]
  );
}

export async function getAllFiles(): Promise<VaultFile[]> {
  const d = await getDb();
  return d.select('SELECT * FROM file WHERE is_deleted = 0 ORDER BY updated_at DESC LIMIT 100');
}

export async function getRecentFiles(limit: number = 10): Promise<VaultFile[]> {
  const d = await getDb();
  return d.select(
    'SELECT * FROM file WHERE is_deleted = 0 ORDER BY updated_at DESC LIMIT $1',
    [limit]
  );
}

export async function getFavoritedFiles(): Promise<VaultFile[]> {
  const d = await getDb();
  return d.select('SELECT * FROM file WHERE is_favorited = 1 AND is_deleted = 0 ORDER BY name');
}

export async function createFile(file: Partial<VaultFile>): Promise<void> {
  const d = await getDb();
  await d.execute(
    `INSERT INTO file (id, folder_id, name, extension, mime_type, size_bytes, local_path, cloud_path, content_hash, is_favorited, is_pinned)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [file.id, file.folder_id, file.name, file.extension ?? null, file.mime_type ?? null,
     file.size_bytes ?? 0, file.local_path ?? null, file.cloud_path ?? null,
     file.content_hash ?? null, file.is_favorited ?? 0, file.is_pinned ?? 0]
  );
}

export async function updateFile(id: string, updates: Partial<VaultFile>): Promise<void> {
  const d = await getDb();
  const { query, values } = buildSafeUpdate('file', id, updates as Record<string, unknown>, FILE_COLUMNS);
  await d.execute(query, values);
}

export async function deleteFile(id: string): Promise<void> {
  const d = await getDb();
  await d.execute("UPDATE file SET is_deleted = 1, updated_at = datetime('now') WHERE id = $1", [id]);
}

export async function permanentDeleteFile(id: string): Promise<void> {
  const d = await getDb();
  await d.execute('DELETE FROM file WHERE id = $1', [id]);
}

export async function getTrashFiles(): Promise<VaultFile[]> {
  const d = await getDb();
  return d.select('SELECT * FROM file WHERE is_deleted = 1 ORDER BY updated_at DESC');
}

export async function restoreFile(id: string): Promise<void> {
  const d = await getDb();
  await d.execute("UPDATE file SET is_deleted = 0, updated_at = datetime('now') WHERE id = $1", [id]);
}

// ============================================
// NOTE OPERATIONS
// ============================================

export async function getNotes(folderId?: string): Promise<Note[]> {
  const d = await getDb();
  if (folderId) {
    return d.select(
      'SELECT * FROM note WHERE folder_id = $1 AND is_deleted = 0 ORDER BY is_pinned DESC, updated_at DESC',
      [folderId]
    );
  }
  return d.select('SELECT * FROM note WHERE is_deleted = 0 ORDER BY is_pinned DESC, updated_at DESC');
}

export async function getNote(id: string): Promise<Note | null> {
  const d = await getDb();
  const results: Note[] = await d.select('SELECT * FROM note WHERE id = $1', [id]);
  return results[0] ?? null;
}

export async function createNote(note: Partial<Note>): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT INTO note (id, folder_id, title, content_json, content_text, content_html, word_count) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [note.id, note.folder_id, note.title ?? 'Untitled Note', note.content_json ?? null, note.content_text ?? null, note.content_html ?? null, note.word_count ?? 0]
  );
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  const d = await getDb();
  const { query, values } = buildSafeUpdate('note', id, updates as Record<string, unknown>, NOTE_COLUMNS);
  await d.execute(query, values);
}

export async function deleteNote(id: string): Promise<void> {
  const d = await getDb();
  await d.execute("UPDATE note SET is_deleted = 1, updated_at = datetime('now') WHERE id = $1", [id]);
}

// ============================================
// PROMPT OPERATIONS
// ============================================

export async function getPrompts(category?: string): Promise<Prompt[]> {
  const d = await getDb();
  if (category && category !== 'all') {
    return d.select(
      'SELECT * FROM prompt WHERE category = $1 AND is_deleted = 0 ORDER BY is_favorited DESC, usage_count DESC',
      [category]
    );
  }
  return d.select('SELECT * FROM prompt WHERE is_deleted = 0 ORDER BY is_favorited DESC, usage_count DESC');
}

export async function createPrompt(prompt: Partial<Prompt>): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT INTO prompt (id, folder_id, title, content, category, language, variables) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [prompt.id, prompt.folder_id ?? null, prompt.title, prompt.content, prompt.category ?? 'general', prompt.language ?? null, prompt.variables ?? null]
  );
}

export async function updatePrompt(id: string, updates: Partial<Prompt>): Promise<void> {
  const d = await getDb();
  const { query, values } = buildSafeUpdate('prompt', id, updates as Record<string, unknown>, PROMPT_COLUMNS);
  await d.execute(query, values);
}

export async function deletePrompt(id: string): Promise<void> {
  const d = await getDb();
  await d.execute("UPDATE prompt SET is_deleted = 1, updated_at = datetime('now') WHERE id = $1", [id]);
}

export async function incrementPromptUsage(id: string): Promise<void> {
  const d = await getDb();
  await d.execute(
    "UPDATE prompt SET usage_count = usage_count + 1, last_used_at = datetime('now'), updated_at = datetime('now') WHERE id = $1",
    [id]
  );
}

// ============================================
// REMINDER OPERATIONS
// ============================================

export async function getReminders(status?: string): Promise<Reminder[]> {
  const d = await getDb();
  if (status && status !== 'all') {
    return d.select(
      'SELECT * FROM reminder WHERE status = $1 AND is_deleted = 0 ORDER BY due_date ASC, priority DESC',
      [status]
    );
  }
  return d.select('SELECT * FROM reminder WHERE is_deleted = 0 ORDER BY CASE status WHEN \'overdue\' THEN 0 WHEN \'pending\' THEN 1 WHEN \'snoozed\' THEN 2 WHEN \'completed\' THEN 3 END, due_date ASC');
}

export async function createReminder(reminder: Partial<Reminder>): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT INTO reminder (id, folder_id, title, description, due_date, due_time, recurrence, priority, status, notify_before_minutes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
    [reminder.id, reminder.folder_id ?? null, reminder.title, reminder.description ?? null, reminder.due_date ?? null, reminder.due_time ?? null, reminder.recurrence ?? 'none', reminder.priority ?? 'medium', reminder.status ?? 'pending', reminder.notify_before_minutes ?? 15]
  );
}

export async function updateReminder(id: string, updates: Partial<Reminder>): Promise<void> {
  const d = await getDb();
  const { query, values } = buildSafeUpdate('reminder', id, updates as Record<string, unknown>, REMINDER_COLUMNS);
  await d.execute(query, values);
}

export async function completeReminder(id: string): Promise<void> {
  const d = await getDb();
  await d.execute(
    "UPDATE reminder SET status = 'completed', completed_at = datetime('now'), updated_at = datetime('now') WHERE id = $1",
    [id]
  );
}

export async function uncompleteReminder(id: string): Promise<void> {
  const d = await getDb();
  await d.execute(
    "UPDATE reminder SET status = 'pending', completed_at = NULL, updated_at = datetime('now') WHERE id = $1",
    [id]
  );
}

export async function deleteReminder(id: string): Promise<void> {
  const d = await getDb();
  await d.execute("UPDATE reminder SET is_deleted = 1, updated_at = datetime('now') WHERE id = $1", [id]);
}

// ============================================
// COURSE OPERATIONS
// ============================================

export async function getCourses(status?: string): Promise<Course[]> {
  const d = await getDb();
  if (status && status !== 'all') {
    return d.select(
      'SELECT * FROM course WHERE status = $1 AND is_deleted = 0 ORDER BY updated_at DESC',
      [status]
    );
  }
  return d.select('SELECT * FROM course WHERE is_deleted = 0 ORDER BY updated_at DESC');
}

export async function getCourse(id: string): Promise<Course | null> {
  const d = await getDb();
  const results: Course[] = await d.select('SELECT * FROM course WHERE id = $1', [id]);
  return results[0] ?? null;
}

export async function createCourse(course: Partial<Course>): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT INTO course (id, folder_id, name, instructor, platform, url, description, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [course.id, course.folder_id, course.name, course.instructor ?? null, course.platform ?? null, course.url ?? null, course.description ?? null, course.status ?? 'not_started']
  );
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<void> {
  const d = await getDb();
  const { query, values } = buildSafeUpdate('course', id, updates as Record<string, unknown>, COURSE_COLUMNS);
  await d.execute(query, values);
}

export async function deleteCourse(id: string): Promise<void> {
  const d = await getDb();
  await d.execute("UPDATE course SET is_deleted = 1, updated_at = datetime('now') WHERE id = $1", [id]);
}

export async function getCourseSections(courseId: string): Promise<CourseSection[]> {
  const d = await getDb();
  return d.select('SELECT * FROM course_section WHERE course_id = $1 ORDER BY sort_order', [courseId]);
}

export async function createCourseSection(section: Partial<CourseSection>): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT INTO course_section (id, course_id, name, sort_order) VALUES ($1, $2, $3, $4)',
    [section.id, section.course_id, section.name, section.sort_order ?? 0]
  );
}

export async function getCourseLessons(sectionId: string): Promise<CourseLesson[]> {
  const d = await getDb();
  return d.select('SELECT * FROM course_lesson WHERE section_id = $1 ORDER BY sort_order', [sectionId]);
}

export async function createCourseLesson(lesson: Partial<CourseLesson>): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT INTO course_lesson (id, section_id, course_id, name, duration_minutes, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
    [lesson.id, lesson.section_id, lesson.course_id, lesson.name, lesson.duration_minutes ?? null, lesson.sort_order ?? 0]
  );
}

export async function toggleLessonComplete(id: string, completed: boolean): Promise<void> {
  const d = await getDb();
  await d.execute(
    `UPDATE course_lesson SET is_completed = $1, completed_at = ${completed ? "datetime('now')" : 'NULL'} WHERE id = $2`,
    [completed ? 1 : 0, id]
  );
}

// ============================================
// SNIPPET OPERATIONS
// ============================================

export async function getSnippets(language?: string): Promise<Snippet[]> {
  const d = await getDb();
  if (language && language !== 'all') {
    return d.select(
      'SELECT * FROM snippet WHERE language = $1 AND is_deleted = 0 ORDER BY is_favorited DESC, usage_count DESC',
      [language]
    );
  }
  return d.select('SELECT * FROM snippet WHERE is_deleted = 0 ORDER BY is_favorited DESC, usage_count DESC');
}

export async function createSnippet(snippet: Partial<Snippet>): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT INTO snippet (id, folder_id, title, code, language, description) VALUES ($1, $2, $3, $4, $5, $6)',
    [snippet.id, snippet.folder_id ?? null, snippet.title, snippet.code, snippet.language ?? 'plaintext', snippet.description ?? null]
  );
}

export async function updateSnippet(id: string, updates: Partial<Snippet>): Promise<void> {
  const d = await getDb();
  const { query, values } = buildSafeUpdate('snippet', id, updates as Record<string, unknown>, SNIPPET_COLUMNS);
  await d.execute(query, values);
}

export async function deleteSnippet(id: string): Promise<void> {
  const d = await getDb();
  await d.execute("UPDATE snippet SET is_deleted = 1, updated_at = datetime('now') WHERE id = $1", [id]);
}

// ============================================
// TAG OPERATIONS
// ============================================

export async function getTags(): Promise<Tag[]> {
  const d = await getDb();
  return d.select('SELECT * FROM tag ORDER BY usage_count DESC, name ASC');
}

export async function createTag(tag: Partial<Tag>): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT INTO tag (id, name, color) VALUES ($1, $2, $3)',
    [tag.id, tag.name, tag.color ?? '#6366f1']
  );
}

export async function getEntityTags(entityType: string, entityId: string): Promise<Tag[]> {
  const d = await getDb();
  return d.select(
    'SELECT t.* FROM tag t JOIN taggable tg ON t.id = tg.tag_id WHERE tg.entity_type = $1 AND tg.entity_id = $2',
    [entityType, entityId]
  );
}

export async function tagEntity(tagId: string, entityType: string, entityId: string): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT OR IGNORE INTO taggable (tag_id, entity_type, entity_id) VALUES ($1, $2, $3)',
    [tagId, entityType, entityId]
  );
  await d.execute('UPDATE tag SET usage_count = usage_count + 1 WHERE id = $1', [tagId]);
}

// ============================================
// ACTIVITY OPERATIONS
// ============================================

export async function getActivities(limit: number = 50): Promise<Activity[]> {
  const d = await getDb();
  return d.select('SELECT * FROM activity ORDER BY created_at DESC LIMIT $1', [limit]);
}

export async function logActivity(activity: Partial<Activity>): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT INTO activity (id, entity_type, entity_id, entity_name, action, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
    [activity.id, activity.entity_type, activity.entity_id, activity.entity_name ?? null, activity.action, activity.metadata ?? null]
  );
}

// ============================================
// SEARCH
// ============================================

export async function searchAll(query: string): Promise<SearchResult[]> {
  const d = await getDb();
  return d.select(
    "SELECT * FROM search_index WHERE search_index MATCH $1 ORDER BY rank LIMIT 50",
    [query]
  );
}

// ============================================
// SETTINGS
// ============================================

export async function getSetting(key: string): Promise<string | null> {
  const d = await getDb();
  const results: { value: string }[] = await d.select('SELECT value FROM settings WHERE key = $1', [key]);
  return results[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const d = await getDb();
  await d.execute(
    "INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = datetime('now')",
    [key, value]
  );
}

// ============================================
// SEED DEFAULT DATA
// ============================================

export async function seedDefaultData(): Promise<void> {
  const d = await getDb();

  // Check if we already have data
  const workspaces: Workspace[] = await d.select('SELECT * FROM workspace LIMIT 1');
  if (workspaces.length > 0) return;

  const { v4: uuid } = await import('uuid');

  // Create default workspace
  const workspaceId = uuid();
  await createWorkspace({
    id: workspaceId,
    name: 'My Vault',
    icon: 'vault',
    color: '#6366f1',
    sort_order: 0,
    is_default: 1
  });

  // Create default folder structure
  const folders: { name: string; type: FolderType; icon: string; color: string; children?: { name: string }[] }[] = [
    { name: 'Web Development', type: 'web_dev', icon: 'ph:globe', color: '#3b82f6', children: [
      { name: 'HTML & CSS' }, { name: 'JavaScript' }, { name: 'TypeScript' }, { name: 'Frameworks' }, { name: 'APIs & Integrations' }, { name: 'Templates' }
    ]},
    { name: 'App Development', type: 'app_dev', icon: 'ph:device-mobile', color: '#8b5cf6', children: [
      { name: 'iOS' }, { name: 'Android' }, { name: 'Cross-Platform' }, { name: 'Desktop' }, { name: 'PWA' }
    ]},
    { name: 'SEO Services', type: 'seo', icon: 'ph:chart-line-up', color: '#22c55e', children: [
      { name: 'Audits' }, { name: 'Keyword Research' }, { name: 'Link Building' }, { name: 'Analytics Reports' }, { name: 'Schema Markup' }, { name: 'Templates' }
    ]},
    { name: 'Frontend Fullstack', type: 'frontend_fullstack', icon: 'ph:layout', color: '#f59e0b', children: [
      { name: 'Svelte & SvelteKit' }, { name: 'React & Next.js' }, { name: 'Vue & Nuxt' }, { name: 'UI Libraries' }, { name: 'Design Systems' }, { name: 'Boilerplates' }
    ]},
    { name: 'Backend Fullstack', type: 'backend_fullstack', icon: 'ph:database', color: '#ef4444', children: [
      { name: 'Node.js & Express' }, { name: 'Python & Django' }, { name: 'Rust' }, { name: 'Go' }, { name: 'Databases' }, { name: 'DevOps & CI/CD' }
    ]},
    { name: 'Courses', type: 'course', icon: 'ph:graduation-cap', color: '#14b8a6' },
    { name: 'Notes', type: 'notes', icon: 'ph:note-pencil', color: '#6366f1', children: [
      { name: 'Quick Notes' }, { name: 'Meeting Notes' }, { name: 'Technical Docs' }, { name: 'Ideas' }
    ]},
    { name: 'Prompts Library', type: 'prompts', icon: 'ph:chat-dots', color: '#ec4899', children: [
      { name: 'Coding' }, { name: 'Debugging' }, { name: 'SEO' }, { name: 'Documentation' }, { name: 'Custom' }
    ]},
    { name: 'Code Snippets', type: 'snippets', icon: 'ph:code', color: '#14b8a6', children: [
      { name: 'JavaScript' }, { name: 'TypeScript' }, { name: 'CSS' }, { name: 'Python' }, { name: 'Rust' }, { name: 'SQL' }, { name: 'Shell' }
    ]},
    { name: 'Archive', type: 'archive', icon: 'ph:archive', color: '#71717a' },
  ];

  for (let i = 0; i < folders.length; i++) {
    const f = folders[i];
    const folderId = uuid();
    await createFolder({
      id: folderId,
      workspace_id: workspaceId,
      parent_id: null,
      name: f.name,
      icon: f.icon,
      color: f.color,
      folder_type: f.type,
      sort_order: i
    });

    if (f.children) {
      for (let j = 0; j < f.children.length; j++) {
        await createFolder({
          id: uuid(),
          workspace_id: workspaceId,
          parent_id: folderId,
          name: f.children[j].name,
          icon: null,
          color: null,
          folder_type: 'general',
          sort_order: j
        });
      }
    }
  }
}
