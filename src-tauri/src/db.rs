use tauri::AppHandle;
use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            sql: r#"
                CREATE TABLE IF NOT EXISTS workspace (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    icon TEXT DEFAULT 'folder',
                    color TEXT DEFAULT '#6366f1',
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    is_default INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                    synced_at TEXT,
                    is_deleted INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS folder (
                    id TEXT PRIMARY KEY,
                    workspace_id TEXT NOT NULL REFERENCES workspace(id),
                    parent_id TEXT REFERENCES folder(id),
                    name TEXT NOT NULL,
                    icon TEXT,
                    color TEXT,
                    folder_type TEXT DEFAULT 'general',
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    is_expanded INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                    synced_at TEXT,
                    is_deleted INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS file (
                    id TEXT PRIMARY KEY,
                    folder_id TEXT NOT NULL REFERENCES folder(id),
                    name TEXT NOT NULL,
                    extension TEXT,
                    mime_type TEXT,
                    size_bytes INTEGER NOT NULL DEFAULT 0,
                    local_path TEXT,
                    cloud_path TEXT,
                    content_hash TEXT,
                    thumbnail_path TEXT,
                    is_favorited INTEGER NOT NULL DEFAULT 0,
                    is_pinned INTEGER NOT NULL DEFAULT 0,
                    open_count INTEGER NOT NULL DEFAULT 0,
                    last_opened_at TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                    synced_at TEXT,
                    is_deleted INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS note (
                    id TEXT PRIMARY KEY,
                    folder_id TEXT NOT NULL REFERENCES folder(id),
                    title TEXT NOT NULL DEFAULT 'Untitled Note',
                    content_json TEXT,
                    content_text TEXT,
                    content_html TEXT,
                    is_favorited INTEGER NOT NULL DEFAULT 0,
                    is_pinned INTEGER NOT NULL DEFAULT 0,
                    word_count INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                    synced_at TEXT,
                    is_deleted INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS prompt (
                    id TEXT PRIMARY KEY,
                    folder_id TEXT REFERENCES folder(id),
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'general',
                    language TEXT,
                    variables TEXT,
                    usage_count INTEGER NOT NULL DEFAULT 0,
                    is_favorited INTEGER NOT NULL DEFAULT 0,
                    last_used_at TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                    synced_at TEXT,
                    is_deleted INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS reminder (
                    id TEXT PRIMARY KEY,
                    folder_id TEXT REFERENCES folder(id),
                    title TEXT NOT NULL,
                    description TEXT,
                    due_date TEXT,
                    due_time TEXT,
                    recurrence TEXT DEFAULT 'none',
                    priority TEXT NOT NULL DEFAULT 'medium',
                    status TEXT NOT NULL DEFAULT 'pending',
                    linked_file_id TEXT REFERENCES file(id),
                    linked_note_id TEXT REFERENCES note(id),
                    notify_before_minutes INTEGER DEFAULT 15,
                    completed_at TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                    synced_at TEXT,
                    is_deleted INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS course (
                    id TEXT PRIMARY KEY,
                    folder_id TEXT NOT NULL REFERENCES folder(id),
                    name TEXT NOT NULL,
                    instructor TEXT,
                    platform TEXT,
                    url TEXT,
                    description TEXT,
                    thumbnail_path TEXT,
                    progress_percent INTEGER NOT NULL DEFAULT 0,
                    total_lessons INTEGER NOT NULL DEFAULT 0,
                    completed_lessons INTEGER NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'not_started',
                    started_at TEXT,
                    completed_at TEXT,
                    rating INTEGER,
                    notes TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                    synced_at TEXT,
                    is_deleted INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS course_section (
                    id TEXT PRIMARY KEY,
                    course_id TEXT NOT NULL REFERENCES course(id),
                    name TEXT NOT NULL,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    is_completed INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS course_lesson (
                    id TEXT PRIMARY KEY,
                    section_id TEXT NOT NULL REFERENCES course_section(id),
                    course_id TEXT NOT NULL REFERENCES course(id),
                    name TEXT NOT NULL,
                    duration_minutes INTEGER,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    is_completed INTEGER NOT NULL DEFAULT 0,
                    completed_at TEXT,
                    notes TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS tag (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    color TEXT DEFAULT '#6366f1',
                    usage_count INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS taggable (
                    tag_id TEXT NOT NULL REFERENCES tag(id),
                    entity_type TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    PRIMARY KEY (tag_id, entity_type, entity_id)
                );

                CREATE TABLE IF NOT EXISTS snippet (
                    id TEXT PRIMARY KEY,
                    folder_id TEXT REFERENCES folder(id),
                    title TEXT NOT NULL,
                    code TEXT NOT NULL,
                    language TEXT NOT NULL DEFAULT 'plaintext',
                    description TEXT,
                    is_favorited INTEGER NOT NULL DEFAULT 0,
                    usage_count INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                    synced_at TEXT,
                    is_deleted INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS sync_queue (
                    id TEXT PRIMARY KEY,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    payload TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    retry_count INTEGER NOT NULL DEFAULT 0,
                    error_message TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    processed_at TEXT
                );

                CREATE TABLE IF NOT EXISTS activity (
                    id TEXT PRIMARY KEY,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    entity_name TEXT,
                    action TEXT NOT NULL,
                    metadata TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE INDEX IF NOT EXISTS idx_folder_workspace ON folder(workspace_id);
                CREATE INDEX IF NOT EXISTS idx_folder_parent ON folder(parent_id);
                CREATE INDEX IF NOT EXISTS idx_file_folder ON file(folder_id);
                CREATE INDEX IF NOT EXISTS idx_file_hash ON file(content_hash);
                CREATE INDEX IF NOT EXISTS idx_note_folder ON note(folder_id);
                CREATE INDEX IF NOT EXISTS idx_prompt_category ON prompt(category);
                CREATE INDEX IF NOT EXISTS idx_reminder_status ON reminder(status);
                CREATE INDEX IF NOT EXISTS idx_reminder_due ON reminder(due_date);
                CREATE INDEX IF NOT EXISTS idx_course_status ON course(status);
                CREATE INDEX IF NOT EXISTS idx_snippet_language ON snippet(language);
                CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
                CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at DESC);
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_fts_index",
            sql: r#"
                CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
                    entity_type,
                    entity_id UNINDEXED,
                    title,
                    content,
                    tags,
                    tokenize='porter unicode61'
                );
            "#,
            kind: MigrationKind::Up,
        },
    ]
}
