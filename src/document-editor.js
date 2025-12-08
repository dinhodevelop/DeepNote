/**
 * DEEPNOTE DOCUMENT EDITOR - ESTILO NOTION/OBSIDIAN
 * Editor de documento contínuo com Markdown como fonte da verdade
 */

class DocumentEditor {
  constructor() {
    this.isPreviewMode = false;
    this.currentNoteId = null;
    this.saveTimeout = null;
    this.lastSavedContent = '';
    
    this.initializeElements();
    this.attachEventListeners();
    this.setupMarkdownRenderer();
  }

  initializeElements() {
    // Elementos principais
    this.welcomeMessage = document.querySelector('#welcome-message');
    this.documentEditor = document.querySelector('#document-editor');
    this.documentContent = document.querySelector('#document-content');
    this.markdownPreview = document.querySelector('#markdown-preview');
    this.editorToolbar = document.querySelector('#editor-toolbar');
    
    // Controles
    this.toggleModeBtn = document.querySelector('#toggle-mode-btn');
    this.showTasksBtn = document.querySelector('#show-tasks-btn');
    this.deleteBtn = document.querySelector('#delete-note-btn');
    this.saveIndicator = document.querySelector('#save-indicator');
    this.saveText = document.querySelector('#save-text');
  }

  attachEventListeners() {
    // Toggle entre edição e preview
    this.toggleModeBtn?.addEventListener('click', () => this.toggleMode());

    // Show tasks
    this.showTasksBtn?.addEventListener('click', () => this.showTasks());

    // Delete note
    this.deleteBtn?.addEventListener('click', () => this.deleteNote());
    
    // Auto-save no input
    this.documentContent?.addEventListener('input', () => this.handleInput());
    
    // Keyboard shortcuts
    this.documentContent?.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    
    // Show/hide toolbar on focus
    this.documentContent?.addEventListener('focus', () => this.showToolbar());
    this.documentContent?.addEventListener('blur', () => this.hideToolbar());
    
    // Prevent tab from leaving textarea
    this.documentContent?.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.insertTab();
      }
    });
  }

  setupMarkdownRenderer() {
    // Configurar marked.js para renderização de Markdown
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
      });
    }
  }

  // ===== CORE FUNCTIONALITY =====

  showEditor(noteId = null, noteData = null) {
    this.currentNoteId = noteId;

    // Hide welcome, show editor
    this.welcomeMessage?.classList.add('hidden');
    this.documentEditor?.classList.remove('hidden');

    // Load content
    if (noteData && noteData.content) {
      this.documentContent.value = noteData.content;
      this.lastSavedContent = noteData.content;
    } else {
      // New note - start with template
      const template = `# Nova Nota

Comece a escrever aqui...`;
      this.documentContent.value = template;
      this.lastSavedContent = '';
    }

    // Focus editor
    setTimeout(() => {
      this.documentContent?.focus();
      // Position cursor after title
      const lines = this.documentContent.value.split('\n');
      if (lines[0].startsWith('# ')) {
        const titleEnd = lines[0].length + 1;
        this.documentContent.setSelectionRange(titleEnd, titleEnd);
      }
    }, 100);

    // Initialize tasks for this note
    if (window.taskManager && noteId) {
      window.taskManager.initializeTasksForNote(noteId);
    }

    this.updateSaveStatus('saved');
  }

  hideEditor() {
    this.documentEditor?.classList.add('hidden');
    this.welcomeMessage?.classList.remove('hidden');
    this.currentNoteId = null;
    this.documentContent.value = '';
    this.lastSavedContent = '';
  }

  toggleMode() {
    this.isPreviewMode = !this.isPreviewMode;
    
    if (this.isPreviewMode) {
      // Switch to preview
      this.renderMarkdown();
      document.querySelector('#markdown-editor')?.classList.add('hidden');
      this.markdownPreview?.classList.remove('hidden');
      
      // Update button icon
      this.toggleModeBtn.innerHTML = `
        <svg class="w-4 h-4 text-gray-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>`;
      this.toggleModeBtn.title = 'Editar';
    } else {
      // Switch to edit
      document.querySelector('#markdown-editor')?.classList.remove('hidden');
      this.markdownPreview?.classList.add('hidden');
      
      // Update button icon
      this.toggleModeBtn.innerHTML = `
        <svg class="w-4 h-4 text-gray-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>`;
      this.toggleModeBtn.title = 'Visualizar';
      
      this.documentContent?.focus();
    }
  }

  renderMarkdown() {
    const content = this.documentContent?.value || '';
    
    if (typeof marked !== 'undefined') {
      const html = marked.parse(content);
      this.markdownPreview.innerHTML = html;
    } else {
      // Fallback simples se marked.js não estiver disponível
      const html = this.simpleMarkdownRender(content);
      this.markdownPreview.innerHTML = html;
    }
  }

  simpleMarkdownRender(text) {
    return text
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|u|l])(.+)$/gm, '<p>$1</p>');
  }

  // ===== UTILITY METHODS =====

  handleInput() {
    this.updateSaveStatus('draft');
    this.scheduleAutoSave();
  }

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + S = Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      this.saveNote();
    }
    
    // Ctrl/Cmd + P = Toggle Preview
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      this.toggleMode();
    }
  }

  insertTab() {
    const start = this.documentContent.selectionStart;
    const end = this.documentContent.selectionEnd;
    const value = this.documentContent.value;
    
    this.documentContent.value = value.substring(0, start) + '  ' + value.substring(end);
    this.documentContent.selectionStart = this.documentContent.selectionEnd = start + 2;
  }

  showToolbar() {
    this.editorToolbar?.classList.add('visible');
  }

  hideToolbar() {
    setTimeout(() => {
      if (!this.editorToolbar?.matches(':hover')) {
        this.editorToolbar?.classList.remove('visible');
      }
    }, 200);
  }

  // ===== SAVE/LOAD FUNCTIONALITY =====

  scheduleAutoSave() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveNote(true);
    }, 2000);
  }

  saveNote(isAutoSave = false) {
    const content = this.documentContent?.value.trim() || '';

    if (!content) {
      this.updateSaveStatus('draft');
      return;
    }

    // Extract title from first line (if it's a heading)
    const lines = content.split('\n');
    let title = 'Sem título';

    if (lines[0].startsWith('# ')) {
      title = lines[0].substring(2).trim();
    } else if (lines[0].trim()) {
      title = lines[0].trim().substring(0, 50) + (lines[0].length > 50 ? '...' : '');
    }

    if (!isAutoSave) {
      this.updateSaveStatus('saving');
    }

    try {
      if (this.currentNoteId) {
        // Update existing note
        window.storageAPI?.updateNote(this.currentNoteId, {
          title: title,
          content: content,
          updated: Date.now()
        });
      } else {
        // Create new note
        const newNote = {
          id: this.generateId(),
          title: title,
          content: content,
          created: Date.now(),
          updated: Date.now()
        };

        window.storageAPI?.saveNote(newNote);
        this.currentNoteId = newNote.id;
      }

      this.lastSavedContent = content;
      this.updateSaveStatus('saved');

      // Refresh notes list
      if (window.renderNotes) {
        window.renderNotes();
      }

    } catch (error) {
      console.error('Error saving note:', error);
      this.updateSaveStatus('error');
    }
  }

  deleteNote() {
    if (!this.currentNoteId) return;

    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      try {
        window.storageAPI?.deleteNote(this.currentNoteId);
        this.hideEditor();

        // Refresh notes list
        if (window.renderNotes) {
          window.renderNotes();
        }
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  }

  updateSaveStatus(status) {
    const statusConfig = {
      'draft': { color: '#f59e0b', text: 'Rascunho' },
      'saving': { color: '#3b82f6', text: 'Salvando...' },
      'saved': { color: '#10b981', text: 'Salvo' },
      'error': { color: '#ef4444', text: 'Erro' }
    };

    const config = statusConfig[status] || statusConfig['draft'];

    if (this.saveIndicator) {
      this.saveIndicator.style.backgroundColor = config.color;
    }

    if (this.saveText) {
      this.saveText.textContent = config.text;
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ===== PUBLIC API =====

  getContent() {
    return this.documentContent?.value || '';
  }

  setContent(content) {
    if (this.documentContent) {
      this.documentContent.value = content;
      this.lastSavedContent = content;
    }
  }

  hasUnsavedChanges() {
    return this.getContent() !== this.lastSavedContent;
  }

  getCurrentTitle() {
    const content = this.getContent();
    const lines = content.split('\n');

    if (lines[0].startsWith('# ')) {
      return lines[0].substring(2).trim();
    }

    return lines[0].trim().substring(0, 50) || 'Sem título';
  }

  showTasks() {
    if (window.taskManager && this.currentNoteId) {
      // Show tasks container
      const tasksContainer = document.querySelector('#tasks-container');
      if (tasksContainer) {
        tasksContainer.classList.remove('hidden');
      }

      // Initialize tasks for this note
      window.taskManager.initializeTasksForNote(this.currentNoteId);

      // Scroll to tasks section
      setTimeout(() => {
        tasksContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
}

// Export for use in other modules
window.DocumentEditor = DocumentEditor;
