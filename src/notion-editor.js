// Enhanced Notion-Style Editor with improved visual feedback
// Handles the integrated title + content editor with real-time markdown rendering

class NotionEditor {
  constructor() {
    this.isEditMode = false;
    this.currentNoteId = null;
    this.titleInput = null;
    this.contentEditor = null;
    this.contentPreview = null;
    this.toggleButton = null;
    this.saveTimeout = null;
    this.titleSaveTimeout = null;
    
    this.initializeElements();
    this.attachEventListeners();
  }

  initializeElements() {
    this.titleInput = document.querySelector('#note-title');
    this.contentEditor = document.querySelector('#note-content-editor');
    this.contentPreview = document.querySelector('#note-content-preview');
    this.toggleButton = document.querySelector('#toggle-edit-mode');
    this.backButton = document.querySelector('#back-to-notes');
    this.deleteButton = document.querySelector('#delete-note-btn');
    this.editorContainer = document.querySelector('#note-editor-container');
  }

  attachEventListeners() {
    // Title input events with enhanced feedback
    if (this.titleInput) {
      this.titleInput.addEventListener('input', () => this.handleTitleChange());
      this.titleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.focusContent();
          // Add visual feedback for transition
          this.titleInput.style.transform = 'scale(0.98)';
          setTimeout(() => {
            this.titleInput.style.transform = '';
          }, 150);
        }
      });
      
      // Enhanced focus effects
      this.titleInput.addEventListener('focus', () => {
        this.titleInput.style.transform = 'scale(1.01)';
        this.titleInput.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      });
      
      this.titleInput.addEventListener('blur', () => {
        this.titleInput.style.transform = '';
      });
    }

    // Content editor events with enhanced feedback
    if (this.contentEditor) {
      this.contentEditor.addEventListener('input', () => this.handleContentChange());
      this.contentEditor.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
      
      // Enhanced focus effects
      this.contentEditor.addEventListener('focus', () => {
        this.contentEditor.style.transform = 'scale(1.005)';
        this.contentEditor.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.1)';
      });
      
      this.contentEditor.addEventListener('blur', () => {
        this.contentEditor.style.transform = '';
        this.contentEditor.style.boxShadow = '';
      });
    }

    // Preview click to edit with visual feedback
    if (this.contentPreview) {
      this.contentPreview.addEventListener('click', () => {
        this.enterEditMode();
        // Add click feedback
        this.contentPreview.style.transform = 'scale(0.995)';
        setTimeout(() => {
          this.contentPreview.style.transform = '';
        }, 100);
      });
      
      // Enhanced hover effects
      this.contentPreview.addEventListener('mouseenter', () => {
        this.contentPreview.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.02), rgba(16, 185, 129, 0.02))';
        this.contentPreview.style.borderRadius = '8px';
      });
      
      this.contentPreview.addEventListener('mouseleave', () => {
        this.contentPreview.style.background = '';
        this.contentPreview.style.borderRadius = '';
      });
    }

    // Toggle button with enhanced animations
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => {
        this.toggleEditMode();
        // Add click animation
        this.toggleButton.style.transform = 'scale(0.9) rotate(180deg)';
        setTimeout(() => {
          this.toggleButton.style.transform = '';
        }, 200);
      });
    }

    // Back button with slide animation
    if (this.backButton) {
      this.backButton.addEventListener('click', () => {
        this.closeEditor();
        // Add slide out animation
        if (this.editorContainer) {
          this.editorContainer.style.transform = 'translateX(-20px)';
          this.editorContainer.style.opacity = '0';
          setTimeout(() => {
            this.editorContainer.style.transform = '';
            this.editorContainer.style.opacity = '';
          }, 300);
        }
      });
    }

    // Delete button with confirmation animation
    if (this.deleteButton) {
      this.deleteButton.addEventListener('click', () => {
        // Add warning animation
        this.deleteButton.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
          this.deleteButton.style.animation = '';
          this.deleteCurrentNote();
        }, 500);
      });
    }

    // Auto-exit edit mode when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isEditMode &&
          !this.contentEditor.contains(e.target) &&
          !this.toggleButton.contains(e.target)) {
        this.exitEditMode();
      }
    });
  }

  // Show the editor for a note with enhanced animations
  showEditor(noteId, note) {
    this.currentNoteId = noteId;

    // Hide welcome message and old editor
    const welcomeMessage = document.querySelector('#welcome-message');
    const oldEditor = document.querySelector('#note-header');

    if (welcomeMessage) {
      welcomeMessage.style.transform = 'translateY(-20px)';
      welcomeMessage.style.opacity = '0';
      setTimeout(() => {
        welcomeMessage.classList.add('hidden');
        welcomeMessage.style.transform = '';
        welcomeMessage.style.opacity = '';
      }, 300);
    }

    if (oldEditor) oldEditor.classList.add('hidden');

    // Show new editor with slide-in animation
    if (this.editorContainer) {
      this.editorContainer.classList.remove('hidden');
      this.editorContainer.style.transform = 'translateY(20px)';
      this.editorContainer.style.opacity = '0';

      // Animate in
      requestAnimationFrame(() => {
        this.editorContainer.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        this.editorContainer.style.transform = 'translateY(0)';
        this.editorContainer.style.opacity = '1';

        setTimeout(() => {
          this.editorContainer.style.transition = '';
        }, 400);
      });
    }

    // Populate with note data
    if (this.titleInput) {
      this.titleInput.value = note.title || '';
      // Add typing animation for existing title
      if (note.title) {
        this.animateTyping(this.titleInput, note.title);
      }
    }

    // Set content in both editor and preview
    const content = note.content || '';
    if (this.contentEditor) {
      this.contentEditor.value = content;
    }

    this.updatePreview(content);

    // Focus title if empty, otherwise focus content
    setTimeout(() => {
      if (!note.title) {
        this.titleInput?.focus();
      } else {
        this.focusContent();
      }
    }, 400);

    // Update save status
    this.updateSaveStatus('saved');
  }

  // Animate typing effect for existing content
  animateTyping(element, text) {
    element.value = '';
    let i = 0;
    const typeInterval = setInterval(() => {
      element.value += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(typeInterval);
      }
    }, 50);
  }

  // Hide the editor with fade out animation
  hideEditor() {
    if (this.editorContainer) {
      this.editorContainer.style.transform = 'translateY(-20px)';
      this.editorContainer.style.opacity = '0';

      setTimeout(() => {
        this.editorContainer.classList.add('hidden');
        this.editorContainer.style.transform = '';
        this.editorContainer.style.opacity = '';
      }, 300);
    }

    const welcomeMessage = document.querySelector('#welcome-message');
    if (welcomeMessage) {
      setTimeout(() => {
        welcomeMessage.classList.remove('hidden');
        welcomeMessage.style.transform = 'translateY(20px)';
        welcomeMessage.style.opacity = '0';

        requestAnimationFrame(() => {
          welcomeMessage.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
          welcomeMessage.style.transform = 'translateY(0)';
          welcomeMessage.style.opacity = '1';

          setTimeout(() => {
            welcomeMessage.style.transition = '';
          }, 400);
        });
      }, 100);
    }

    this.currentNoteId = null;
    this.exitEditMode();
  }

  // Enter edit mode with smooth transition
  enterEditMode() {
    this.isEditMode = true;

    if (this.contentEditor && this.contentPreview) {
      // Fade out preview
      this.contentPreview.style.opacity = '0';
      this.contentPreview.style.transform = 'translateY(-10px)';

      setTimeout(() => {
        this.contentEditor.classList.remove('hidden');
        this.contentPreview.classList.add('hidden');

        // Fade in editor
        this.contentEditor.style.opacity = '0';
        this.contentEditor.style.transform = 'translateY(10px)';

        requestAnimationFrame(() => {
          this.contentEditor.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          this.contentEditor.style.opacity = '1';
          this.contentEditor.style.transform = 'translateY(0)';
          this.contentEditor.focus();

          // Position cursor at end
          this.contentEditor.setSelectionRange(this.contentEditor.value.length, this.contentEditor.value.length);

          setTimeout(() => {
            this.contentEditor.style.transition = '';
          }, 300);
        });
      }, 150);
    }

    // Update toggle button icon with rotation
    this.updateToggleIcon();
  }

  // Exit edit mode with smooth transition
  exitEditMode() {
    this.isEditMode = false;

    if (this.contentEditor && this.contentPreview) {
      // Fade out editor
      this.contentEditor.style.opacity = '0';
      this.contentEditor.style.transform = 'translateY(-10px)';

      setTimeout(() => {
        this.contentEditor.classList.add('hidden');
        this.contentPreview.classList.remove('hidden');

        // Reset preview styles and fade in
        this.contentPreview.style.opacity = '0';
        this.contentPreview.style.transform = 'translateY(10px)';

        requestAnimationFrame(() => {
          this.contentPreview.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          this.contentPreview.style.opacity = '1';
          this.contentPreview.style.transform = 'translateY(0)';

          setTimeout(() => {
            this.contentPreview.style.transition = '';
          }, 300);
        });
      }, 150);
    }

    // Update toggle button icon
    this.updateToggleIcon();
  }
