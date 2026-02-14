# DevVault - Personal Developer Workspace & Cloud Sync Desktop App

## Complete Architecture & Implementation Plan

> **Codename:** DevVault
> **Author:** Principal Engineer ICT Level 7
> **Stack:** Tauri v2 + SvelteKit + Svelte 5 (Runes) + Supabase + SQLite
> **Target:** macOS / Windows / Linux Desktop App with Real-Time Cross-Device Sync

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Philosophy & Design Principles](#2-core-philosophy--design-principles)
3. [Technology Stack Deep Dive](#3-technology-stack-deep-dive)
4. [Application Architecture](#4-application-architecture)
5. [Database Schema Design](#5-database-schema-design)
6. [Feature Specification](#6-feature-specification)
7. [UI/UX Design System](#7-uiux-design-system)
8. [Sync Engine Architecture](#8-sync-engine-architecture)
9. [File Preview Engine](#9-file-preview-engine)
10. [Keyboard Shortcuts & Command Palette](#10-keyboard-shortcuts--command-palette)
11. [Security & Encryption](#11-security--encryption)
12. [Project Structure](#12-project-structure)
13. [Implementation Phases](#13-implementation-phases)
14. [Performance Targets](#14-performance-targets)

---

## 1. Executive Summary

**DevVault** is a premium, offline-first desktop application purpose-built for developers who manage files, notes, prompts, reminders, and course materials across multiple machines. It functions as a personal knowledge base, file vault, and developer workspace — all wrapped in a portfolio-grade UI with seamless cross-device synchronization.

### The Problem It Solves
- Files scattered across Downloads, Desktop, random folders
- Notes lost between machines
- No unified place for prompts, code snippets, reminders
- Course materials disorganized
- Context-switching between apps kills productivity

### The Solution
One beautiful, lightning-fast desktop app where everything lives, syncs, and is instantly searchable.

---

## 2. Core Philosophy & Design Principles

| Principle | Description |
|-----------|-------------|
| **Offline-First** | Every operation works without internet. Sync happens in the background when connectivity is available. |
| **Zero Friction** | Drag, drop, done. No config wizards, no manual sync buttons. It just works. |
| **Sub-100ms UI** | Every interaction responds in under 100ms. GSAP animations mask any async work. |
| **Data Ownership** | Your files, your encryption keys, your Supabase instance. Full control. |
| **Svelte 5 Native** | Built entirely with Svelte 5 Runes (`$state`, `$derived`, `$effect`, `$bindable`, `$props`), Snippets (`{#snippet}`/`{@render}`), and the latest Feb 2026 APIs. Zero legacy syntax. |
| **Portfolio-Grade** | Every pixel, animation, and interaction designed to impress at first glance. |

---

## 3. Technology Stack Deep Dive

### 3.1 Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **SvelteKit** | 2.x (Latest Feb 2026) | App framework with file-based routing, SSR adapter for Tauri |
| **Svelte 5** | 5.x (Latest Feb 2026) | UI with Runes reactivity, Snippets, fine-grained reactivity |
| **Tauri v2** | 2.x | Lightweight desktop runtime (Rust core, ~8MB bundle vs Electron's 150MB+) |
| **Phosphor Icons** | Latest | Primary icon library — 1,500+ icons, 6 weights |
| **Iconify** | Latest | Supplementary icons — 200,000+ icons from 150+ sets |
| **GSAP** | 3.x | Premium animations — page transitions, micro-interactions, spring physics |
| **TailwindCSS v4** | 4.x | Utility-first CSS with CSS-first configuration |
| **Bits UI** | Latest | Headless, accessible Svelte component primitives |
| **Shiki** | Latest | Syntax highlighting for code file previews |
| **pdf.js** | Latest | PDF rendering in-app |
| **Mammoth.js** | Latest | DOCX → HTML conversion for Word previews |
| **PapaParse** | Latest | CSV/TSV parsing for spreadsheet previews |
| **Tiptap** | 2.x | Rich text editor for notes (with Svelte adapter) |
| **Fuse.js** | Latest | Client-side fuzzy search |
| **date-fns** | Latest | Lightweight date utilities |

### 3.2 Backend / Cloud

| Technology | Purpose |
|-----------|---------|
| **Supabase** | PostgreSQL database, Auth (Magic Links + Email/Password), Realtime subscriptions, Storage (S3-compatible) |
| **Supabase Auth** | Authentication with magic links, email/password, and device sessions |
| **Supabase Storage** | File storage with per-user buckets, resumable uploads, CDN delivery |
| **Supabase Realtime** | WebSocket-based change notifications for instant cross-device sync |
| **PostgreSQL (via Supabase)** | Cloud database for metadata, sync state, file manifests |

### 3.3 Desktop / Native Layer (Tauri Rust Core)

| Component | Purpose |
|-----------|---------|
| **tauri-plugin-sql** | SQLite access for local database |
| **tauri-plugin-fs** | Native filesystem access for file operations |
| **tauri-plugin-dialog** | Native file open/save dialogs |
| **tauri-plugin-notification** | System-level notifications for reminders |
| **tauri-plugin-global-shortcut** | System-wide keyboard shortcuts |
| **tauri-plugin-autostart** | Launch on system boot (optional) |
| **tauri-plugin-updater** | Auto-update from GitHub releases |
| **tauri-plugin-store** | Encrypted key-value store for tokens/settings |
| **tauri-plugin-clipboard** | Clipboard read/write for copy operations |
| **tauri-plugin-shell** | Open files in system default apps |
| **tauri-plugin-deep-link** | Handle `devvault://` protocol for auth callbacks |
| **blake3** (Rust crate) | Ultra-fast file hashing for delta sync |
| **zstd** (Rust crate) | Compression for file chunks before upload |

### 3.4 Why This Stack?

- **Tauri v2 over Electron**: 8MB bundle vs 150MB+. Uses system WebView. Rust backend is memory-safe and blazing fast. Multi-window support. Plugin ecosystem.
- **Svelte 5 over React/Vue**: Smallest bundle, fastest runtime, no virtual DOM overhead. Runes provide true fine-grained reactivity. Compiler-first approach = less JavaScript shipped.
- **Supabase over Firebase**: Open-source, PostgreSQL (not proprietary), Row Level Security, better developer experience, self-hostable if desired.
- **SQLite locally**: Embedded, zero-config, handles millions of records, full-text search built in.

---

## 4. Application Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DEVVAULT DESKTOP APP                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    SvelteKit Frontend                     │   │
│  │                                                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │   │
│  │  │  Vault   │ │  Notes   │ │  Course  │ │  Command   │  │   │
│  │  │ Explorer │ │  Editor  │ │  Manager │ │  Palette   │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │   │
│  │  │ Prompts  │ │Reminders │ │  File    │ │  Settings  │  │   │
│  │  │  Library │ │  System  │ │  Preview │ │  Panel     │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────────┐│   │
│  │  │            Svelte 5 State Layer (Runes)              ││   │
│  │  │  $state ←→ $derived ←→ $effect ←→ Context API       ││   │
│  │  └──────────────────────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                    Tauri IPC Bridge                               │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Tauri Rust Core                         │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │   │
│  │  │   SQLite     │  │  Sync Engine │  │  File Hasher   │  │   │
│  │  │   Database   │  │  (Delta Sync)│  │  (blake3+zstd) │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────────┘  │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │   │
│  │  │  Filesystem  │  │  Auth Manager│  │  Notification  │  │   │
│  │  │  Watcher     │  │  (JWT/Token) │  │  Scheduler     │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                     HTTPS / WebSocket
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE CLOUD                            │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │PostgreSQL│  │  Auth    │  │ Storage  │  │   Realtime     │  │
│  │ Database │  │ (Magic   │  │ (S3 File │  │  (WebSocket    │  │
│  │ + RLS    │  │  Links)  │  │  Buckets)│  │   Subscriptions│  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow

```
User Action (Drop file, Create note, etc.)
        │
        ▼
  SvelteKit Frontend (Immediate UI update via $state)
        │
        ▼
  Tauri IPC Command → Rust Core
        │
        ├──→ Write to Local SQLite (instant)
        ├──→ Store file in local vault directory
        ├──→ Queue sync operation
        │
        ▼
  Sync Engine (background, non-blocking)
        │
        ├──→ Hash file chunks (blake3)
        ├──→ Compress changed chunks (zstd)
        ├──→ Upload to Supabase Storage
        ├──→ Update PostgreSQL metadata
        │
        ▼
  Supabase Realtime → Pushes change to other devices
        │
        ▼
  Other Device: Sync Engine pulls changes → SQLite + Local Files → UI updates
```

### 4.3 Offline-First Flow

```
ONLINE:  User Action → Local DB → UI Update → Background Sync → Cloud
OFFLINE: User Action → Local DB → UI Update → Queue in sync_queue table
RECONNECT: Sync Engine processes queue → Uploads all pending → Resolves conflicts
```

---

## 5. Database Schema Design

### 5.1 Local SQLite Schema

```sql
-- ============================================================
-- CORE TABLES
-- ============================================================

-- User profile and device identity
CREATE TABLE device (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    device_name TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'macos', 'windows', 'linux'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_sync_at TEXT
);

-- Workspaces (top-level containers)
CREATE TABLE workspace (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'folder',
    color TEXT DEFAULT '#6366f1',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

-- Folders (hierarchical, self-referencing)
CREATE TABLE folder (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspace(id),
    parent_id TEXT REFERENCES folder(id),
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    folder_type TEXT DEFAULT 'general',
    -- 'general', 'web_dev', 'app_dev', 'seo', 'frontend_fullstack',
    -- 'backend_fullstack', 'course', 'prompts', 'reminders', 'notes'
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_expanded BOOLEAN NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

-- Files (uploaded or created)
CREATE TABLE file (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    folder_id TEXT NOT NULL REFERENCES folder(id),
    name TEXT NOT NULL,
    extension TEXT,
    mime_type TEXT,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    local_path TEXT, -- path within local vault directory
    cloud_path TEXT, -- Supabase Storage path
    content_hash TEXT, -- blake3 hash of file content
    thumbnail_path TEXT, -- local path to generated thumbnail
    is_favorited BOOLEAN NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT 0,
    open_count INTEGER NOT NULL DEFAULT 0,
    last_opened_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

-- File versions (for version history)
CREATE TABLE file_version (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    file_id TEXT NOT NULL REFERENCES file(id),
    version_number INTEGER NOT NULL,
    content_hash TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    local_path TEXT,
    cloud_path TEXT,
    device_id TEXT REFERENCES device(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(file_id, version_number)
);

-- ============================================================
-- NOTES SYSTEM
-- ============================================================

CREATE TABLE note (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    folder_id TEXT NOT NULL REFERENCES folder(id),
    title TEXT NOT NULL DEFAULT 'Untitled Note',
    content_json TEXT, -- Tiptap JSON content
    content_text TEXT, -- Plain text extraction for search
    content_html TEXT, -- Rendered HTML cache
    is_favorited BOOLEAN NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT 0,
    word_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

-- ============================================================
-- PROMPTS LIBRARY
-- ============================================================

CREATE TABLE prompt (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    folder_id TEXT REFERENCES folder(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    -- 'general', 'coding', 'debugging', 'refactoring', 'testing',
    -- 'documentation', 'seo', 'design', 'devops', 'custom'
    language TEXT, -- 'javascript', 'python', 'rust', etc.
    variables TEXT, -- JSON array of template variables: [{name, default}]
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_favorited BOOLEAN NOT NULL DEFAULT 0,
    last_used_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

-- ============================================================
-- REMINDERS SYSTEM
-- ============================================================

CREATE TABLE reminder (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    folder_id TEXT REFERENCES folder(id),
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT, -- ISO 8601
    due_time TEXT, -- HH:MM format
    recurrence TEXT, -- 'none', 'daily', 'weekly', 'monthly'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'snoozed', 'overdue'
    linked_file_id TEXT REFERENCES file(id),
    linked_note_id TEXT REFERENCES note(id),
    notify_before_minutes INTEGER DEFAULT 15,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

-- ============================================================
-- COURSES SYSTEM
-- ============================================================

CREATE TABLE course (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    folder_id TEXT NOT NULL REFERENCES folder(id),
    name TEXT NOT NULL,
    instructor TEXT,
    platform TEXT, -- 'Udemy', 'Coursera', 'YouTube', 'Custom'
    url TEXT,
    description TEXT,
    thumbnail_path TEXT,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    total_lessons INTEGER NOT NULL DEFAULT 0,
    completed_lessons INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'not_started',
    -- 'not_started', 'in_progress', 'completed', 'paused'
    started_at TEXT,
    completed_at TEXT,
    rating INTEGER, -- 1-5 stars
    notes TEXT, -- personal notes about the course
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE course_section (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    course_id TEXT NOT NULL REFERENCES course(id),
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE course_lesson (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    section_id TEXT NOT NULL REFERENCES course_section(id),
    course_id TEXT NOT NULL REFERENCES course(id),
    name TEXT NOT NULL,
    duration_minutes INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT 0,
    completed_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Course materials (files linked to a course)
CREATE TABLE course_material (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    course_id TEXT NOT NULL REFERENCES course(id),
    lesson_id TEXT REFERENCES course_lesson(id),
    file_id TEXT NOT NULL REFERENCES file(id),
    material_type TEXT DEFAULT 'resource',
    -- 'video', 'pdf', 'code', 'exercise', 'resource', 'certificate'
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- TAGGING & ORGANIZATION
-- ============================================================

CREATE TABLE tag (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1',
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Polymorphic tagging (files, notes, prompts, courses)
CREATE TABLE taggable (
    tag_id TEXT NOT NULL REFERENCES tag(id),
    entity_type TEXT NOT NULL, -- 'file', 'note', 'prompt', 'course'
    entity_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (tag_id, entity_type, entity_id)
);

-- ============================================================
-- SYNC ENGINE
-- ============================================================

CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    entity_type TEXT NOT NULL,
    -- 'workspace', 'folder', 'file', 'note', 'prompt', 'reminder', 'course', 'tag'
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'upload_file'
    payload TEXT, -- JSON of changed fields
    status TEXT NOT NULL DEFAULT 'pending',
    -- 'pending', 'in_progress', 'completed', 'failed', 'conflict'
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 5,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    processed_at TEXT
);

CREATE TABLE sync_log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    device_id TEXT NOT NULL,
    direction TEXT NOT NULL, -- 'push', 'pull'
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failed', 'conflict_resolved'
    details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- FULL-TEXT SEARCH (SQLite FTS5)
-- ============================================================

CREATE VIRTUAL TABLE search_index USING fts5(
    entity_type,
    entity_id UNINDEXED,
    title,
    content,
    tags,
    tokenize='porter unicode61'
);

-- ============================================================
-- RECENT ACTIVITY
-- ============================================================

CREATE TABLE activity (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'opened', 'created', 'edited', 'deleted', 'synced'
    metadata TEXT, -- JSON
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- USER SETTINGS
-- ============================================================

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_folder_workspace ON folder(workspace_id);
CREATE INDEX idx_folder_parent ON folder(parent_id);
CREATE INDEX idx_file_folder ON file(folder_id);
CREATE INDEX idx_file_hash ON file(content_hash);
CREATE INDEX idx_note_folder ON note(folder_id);
CREATE INDEX idx_prompt_category ON prompt(category);
CREATE INDEX idx_reminder_status ON reminder(status);
CREATE INDEX idx_reminder_due ON reminder(due_date);
CREATE INDEX idx_course_status ON course(status);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_activity_entity ON activity(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity(created_at DESC);
```

### 5.2 Supabase PostgreSQL Schema (Cloud Mirror)

The cloud schema mirrors the local SQLite schema with these additions:
- `user_id UUID REFERENCES auth.users(id)` on every table
- Row Level Security (RLS) policies ensuring users only access their own data
- `device_id TEXT` tracking which device made each change
- `server_updated_at TIMESTAMPTZ` for conflict resolution
- Supabase Realtime enabled on all synced tables

---

## 6. Feature Specification

### 6.1 Vault Explorer (Core File Manager)

The heart of DevVault — a beautiful, fast file browser.

**Features:**
- Sidebar tree view with collapsible folders (animated with GSAP)
- Main content area with grid view (thumbnails) and list view (detailed)
- Drag & drop files from OS into the app (Tauri drop event)
- Drag & drop to reorganize files between folders
- Multi-select with Shift+Click and Cmd+Click
- Right-click context menu (rename, move, copy, delete, tag, favorite, open in system app)
- Breadcrumb navigation with quick jump
- File size, type, and date columns (sortable)
- Quick preview on hover (thumbnail/first page)
- Batch operations (move, tag, delete multiple files)
- Duplicate detection via content hash

**Pre-configured Workspace Folders:**
```
DevVault/
├── Web Development/
│   ├── HTML & CSS/
│   ├── JavaScript/
│   ├── TypeScript/
│   ├── Frameworks/
│   ├── APIs & Integrations/
│   └── Templates/
├── App Development/
│   ├── iOS/
│   ├── Android/
│   ├── Cross-Platform/
│   ├── Desktop (Tauri/Electron)/
│   └── PWA/
├── SEO Services/
│   ├── Audits/
│   ├── Keyword Research/
│   ├── Link Building/
│   ├── Analytics Reports/
│   ├── Schema Markup/
│   └── Templates/
├── Frontend Fullstack/
│   ├── Svelte & SvelteKit/
│   ├── React & Next.js/
│   ├── Vue & Nuxt/
│   ├── UI Libraries/
│   ├── Design Systems/
│   └── Boilerplates/
├── Backend Fullstack/
│   ├── Node.js & Express/
│   ├── Python & Django/
│   ├── Rust/
│   ├── Go/
│   ├── Databases/
│   └── DevOps & CI-CD/
├── Courses/
│   └── (Dynamically created per course)
├── Notes/
│   ├── Quick Notes/
│   ├── Meeting Notes/
│   ├── Technical Docs/
│   └── Ideas/
├── Prompts Library/
│   ├── Coding/
│   ├── Debugging/
│   ├── SEO/
│   ├── Documentation/
│   └── Custom/
├── Reminders/
│   ├── Today/
│   ├── This Week/
│   ├── Upcoming/
│   └── Completed/
├── Code Snippets/
│   ├── JavaScript/
│   ├── TypeScript/
│   ├── CSS/
│   ├── Python/
│   ├── Rust/
│   ├── SQL/
│   └── Shell/
└── Archive/
```

### 6.2 Notes System (Rich Text Editor)

A powerful note-taking system powered by Tiptap.

**Features:**
- Rich text editing: headings, bold, italic, code, lists, blockquotes, tables
- Markdown shortcuts (type `# ` for heading, `- ` for list, ``` for code block)
- Code blocks with syntax highlighting (Shiki — 100+ languages)
- Inline file attachments and images
- Note linking — `[[Note Title]]` to link between notes
- Table of contents auto-generation
- Word count and reading time
- Note templates (meeting notes, technical doc, bug report, etc.)
- Export to Markdown, PDF, HTML
- Full-text search across all notes
- Version history — view/restore previous versions
- Split view — two notes side by side

### 6.3 Prompts Library

A dedicated manager for AI prompts and code templates.

**Features:**
- Prompt cards with title, category, and preview
- Template variables: `{{variable_name}}` with fill-in modal before copy
- One-click copy to clipboard (with visual feedback)
- Category filters: Coding, Debugging, Refactoring, Testing, Documentation, SEO, Design, DevOps
- Language tags (JavaScript, Python, Rust, etc.)
- Usage tracking — most-used prompts surface to top
- Prompt chaining — link prompts together as workflows
- Import/export prompts as JSON
- Search and filter across all prompts
- Syntax highlighting in prompt preview

### 6.4 Reminders System

Smart reminders with native OS notifications.

**Features:**
- Create reminders with title, description, due date/time
- Priority levels: Low, Medium, High, Urgent (color-coded)
- Recurrence: Daily, Weekly, Monthly
- Link reminders to files or notes (click reminder → opens linked item)
- Native OS notifications via Tauri notification API
- Snooze options: 15 min, 1 hour, tomorrow, next week
- Calendar view (month/week/day)
- Overdue tracking with visual badges
- Smart grouping: Today, This Week, Upcoming, Completed
- Kanban-style board view (drag between status columns)

### 6.5 Course Manager

Organize and track learning progress.

**Features:**
- Course card with thumbnail, title, instructor, platform, progress bar
- Section/lesson hierarchy (collapsible tree)
- Check off completed lessons (progress auto-calculates)
- Drag & drop course materials (PDFs, videos, code files) into lessons
- Course notes — rich text notes per course and per lesson
- Rating system (1-5 stars)
- Status tracking: Not Started, In Progress, Completed, Paused
- Filter by platform (Udemy, Coursera, YouTube, Custom)
- Course completion certificate storage
- Dashboard with learning statistics (courses completed, hours invested, streak)

### 6.6 Code Snippets Manager

Quick access to reusable code patterns.

**Features:**
- Syntax-highlighted code editor (Monaco Editor or Shiki)
- Language detection or manual selection
- Copy with one click
- Tags and categories
- Search by title, language, or content
- Expandable/collapsible snippet cards
- Import from GitHub Gists
- Export as Gist or file

### 6.7 Global Search (Spotlight-Style)

Instant search across everything.

**Features:**
- `Cmd+K` / `Ctrl+K` opens search overlay (GSAP spring animation)
- Fuzzy search with Fuse.js across files, notes, prompts, courses, reminders
- Full-text search via SQLite FTS5 for deep content search
- Result categories with icons (File, Note, Prompt, Course, Reminder)
- Recent searches history
- Search filters: type, date range, tags, folder
- Keyboard navigation through results (arrow keys + Enter)
- Preview panel on the right showing result content

### 6.8 Command Palette

Power-user productivity tool.

**Features:**
- `Cmd+Shift+P` / `Ctrl+Shift+P` opens command palette
- All app actions available: Create Note, New Folder, Toggle Dark Mode, Sync Now, etc.
- Fuzzy search through commands
- Recently used commands at top
- Keyboard shortcut hints next to each command
- Extensible — new commands auto-registered from modules

### 6.9 Dashboard / Home Screen

A beautiful landing page when you open the app.

**Features:**
- Welcome greeting with date and time
- Sync status indicator (synced, syncing, offline)
- Quick actions: New Note, Upload Files, New Prompt, New Reminder
- Recent files (last 10 opened/modified)
- Pinned/favorited items
- Upcoming reminders (next 5)
- Course progress overview
- Storage usage meter (local + cloud)
- Activity feed (recent actions across all devices)
- Quick search bar

### 6.10 Universal Copy & Paste System

Seamless clipboard integration between DevVault and the OS.

**Copy FROM DevVault:**
- Copy file(s) → Paste into OS Finder/Explorer as actual files (Tauri clipboard + shell)
- Copy note content → Paste as rich text (HTML) or plain text into any app
- Copy prompt → Paste with variables pre-filled into any text field
- Copy code snippet → Paste with syntax preserved (rich text) or plain code
- Copy file path → `Cmd/Ctrl + Shift + C` copies the file's local or cloud path
- Copy file link → Generates a `devvault://open/file/{id}` deep link for cross-references
- Copy as Markdown → Notes and prompts exportable as Markdown to clipboard
- Batch copy → Select multiple files → Copy → Paste into OS as multiple files

**Paste INTO DevVault:**
- Paste files from OS → Automatically imports and hashes (same as drag & drop)
- Paste images from clipboard → Creates image file in current folder (screenshots)
- Paste text from clipboard → Option to create as new note or append to current note
- Paste URLs → Auto-detect and offer to save as bookmark, download file, or embed
- Paste code → Auto-detect language, offer to create as code snippet
- Paste file paths → Import the file at that path into the vault
- `Cmd/Ctrl + V` in vault → Smart paste (detects content type and routes accordingly)
- `Cmd/Ctrl + Shift + V` → Paste as plain text (strips formatting)

**Internal Copy & Paste:**
- Copy files/folders within DevVault → Paste in another folder (duplicate)
- Cut files → `Cmd/Ctrl + X` → Paste to move (not copy)
- Copy note blocks → Paste between notes preserving formatting
- Clipboard history → `Cmd/Ctrl + Shift + V` shows last 10 clipboard items (DevVault internal)

**Implementation:**
- Uses `tauri-plugin-clipboard` for OS clipboard read/write
- Rich text clipboard via `text/html` MIME type for formatted content
- File clipboard via native file URI list for cross-app file transfer
- Internal clipboard ring stored in memory ($state rune) for history

### 6.11 Trash / Recycle Bin

Safe deletion with recovery.

**Features:**
- Soft delete — items move to trash, not permanently deleted
- 30-day auto-purge (configurable)
- Restore to original location
- Permanent delete option
- Trash size indicator
- Bulk restore/delete

### 6.12 Activity Timeline

Track everything that happens across devices.

**Features:**
- Chronological feed of all actions
- Filter by action type, device, date
- Device badges showing which machine performed each action
- Clickable — jump to the referenced item

---

## 7. UI/UX Design System

### 7.1 Design Tokens

```css
/* Color Palette - Inspired by Apple's design language */
:root {
  /* Primary - Deep Indigo */
  --color-primary-50: #eef2ff;
  --color-primary-100: #e0e7ff;
  --color-primary-200: #c7d2fe;
  --color-primary-300: #a5b4fc;
  --color-primary-400: #818cf8;
  --color-primary-500: #6366f1;
  --color-primary-600: #4f46e5;
  --color-primary-700: #4338ca;
  --color-primary-800: #3730a3;
  --color-primary-900: #312e81;

  /* Neutral - Zinc */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f4f4f5;
  --color-neutral-200: #e4e4e7;
  --color-neutral-300: #d4d4d8;
  --color-neutral-400: #a1a1aa;
  --color-neutral-500: #71717a;
  --color-neutral-600: #52525b;
  --color-neutral-700: #3f3f46;
  --color-neutral-800: #27272a;
  --color-neutral-850: #1e1e21;
  --color-neutral-900: #18181b;
  --color-neutral-950: #09090b;

  /* Semantic */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Spacing Scale (4px base) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */

  /* Border Radius */
  --radius-sm: 0.375rem;   /* 6px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-xl: 1rem;       /* 16px */
  --radius-2xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;

  /* Typography */
  --font-sans: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

  /* Shadows (Layered for depth) */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

### 7.2 Theme System

- **Light Mode**: Clean white backgrounds, subtle shadows, crisp text
- **Dark Mode**: True dark (#09090b base), with elevated surface layers
- **System**: Follows OS preference via `prefers-color-scheme`
- Theme toggle with GSAP morph animation (sun → moon icon)
- All colors CSS custom properties for instant theme switching

### 7.3 Typography Scale

```
Display:   2.25rem (36px) / 700 weight — Dashboard headings
H1:        1.875rem (30px) / 700 weight — Page titles
H2:        1.5rem (24px) / 600 weight — Section headers
H3:        1.25rem (20px) / 600 weight — Card titles
H4:        1.125rem (18px) / 500 weight — Sub-sections
Body:      0.9375rem (15px) / 400 weight — Default text
Small:     0.8125rem (13px) / 400 weight — Metadata, timestamps
Micro:     0.75rem (12px) / 500 weight — Badges, labels
Mono:      0.875rem (14px) / 400 weight — Code, file paths
```

### 7.4 Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Title Bar (Tauri custom title bar - traffic lights / controls)│
├────────────┬─────────────────────────────────────────────────┤
│            │  ┌────────────────────────────────────────────┐ │
│  Sidebar   │  │  Breadcrumb / Tab Bar                      │ │
│  (260px)   │  ├────────────────────────────────────────────┤ │
│            │  │                                            │ │
│  ┌──────┐  │  │           Main Content Area                │ │
│  │ Nav  │  │  │                                            │ │
│  │ Tree │  │  │  ┌──────────────┐  ┌──────────────┐      │ │
│  │      │  │  │  │   File Card   │  │   File Card   │      │ │
│  │      │  │  │  └──────────────┘  └──────────────┘      │ │
│  │      │  │  │  ┌──────────────┐  ┌──────────────┐      │ │
│  │      │  │  │  │   File Card   │  │   File Card   │      │ │
│  │      │  │  │  └──────────────┘  └──────────────┘      │ │
│  │      │  │  │                                            │ │
│  └──────┘  │  │                                            │ │
│            │  └────────────────────────────────────────────┘ │
│  ┌──────┐  │                                                 │
│  │Quick │  │  ┌────────────────────────────────────────────┐ │
│  │Actions│  │  │  Status Bar (sync status, file count, etc) │ │
│  └──────┘  │  └────────────────────────────────────────────┘ │
├────────────┴─────────────────────────────────────────────────┤
│  (Optional) Preview Panel — slides in from right (GSAP)       │
└──────────────────────────────────────────────────────────────┘
```

### 7.5 GSAP Animation Specifications

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Page transitions | Slide + Fade | 300ms | `power2.inOut` |
| Sidebar expand/collapse | Width + opacity | 250ms | `power3.out` |
| File card hover | Scale 1.02 + shadow lift | 150ms | `power1.out` |
| Drag & drop | Ghost follow + destination highlight | 200ms | `power2.out` |
| Modal open | Scale from 0.95 + backdrop blur | 250ms | `back.out(1.7)` |
| Modal close | Scale to 0.95 + fade | 200ms | `power2.in` |
| Toast notifications | Slide in from top-right + fade | 300ms | `power3.out` |
| Command palette | Scale from 0.98 + backdrop | 200ms | `power2.out` |
| Search overlay | Blur bg + slide down | 250ms | `power3.out` |
| Theme switch | Color crossfade | 400ms | `power1.inOut` |
| Folder tree expand | Height reveal + children stagger 50ms | 300ms | `power2.out` |
| Loading skeleton | Shimmer gradient | loop 1.5s | `linear` |
| File upload progress | Width grow | dynamic | `power1.out` |
| Sync indicator | Rotate loop | 1s | `linear` |
| Drag reorder | Spring settle | 400ms | `elastic.out(1, 0.5)` |

### 7.6 Component Library (Built on Bits UI + TailwindCSS v4)

**Core Components:**
- `Button` — Primary, Secondary, Ghost, Danger, Icon variants
- `Input` — Text, Search, Password with floating label
- `Select` — Custom dropdown with search
- `Dialog` — Modal with GSAP animation
- `Sheet` — Side panel (for preview, settings)
- `Tooltip` — Instant, positioned tooltips
- `Toast` — Notification toasts (success, error, info, warning)
- `Badge` — Status, count, label badges
- `Card` — File card, note card, prompt card, course card
- `ContextMenu` — Right-click menus
- `CommandPalette` — Fuzzy-search command launcher
- `TreeView` — Folder tree with expand/collapse
- `DataTable` — Sortable, filterable file list
- `Tabs` — Content area tabs
- `Breadcrumb` — Navigation breadcrumbs
- `ProgressBar` — Upload, sync, course progress
- `Avatar` — User avatar (for multi-device indicators)
- `Skeleton` — Loading placeholders
- `EmptyState` — Illustrated empty states per section
- `DropZone` — Drag & drop file upload area

---

## 8. Sync Engine Architecture

### 8.1 Sync Strategy

**Approach: Offline-First with Last-Write-Wins + Conflict Detection**

```
┌─────────────────────────────────────────────────┐
│                 SYNC ENGINE                       │
│                                                   │
│  ┌─────────┐    ┌──────────┐    ┌────────────┐  │
│  │  Change  │───▶│  Sync    │───▶│  Conflict  │  │
│  │  Detect  │    │  Queue   │    │  Resolver  │  │
│  └─────────┘    └──────────┘    └────────────┘  │
│       │              │               │            │
│       ▼              ▼               ▼            │
│  ┌─────────┐    ┌──────────┐    ┌────────────┐  │
│  │  Hash   │    │  Batch   │    │  Merge /   │  │
│  │  Compare │    │  Upload  │    │  Keep Both │  │
│  └─────────┘    └──────────┘    └────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │         Supabase Realtime Listener           │ │
│  │    (Receives changes from other devices)     │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 8.2 Sync Rules

1. **Metadata sync** — SQLite row changes → Supabase PostgreSQL (bidirectional)
2. **File sync** — Local files → Supabase Storage via chunked upload
3. **Conflict resolution** — Last-write-wins by default, with conflict UI for files modified on both devices
4. **Realtime push** — Supabase Realtime WebSocket notifies other devices of changes
5. **Delta sync for files** — Only upload changed chunks (blake3 hash comparison)
6. **Batch operations** — Queue changes and sync in batches every 5 seconds (configurable)
7. **Retry with backoff** — Failed syncs retry: 2s, 4s, 8s, 16s, 32s
8. **Bandwidth awareness** — Pause large file uploads on metered connections

### 8.3 Conflict Resolution UI

When the same file/note is modified on two devices before syncing:

```
┌────────────────────────────────────────────┐
│  ⚠ Conflict Detected                       │
│                                            │
│  "project-notes.md" was modified on both   │
│  devices since the last sync.              │
│                                            │
│  ┌──────────────┐  ┌──────────────┐       │
│  │  This Device  │  │ Other Device │       │
│  │  Modified 2m  │  │ Modified 5m  │       │
│  │  ago          │  │ ago          │       │
│  │  +12 lines    │  │ +3 lines     │       │
│  └──────────────┘  └──────────────┘       │
│                                            │
│  [Keep This] [Keep Other] [Keep Both] [Diff]│
└────────────────────────────────────────────┘
```

---

## 9. File Preview Engine

### 9.1 Supported File Types

| Category | Extensions | Preview Method |
|----------|-----------|----------------|
| **PDF** | .pdf | pdf.js — full render with page navigation, zoom |
| **Word** | .docx | Mammoth.js — convert to HTML and render |
| **Spreadsheets** | .csv, .tsv | PapaParse + custom table component |
| **Excel** | .xlsx | SheetJS → parsed data → table render |
| **Images** | .png, .jpg, .jpeg, .gif, .webp, .svg, .ico | Native `<img>` with zoom/pan |
| **Code** | .js, .ts, .svelte, .py, .rs, .go, .java, .css, .html, .json, .yaml, .toml, .sql, .sh, .md | Shiki syntax highlighting |
| **Markdown** | .md | Rendered HTML with syntax-highlighted code blocks |
| **Text** | .txt, .log, .env | Plain text with line numbers |
| **Video** | .mp4, .webm, .mov | Native HTML5 `<video>` player |
| **Audio** | .mp3, .wav, .ogg | Custom audio player with waveform |
| **Archives** | .zip, .tar.gz | List contents (Rust-side extraction) |

### 9.2 Preview Architecture

```svelte
<!-- FilePreview.svelte (Svelte 5 Runes) -->
{#snippet previewRenderer(file)}
  {#if file.category === 'pdf'}
    <PdfViewer src={file.localPath} />
  {:else if file.category === 'document'}
    <DocViewer src={file.localPath} />
  {:else if file.category === 'spreadsheet'}
    <SpreadsheetViewer src={file.localPath} />
  {:else if file.category === 'image'}
    <ImageViewer src={file.localPath} />
  {:else if file.category === 'code'}
    <CodeViewer src={file.localPath} language={file.language} />
  {:else if file.category === 'video'}
    <VideoPlayer src={file.localPath} />
  {:else if file.category === 'audio'}
    <AudioPlayer src={file.localPath} />
  {:else}
    <GenericPreview file={file} />
  {/if}
{/snippet}
```

### 9.3 Preview Panel Behavior

- **Quick Preview**: Hover over file → thumbnail/first page in tooltip
- **Side Panel**: Click file → opens in 40% width side panel with GSAP slide
- **Full Screen**: Double-click → full-window preview with controls
- **Tab Mode**: Open multiple files in tabs (like VS Code)
- Lazy loading — preview loads only when file is selected
- Caching — rendered previews cached in memory for instant re-open

---

## 10. Keyboard Shortcuts & Command Palette

### 10.1 Complete Shortcut Map

**Navigation:**
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Global Search (Spotlight) |
| `Cmd/Ctrl + Shift + P` | Command Palette |
| `Cmd/Ctrl + 1-9` | Switch workspace tabs |
| `Cmd/Ctrl + B` | Toggle Sidebar |
| `Cmd/Ctrl + \` | Toggle Preview Panel |
| `Cmd/Ctrl + Tab` | Next open tab |
| `Cmd/Ctrl + Shift + Tab` | Previous open tab |
| `Cmd/Ctrl + W` | Close current tab |
| `Cmd/Ctrl + Shift + T` | Reopen last closed tab |
| `Alt + ←/→` | Navigate back/forward |
| `Cmd/Ctrl + ↑` | Go to parent folder |

**File Operations:**
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New Note |
| `Cmd/Ctrl + Shift + N` | New Folder |
| `Cmd/Ctrl + O` | Open file from system |
| `Cmd/Ctrl + U` | Upload files (opens file picker) |
| `Cmd/Ctrl + D` | Duplicate selected item |
| `Cmd/Ctrl + Shift + D` | Download selected file to OS |
| `F2` | Rename selected item |
| `Delete / Backspace` | Move to trash |
| `Cmd/Ctrl + Shift + Delete` | Permanent delete (with confirmation) |
| `Cmd/Ctrl + C` | Copy selected files/content to clipboard |
| `Cmd/Ctrl + V` | Smart paste (auto-detects files, images, text, URLs, code) |
| `Cmd/Ctrl + Shift + V` | Paste as plain text OR open clipboard history ring |
| `Cmd/Ctrl + X` | Cut selected files (move on paste) |
| `Cmd/Ctrl + Shift + C` | Copy file path to clipboard |
| `Cmd/Ctrl + A` | Select all in current view |

**Content:**
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save current note/edit |
| `Cmd/Ctrl + Shift + S` | Force sync now |
| `Cmd/Ctrl + F` | Search within current file/note |
| `Cmd/Ctrl + Shift + F` | Global full-text search |
| `Cmd/Ctrl + L` | Add/manage tags |
| `Cmd/Ctrl + E` | Toggle favorite |
| `Cmd/Ctrl + J` | Toggle file details panel |

**Quick Actions:**
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Shift + 1` | New Quick Note |
| `Cmd/Ctrl + Shift + 2` | New Prompt |
| `Cmd/Ctrl + Shift + 3` | New Reminder |
| `Cmd/Ctrl + Shift + 4` | New Code Snippet |
| `Space` | Quick preview selected file |
| `Enter` | Open selected item |
| `Escape` | Close modal/palette/preview |

**View:**
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Shift + G` | Grid view |
| `Cmd/Ctrl + Shift + L` | List view |
| `Cmd/Ctrl + +/-` | Zoom in/out (preview) |
| `Cmd/Ctrl + 0` | Reset zoom |
| `Cmd/Ctrl + Shift + M` | Toggle dark/light mode |

### 10.2 Command Palette Commands

```
File Management:
  "New Note"                → Create a blank note
  "New Folder"              → Create folder in current location
  "New Prompt"              → Open prompt creator
  "New Reminder"            → Open reminder creator
  "New Course"              → Create course entry
  "Upload Files"            → Open file picker
  "Import from Clipboard"   → Paste clipboard content as new note

Navigation:
  "Go to Dashboard"         → Navigate to home
  "Go to Notes"             → Navigate to notes section
  "Go to Prompts"           → Navigate to prompts library
  "Go to Reminders"         → Navigate to reminders
  "Go to Courses"           → Navigate to courses
  "Go to Trash"             → Navigate to trash
  "Go to Settings"          → Open settings panel

Sync & Data:
  "Sync Now"                → Force immediate sync
  "Sync Status"             → Show sync details
  "Clear Sync Queue"        → Reset pending sync items
  "Export All Data"          → Export vault as ZIP

View:
  "Toggle Dark Mode"        → Switch theme
  "Toggle Sidebar"          → Show/hide sidebar
  "Toggle Compact Mode"     → Dense layout
  "Zoom In/Out"             → Adjust preview zoom

Settings:
  "Preferences"             → Open settings
  "Keyboard Shortcuts"      → Show all shortcuts
  "About DevVault"          → Version info
  "Check for Updates"       → Check for app updates
```

---

## 11. Security & Encryption

### 11.1 Authentication Flow

```
1. App Launch → Check for stored JWT in Tauri Secure Store
2. If no token → Show login screen (Magic Link or Email/Password)
3. Magic Link flow:
   a. User enters email
   b. Supabase sends magic link
   c. Link opens: devvault://auth?token=xxx (Tauri deep link)
   d. App captures token, stores in Tauri Secure Store
   e. Token auto-refreshes via Supabase client
4. On subsequent launches → Auto-login with stored token
5. Token expiry → Silent refresh or re-auth prompt
```

### 11.2 Security Measures

- **Row Level Security (RLS)**: Every Supabase table has RLS policies — users can only access their own data
- **Encrypted local storage**: Tauri Secure Store for auth tokens (uses OS keychain)
- **HTTPS only**: All Supabase communication over TLS
- **File encryption at rest (optional)**: AES-256-GCM encryption of vault files using a user-derived key
- **No plain-text secrets**: Environment variables for all API keys, stored in Tauri config
- **Content Security Policy**: Strict CSP headers in Tauri webview config
- **Auto-lock**: Optional auto-lock after inactivity timeout (PIN or biometric to unlock)

---

## 12. Project Structure

```
devvault/
├── src-tauri/                          # Tauri Rust backend
│   ├── Cargo.toml                      # Rust dependencies
│   ├── tauri.conf.json                 # Tauri configuration
│   ├── capabilities/                   # Permission capabilities
│   │   └── default.json
│   ├── icons/                          # App icons (all sizes)
│   ├── src/
│   │   ├── main.rs                     # Tauri entry point
│   │   ├── lib.rs                      # Module declarations
│   │   ├── commands/                   # Tauri IPC commands
│   │   │   ├── mod.rs
│   │   │   ├── files.rs                # File CRUD operations
│   │   │   ├── folders.rs              # Folder management
│   │   │   ├── notes.rs                # Notes CRUD
│   │   │   ├── prompts.rs              # Prompts CRUD
│   │   │   ├── reminders.rs            # Reminders CRUD
│   │   │   ├── courses.rs              # Courses CRUD
│   │   │   ├── tags.rs                 # Tagging system
│   │   │   ├── search.rs               # Full-text search
│   │   │   └── sync.rs                 # Sync engine commands
│   │   ├── db/                         # Database layer
│   │   │   ├── mod.rs
│   │   │   ├── migrations.rs           # SQLite schema migrations
│   │   │   └── queries.rs              # Prepared SQL queries
│   │   ├── sync/                       # Sync engine
│   │   │   ├── mod.rs
│   │   │   ├── engine.rs               # Core sync logic
│   │   │   ├── queue.rs                # Sync queue processor
│   │   │   ├── hasher.rs               # blake3 file hashing
│   │   │   ├── chunker.rs              # File chunking for delta sync
│   │   │   ├── conflict.rs             # Conflict detection/resolution
│   │   │   └── supabase.rs             # Supabase API client
│   │   ├── file_ops/                   # File operations
│   │   │   ├── mod.rs
│   │   │   ├── import.rs               # File import/drop handler
│   │   │   ├── export.rs               # File export/download
│   │   │   ├── thumbnail.rs            # Thumbnail generation
│   │   │   └── watcher.rs              # Filesystem watcher
│   │   └── utils/                      # Utilities
│   │       ├── mod.rs
│   │       ├── crypto.rs               # Encryption helpers
│   │       └── paths.rs                # Path management
│   └── migrations/                     # SQL migration files
│       ├── 001_initial_schema.sql
│       └── 002_fts_indexes.sql
│
├── src/                                # SvelteKit frontend
│   ├── app.html                        # HTML template
│   ├── app.css                         # Global CSS + TailwindCSS
│   ├── app.d.ts                        # TypeScript declarations
│   │
│   ├── lib/                            # Shared library code
│   │   ├── components/                 # UI Components
│   │   │   ├── ui/                     # Base UI primitives
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Input.svelte
│   │   │   │   ├── Select.svelte
│   │   │   │   ├── Dialog.svelte
│   │   │   │   ├── Sheet.svelte
│   │   │   │   ├── Toast.svelte
│   │   │   │   ├── Tooltip.svelte
│   │   │   │   ├── Badge.svelte
│   │   │   │   ├── ContextMenu.svelte
│   │   │   │   ├── DropZone.svelte
│   │   │   │   ├── Skeleton.svelte
│   │   │   │   ├── EmptyState.svelte
│   │   │   │   ├── ProgressBar.svelte
│   │   │   │   ├── Tabs.svelte
│   │   │   │   ├── Breadcrumb.svelte
│   │   │   │   └── index.ts            # Barrel export
│   │   │   │
│   │   │   ├── layout/                 # Layout components
│   │   │   │   ├── AppShell.svelte     # Main app layout
│   │   │   │   ├── Sidebar.svelte      # Navigation sidebar
│   │   │   │   ├── TitleBar.svelte     # Custom window title bar
│   │   │   │   ├── StatusBar.svelte    # Bottom status bar
│   │   │   │   └── PreviewPanel.svelte # Right-side preview
│   │   │   │
│   │   │   ├── vault/                  # Vault Explorer components
│   │   │   │   ├── FileCard.svelte
│   │   │   │   ├── FileList.svelte
│   │   │   │   ├── FileGrid.svelte
│   │   │   │   ├── FolderTree.svelte
│   │   │   │   ├── FileUploader.svelte
│   │   │   │   └── DragOverlay.svelte
│   │   │   │
│   │   │   ├── notes/                  # Notes components
│   │   │   │   ├── NoteEditor.svelte   # Tiptap rich editor
│   │   │   │   ├── NoteCard.svelte
│   │   │   │   ├── NoteList.svelte
│   │   │   │   └── NoteToolbar.svelte
│   │   │   │
│   │   │   ├── prompts/                # Prompts components
│   │   │   │   ├── PromptCard.svelte
│   │   │   │   ├── PromptEditor.svelte
│   │   │   │   ├── PromptList.svelte
│   │   │   │   └── VariableFiller.svelte
│   │   │   │
│   │   │   ├── reminders/              # Reminders components
│   │   │   │   ├── ReminderCard.svelte
│   │   │   │   ├── ReminderForm.svelte
│   │   │   │   ├── ReminderList.svelte
│   │   │   │   ├── CalendarView.svelte
│   │   │   │   └── KanbanBoard.svelte
│   │   │   │
│   │   │   ├── courses/                # Courses components
│   │   │   │   ├── CourseCard.svelte
│   │   │   │   ├── CourseDetail.svelte
│   │   │   │   ├── LessonTree.svelte
│   │   │   │   ├── ProgressRing.svelte
│   │   │   │   └── CourseForm.svelte
│   │   │   │
│   │   │   ├── snippets/               # Code Snippets components
│   │   │   │   ├── SnippetCard.svelte
│   │   │   │   ├── SnippetEditor.svelte
│   │   │   │   └── SnippetList.svelte
│   │   │   │
│   │   │   ├── preview/                # File Preview components
│   │   │   │   ├── FilePreview.svelte  # Main preview router
│   │   │   │   ├── PdfViewer.svelte
│   │   │   │   ├── DocViewer.svelte
│   │   │   │   ├── SpreadsheetViewer.svelte
│   │   │   │   ├── ImageViewer.svelte
│   │   │   │   ├── CodeViewer.svelte
│   │   │   │   ├── VideoPlayer.svelte
│   │   │   │   ├── AudioPlayer.svelte
│   │   │   │   └── MarkdownViewer.svelte
│   │   │   │
│   │   │   ├── search/                 # Search & Command Palette
│   │   │   │   ├── GlobalSearch.svelte
│   │   │   │   ├── CommandPalette.svelte
│   │   │   │   ├── SearchResults.svelte
│   │   │   │   └── SearchFilters.svelte
│   │   │   │
│   │   │   ├── dashboard/              # Dashboard components
│   │   │   │   ├── WelcomeHero.svelte
│   │   │   │   ├── QuickActions.svelte
│   │   │   │   ├── RecentFiles.svelte
│   │   │   │   ├── UpcomingReminders.svelte
│   │   │   │   ├── CourseProgress.svelte
│   │   │   │   ├── SyncStatus.svelte
│   │   │   │   ├── StorageUsage.svelte
│   │   │   │   └── ActivityFeed.svelte
│   │   │   │
│   │   │   └── settings/               # Settings components
│   │   │       ├── SettingsPanel.svelte
│   │   │       ├── GeneralSettings.svelte
│   │   │       ├── SyncSettings.svelte
│   │   │       ├── AppearanceSettings.svelte
│   │   │       ├── ShortcutSettings.svelte
│   │   │       └── AccountSettings.svelte
│   │   │
│   │   ├── stores/                     # Svelte 5 Runes state
│   │   │   ├── vault.svelte.ts         # File/folder state
│   │   │   ├── notes.svelte.ts         # Notes state
│   │   │   ├── prompts.svelte.ts       # Prompts state
│   │   │   ├── reminders.svelte.ts     # Reminders state
│   │   │   ├── courses.svelte.ts       # Courses state
│   │   │   ├── search.svelte.ts        # Search state
│   │   │   ├── sync.svelte.ts          # Sync engine state
│   │   │   ├── ui.svelte.ts            # UI state (sidebar, theme, view)
│   │   │   ├── auth.svelte.ts          # Auth state
│   │   │   └── shortcuts.svelte.ts     # Keyboard shortcuts registry
│   │   │
│   │   ├── services/                   # Business logic / API layer
│   │   │   ├── tauri.ts                # Tauri IPC wrapper
│   │   │   ├── supabase.ts             # Supabase client init
│   │   │   ├── file-service.ts         # File operations
│   │   │   ├── note-service.ts         # Note operations
│   │   │   ├── prompt-service.ts       # Prompt operations
│   │   │   ├── reminder-service.ts     # Reminder operations
│   │   │   ├── course-service.ts       # Course operations
│   │   │   ├── sync-service.ts         # Sync coordination
│   │   │   ├── search-service.ts       # Search orchestration
│   │   │   └── notification-service.ts # OS notification bridge
│   │   │
│   │   ├── utils/                      # Utility functions
│   │   │   ├── file-types.ts           # MIME type detection, icons
│   │   │   ├── formatters.ts           # Date, size, text formatters
│   │   │   ├── animations.ts           # GSAP animation presets
│   │   │   ├── shortcuts.ts            # Shortcut registration helpers
│   │   │   ├── drag-drop.ts            # Drag & drop utilities
│   │   │   └── validators.ts           # Input validation
│   │   │
│   │   ├── types/                      # TypeScript types
│   │   │   ├── vault.ts                # File, Folder, Workspace types
│   │   │   ├── notes.ts                # Note types
│   │   │   ├── prompts.ts              # Prompt types
│   │   │   ├── reminders.ts            # Reminder types
│   │   │   ├── courses.ts              # Course types
│   │   │   ├── sync.ts                 # Sync types
│   │   │   └── common.ts               # Shared types
│   │   │
│   │   └── config/                     # Configuration
│   │       ├── default-folders.ts      # Pre-configured folder structure
│   │       ├── shortcuts.ts            # Default shortcut mappings
│   │       └── constants.ts            # App constants
│   │
│   └── routes/                         # SvelteKit file-based routing
│       ├── +layout.svelte              # Root layout (AppShell)
│       ├── +layout.ts                  # Root layout data loader
│       ├── +page.svelte                # Dashboard / Home
│       ├── vault/
│       │   ├── +page.svelte            # Vault root (all workspaces)
│       │   └── [folderId]/
│       │       └── +page.svelte        # Folder contents view
│       ├── notes/
│       │   ├── +page.svelte            # Notes list
│       │   └── [noteId]/
│       │       └── +page.svelte        # Note editor
│       ├── prompts/
│       │   ├── +page.svelte            # Prompts library
│       │   └── [promptId]/
│       │       └── +page.svelte        # Prompt editor
│       ├── reminders/
│       │   └── +page.svelte            # Reminders (list + calendar)
│       ├── courses/
│       │   ├── +page.svelte            # Courses grid
│       │   └── [courseId]/
│       │       └── +page.svelte        # Course detail
│       ├── snippets/
│       │   └── +page.svelte            # Code snippets
│       ├── trash/
│       │   └── +page.svelte            # Trash / recycle bin
│       ├── activity/
│       │   └── +page.svelte            # Activity timeline
│       ├── search/
│       │   └── +page.svelte            # Search results page
│       ├── settings/
│       │   └── +page.svelte            # Settings panel
│       └── auth/
│           ├── +page.svelte            # Login / signup
│           └── callback/
│               └── +page.svelte        # Magic link callback
│
├── static/                             # Static assets
│   ├── fonts/                          # Inter + JetBrains Mono
│   ├── images/                         # App images, illustrations
│   └── sounds/                         # Notification sounds (optional)
│
├── package.json                        # Node dependencies
├── svelte.config.js                    # SvelteKit config (Tauri adapter)
├── vite.config.ts                      # Vite config
├── tailwind.config.ts                  # TailwindCSS v4 config
├── tsconfig.json                       # TypeScript config
├── .env                                # Supabase keys (gitignored)
├── .env.example                        # Environment template
├── .gitignore
├── .prettierrc                         # Code formatting
├── .eslintrc.cjs                       # Linting rules
└── README.md                           # Project documentation
```

---

## 13. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal: Skeleton app running as a desktop window with basic navigation**

- [ ] Initialize Tauri v2 + SvelteKit project with `create-tauri-app`
- [ ] Configure SvelteKit with `@sveltejs/adapter-static` for Tauri
- [ ] Set up TailwindCSS v4 with design token CSS variables
- [ ] Install and configure Phosphor Icons + Iconify for Svelte
- [ ] Set up GSAP with SvelteKit (client-side only)
- [ ] Build custom TitleBar component (macOS traffic lights, Windows controls)
- [ ] Build AppShell layout: Sidebar + Main Content + Status Bar
- [ ] Build Sidebar with navigation tree (static links first)
- [ ] Build theme system (light/dark/system) with CSS variables + GSAP crossfade
- [ ] Configure Tauri plugins: fs, dialog, notification, global-shortcut, store, shell, clipboard
- [ ] Set up SQLite database with tauri-plugin-sql
- [ ] Write and run initial schema migration (all tables)
- [ ] Create Tauri IPC command scaffolding (all modules)
- [ ] Build all TypeScript type definitions
- [ ] Set up Supabase project (database, auth, storage bucket)
- [ ] Write Supabase RLS policies for all tables
- [ ] Create `.env` configuration and Supabase client initialization

**Deliverable: App opens as native window with sidebar nav, theme toggle, and database ready.**

### Phase 2: Vault Explorer — Core File Management (Week 3-4)
**Goal: Upload, organize, and browse files with beautiful UI**

- [ ] Implement workspace/folder CRUD in Rust commands
- [ ] Build FolderTree component with expand/collapse (GSAP animated)
- [ ] Create pre-configured default workspace folders (all categories)
- [ ] Build FileCard component (thumbnail, name, size, date, type icon)
- [ ] Build FileGrid and FileList views with toggle
- [ ] Implement drag & drop file import (Tauri drop events + DropZone)
- [ ] Implement file upload via native dialog (Tauri dialog plugin)
- [ ] Build file import pipeline in Rust: copy → hash → store → SQLite
- [ ] Build Breadcrumb navigation
- [ ] Implement file rename, move, copy, delete (soft delete → trash)
- [ ] Build ContextMenu (right-click) for files and folders
- [ ] Multi-select with Shift+Click, Cmd+Click
- [ ] Implement sort (name, date, size, type) and filter
- [ ] Build StatusBar showing file count, storage usage, sync status
- [ ] Implement drag & drop reorder within folders
- [ ] Build empty states with illustrations for each section
- [ ] Implement file favorites and pinning

**Deliverable: Full file management — upload, organize, browse, drag & drop, delete/restore.**

### Phase 3: Notes, Prompts & Reminders (Week 5-6)
**Goal: Rich note editor, prompt library, and reminder system fully functional**

- [ ] Integrate Tiptap editor with Svelte 5 wrapper
- [ ] Build NoteEditor with toolbar (formatting, headings, lists, code blocks, tables)
- [ ] Add Shiki syntax highlighting for code blocks in notes
- [ ] Implement note CRUD via Rust commands + SQLite
- [ ] Build NoteList and NoteCard components
- [ ] Implement note templates (meeting notes, technical doc, bug report)
- [ ] Implement note search and full-text indexing (FTS5)
- [ ] Build PromptCard with category badges and copy button
- [ ] Build PromptEditor with template variable support (`{{var}}`)
- [ ] Implement VariableFiller modal (fill in variables before copy)
- [ ] Implement prompt CRUD, categories, usage tracking
- [ ] Build ReminderForm with date picker, time, priority, recurrence
- [ ] Build ReminderList with smart grouping (Today, This Week, Upcoming)
- [ ] Implement native OS notifications via Tauri notification plugin
- [ ] Build Reminder → File/Note linking
- [ ] Build CalendarView (month view) for reminders
- [ ] Build KanbanBoard view for reminders (drag between status columns)

**Deliverable: Full notes editor, prompts library, and reminders with notifications.**

### Phase 4: Course Manager & Code Snippets (Week 7)
**Goal: Course tracking and code snippet management**

- [ ] Build CourseForm (name, instructor, platform, URL, description)
- [ ] Build CourseCard with thumbnail, progress ring, status badge
- [ ] Build CourseDetail page with section/lesson tree
- [ ] Implement lesson completion tracking with progress calculation
- [ ] Drag & drop course materials (files) into lessons
- [ ] Build course notes (per-course and per-lesson)
- [ ] Implement course rating (1-5 stars)
- [ ] Build course dashboard statistics
- [ ] Build SnippetEditor with syntax highlighting and language selector
- [ ] Build SnippetCard with one-click copy
- [ ] Implement snippet search and tag filtering

**Deliverable: Complete course tracking with materials + code snippet manager.**

### Phase 5: File Preview Engine (Week 8)
**Goal: Preview any file type directly within the app**

- [ ] Build FilePreview router component (detects type → renders viewer)
- [ ] Integrate pdf.js for PDF preview (page nav, zoom, search)
- [ ] Integrate Mammoth.js for DOCX → HTML rendering
- [ ] Build SpreadsheetViewer with PapaParse (CSV) and SheetJS (XLSX)
- [ ] Build CodeViewer with Shiki (100+ language highlighting)
- [ ] Build MarkdownViewer with rendered HTML
- [ ] Build ImageViewer with zoom, pan, and rotate
- [ ] Build VideoPlayer with HTML5 video controls
- [ ] Build AudioPlayer with custom UI and progress bar
- [ ] Implement Quick Preview (Space key on selected file)
- [ ] Build PreviewPanel (slides in from right with GSAP)
- [ ] Implement tab-based preview (multiple files open)
- [ ] "Open in System App" fallback via Tauri shell plugin

**Deliverable: In-app preview for PDF, Word, CSV, Excel, code, images, video, audio, markdown.**

### Phase 6: Search, Command Palette & Shortcuts (Week 9)
**Goal: Power-user productivity features**

- [ ] Build GlobalSearch overlay (Cmd+K) with GSAP spring animation
- [ ] Implement fuzzy search with Fuse.js across all entity types
- [ ] Implement SQLite FTS5 full-text search for deep content queries
- [ ] Build SearchResults with category grouping and preview
- [ ] Build SearchFilters (type, date range, tags, folder)
- [ ] Build CommandPalette (Cmd+Shift+P) with all app commands
- [ ] Register all keyboard shortcuts via Tauri global-shortcut plugin
- [ ] Build shortcut customization UI in settings
- [ ] Implement recent files tracking and quick access
- [ ] Build Activity timeline page
- [ ] Implement tag management UI (create, rename, color, delete)
- [ ] Build tag filter chips in all list views

**Deliverable: Spotlight-style search, command palette, all shortcuts, activity timeline.**

### Phase 7: Sync Engine (Week 10-11)
**Goal: Seamless cross-device synchronization**

- [ ] Implement Supabase Auth flow (magic link + email/password)
- [ ] Build auth UI (login, signup, callback page)
- [ ] Implement JWT token storage in Tauri Secure Store
- [ ] Build device registration (unique device ID + name)
- [ ] Implement sync queue processor in Rust (background task)
- [ ] Implement metadata sync: SQLite ↔ PostgreSQL (bidirectional)
- [ ] Implement file sync: local vault → Supabase Storage (chunked upload)
- [ ] Implement delta sync with blake3 hashing (only upload changed chunks)
- [ ] Implement zstd compression for chunks before upload
- [ ] Set up Supabase Realtime subscription for instant push notifications
- [ ] Implement pull sync: download changes from cloud → local SQLite + files
- [ ] Build conflict detection (same item modified on two devices)
- [ ] Build conflict resolution UI (keep this, keep other, keep both, diff view)
- [ ] Implement retry with exponential backoff for failed syncs
- [ ] Build SyncStatus indicator in status bar (synced, syncing, offline, error)
- [ ] Build sync log viewer (history of all sync operations)
- [ ] Implement first-launch full sync (new device gets everything)
- [ ] Stress test with 1000+ files across two devices

**Deliverable: Full offline-first sync. Install on new computer → login → everything appears.**

### Phase 8: Polish, Performance & Portfolio Ready (Week 12)
**Goal: Apple-grade polish, performance optimization, portfolio presentation**

- [ ] Performance audit: ensure sub-100ms UI interactions
- [ ] Implement virtual scrolling for large file lists (1000+ items)
- [ ] Lazy load all preview libraries (code-split per file type)
- [ ] Optimize SQLite queries with EXPLAIN and proper indexing
- [ ] Implement thumbnail generation for images (Rust-side, async)
- [ ] Add loading skeletons to all data-fetching views
- [ ] Micro-interaction polish: all hover states, focus rings, transition polish
- [ ] Accessibility audit: keyboard navigation, ARIA labels, screen reader
- [ ] Build Settings panel: General, Appearance, Sync, Shortcuts, Account
- [ ] Build onboarding flow (first-launch walkthrough with GSAP animations)
- [ ] Build "About DevVault" dialog with version info
- [ ] Set up Tauri updater for auto-updates (GitHub Releases)
- [ ] Build app icon set (all platforms, all sizes)
- [ ] Configure Tauri builds for macOS (.dmg), Windows (.msi/.exe), Linux (.AppImage/.deb)
- [ ] Write README with screenshots, feature list, tech stack
- [ ] Create portfolio landing page section with app preview video/GIF

**Deliverable: Portfolio-ready desktop app. Fast, beautiful, synced, and polished.**

---

## 14. Performance Targets

| Metric | Target |
|--------|--------|
| App cold start | < 1.5 seconds |
| App warm start | < 500ms |
| UI interaction response | < 100ms |
| File list render (100 items) | < 50ms |
| File list render (1000 items) | < 200ms (virtual scroll) |
| Search results | < 150ms |
| File upload start (drag & drop → processing) | < 200ms |
| Note save (local) | < 50ms |
| Sync metadata batch | < 2 seconds per 100 items |
| Memory usage (idle) | < 100MB |
| Memory usage (active, 1000 files loaded) | < 300MB |
| App bundle size (installed) | < 25MB |
| SQLite query (indexed) | < 5ms |
| Full-text search (FTS5, 10K docs) | < 100ms |

---

## Summary

**DevVault** is a 12-week build that delivers:

- A lightning-fast Tauri v2 desktop app (macOS, Windows, Linux)
- Built entirely with Svelte 5 Runes, SvelteKit, TailwindCSS v4, GSAP
- Complete file management with drag & drop, folders, and in-app preview
- Rich notes editor, prompt library, reminder system, course tracker, code snippets
- Offline-first architecture with seamless cross-device sync via Supabase
- Spotlight-style search, command palette, and extensive keyboard shortcuts
- Apple-grade UI/UX with portfolio-worthy animations and design
- Secure authentication, encrypted storage, and Row Level Security

**This is not just an app — it's a personal command center for a developer's entire digital workflow.**
