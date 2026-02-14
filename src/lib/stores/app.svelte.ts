import type { ThemeMode, ViewMode, SyncStatus, ToastMessage, Workspace, Folder, VaultFile } from '$types';

// ============================================
// THEME STORE
// ============================================

class ThemeStore {
  mode = $state<ThemeMode>('dark');
  resolved = $derived(this.mode === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : this.mode
  );

  toggle() {
    this.mode = this.resolved === 'dark' ? 'light' : 'dark';
    this.apply();
  }

  setMode(mode: ThemeMode) {
    this.mode = mode;
    this.apply();
  }

  apply() {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', this.resolved === 'dark');
    }
  }
}

export const theme = new ThemeStore();

// ============================================
// UI STORE
// ============================================

class UIStore {
  sidebarOpen = $state(true);
  sidebarWidth = $state(260);
  viewMode = $state<ViewMode>('grid');
  previewOpen = $state(false);
  previewFileId = $state<string | null>(null);
  commandPaletteOpen = $state(false);
  searchOpen = $state(false);
  activeModal = $state<string | null>(null);

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode;
  }

  openPreview(fileId: string) {
    this.previewFileId = fileId;
    this.previewOpen = true;
  }

  closePreview() {
    this.previewOpen = false;
    this.previewFileId = null;
  }

  toggleCommandPalette() {
    this.commandPaletteOpen = !this.commandPaletteOpen;
  }

  toggleSearch() {
    this.searchOpen = !this.searchOpen;
  }
}

export const ui = new UIStore();

// ============================================
// VAULT STORE (Files & Folders)
// ============================================

class VaultStore {
  workspaces = $state<Workspace[]>([]);
  currentWorkspaceId = $state<string | null>(null);
  folders = $state<Folder[]>([]);
  currentFolderId = $state<string | null>(null);
  files = $state<VaultFile[]>([]);
  selectedFileIds = $state<Set<string>>(new Set());
  clipboardFileIds = $state<string[]>([]);
  clipboardAction = $state<'copy' | 'cut' | null>(null);
  isLoading = $state(false);

  currentWorkspace = $derived(
    this.workspaces.find(w => w.id === this.currentWorkspaceId) ?? null
  );

  currentFolder = $derived(
    this.folders.find(f => f.id === this.currentFolderId) ?? null
  );

  rootFolders = $derived(
    this.folders.filter(f => f.parent_id === null && f.is_deleted === 0)
  );

  selectedFiles = $derived(
    this.files.filter(f => this.selectedFileIds.has(f.id))
  );

  selectFile(id: string, multi = false) {
    if (multi) {
      const newSet = new Set(this.selectedFileIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      this.selectedFileIds = newSet;
    } else {
      this.selectedFileIds = new Set([id]);
    }
  }

  clearSelection() {
    this.selectedFileIds = new Set();
  }

  selectAll() {
    this.selectedFileIds = new Set(this.files.map(f => f.id));
  }

  copyFiles(ids: string[]) {
    this.clipboardFileIds = ids;
    this.clipboardAction = 'copy';
  }

  cutFiles(ids: string[]) {
    this.clipboardFileIds = ids;
    this.clipboardAction = 'cut';
  }
}

export const vault = new VaultStore();

// ============================================
// SYNC STORE
// ============================================

class SyncStore {
  status = $state<SyncStatus>('offline');
  lastSyncedAt = $state<string | null>(null);
  pendingCount = $state(0);
  isAuthenticated = $state(false);
  userEmail = $state<string | null>(null);
}

export const sync = new SyncStore();

// ============================================
// TOAST STORE
// ============================================

class ToastStore {
  toasts = $state<ToastMessage[]>([]);

  add(toast: Omit<ToastMessage, 'id'>) {
    const id = crypto.randomUUID();
    this.toasts = [...this.toasts, { ...toast, id }];

    const duration = toast.duration ?? 4000;
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  success(title: string, description?: string) {
    this.add({ type: 'success', title, description });
  }

  error(title: string, description?: string) {
    this.add({ type: 'error', title, description });
  }

  warning(title: string, description?: string) {
    this.add({ type: 'warning', title, description });
  }

  info(title: string, description?: string) {
    this.add({ type: 'info', title, description });
  }
}

export const toasts = new ToastStore();

// ============================================
// NAVIGATION STORE
// ============================================

class NavStore {
  activePath = $state('/');
  breadcrumbs = $state<{ label: string; href: string }[]>([]);
  history = $state<string[]>([]);
  historyIndex = $state(-1);

  navigate(path: string) {
    this.activePath = path;
    this.history = [...this.history.slice(0, this.historyIndex + 1), path];
    this.historyIndex = this.history.length - 1;
  }

  goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.activePath = this.history[this.historyIndex];
    }
  }

  goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.activePath = this.history[this.historyIndex];
    }
  }
}

export const nav = new NavStore();
