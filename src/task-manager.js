// Enhanced Task Management System for DeepNote
// Tasks are now specific to individual notes with professional design

class TaskManager {
  constructor() {
    this.currentNoteId = null;
    this.currentTaskId = null;
    this.editingTaskId = null;
    this.activeTimers = new Map(); // Store active timers for each task
    this.draggedTask = null;

    // Initialize after DOM is ready
    this.initializeEventListeners();
    this.restoreTimerStates();
  }

  initializeEventListeners() {
    // Manual time modal
    const saveManualTimeBtn = document.querySelector("#save-manual-time-btn");
    const cancelManualTimeBtn = document.querySelector("#cancel-manual-time-btn");
    const manualTimeModal = document.querySelector("#manual-time-modal");

    if (saveManualTimeBtn) saveManualTimeBtn.onclick = () => this.saveManualTime();
    if (cancelManualTimeBtn) cancelManualTimeBtn.onclick = () => this.hideManualTimeModal();

    // Task details modal
    const closeTaskDetails = document.querySelector("#close-task-details");
    const taskDetailsModal = document.querySelector("#task-details-modal");

    if (closeTaskDetails) closeTaskDetails.onclick = () => this.hideTaskDetailsModal();

    // Help modal
    const helpBtn = document.querySelector("#help-btn");
    const closeHelpModal = document.querySelector("#close-help-modal");
    const helpModal = document.querySelector("#help-modal");

    if (helpBtn) helpBtn.onclick = () => this.showHelpModal();
    if (closeHelpModal) closeHelpModal.onclick = () => this.hideHelpModal();

    // Close modals on backdrop click
    if (manualTimeModal) {
      manualTimeModal.onclick = (e) => {
        if (e.target === manualTimeModal) this.hideManualTimeModal();
      };
    }
    if (taskDetailsModal) {
      taskDetailsModal.onclick = (e) => {
        if (e.target === taskDetailsModal) this.hideTaskDetailsModal();
      };
    }
    if (helpModal) {
      helpModal.onclick = (e) => {
        if (e.target === helpModal) this.hideHelpModal();
      };
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

    // Auto-save timer states periodically
    setInterval(() => this.persistTimerStates(), 30000); // Every 30 seconds

    // Handle window close to save timer states
    window.addEventListener('beforeunload', () => this.persistTimerStates());
  }

  // Initialize tasks section within a note
  initializeTasksForNote(noteId) {
    this.currentNoteId = noteId;
    window.storageAPI.initializeNoteTasks(noteId);
    this.renderTasksSection();
  }

  // Clean up timers when a note is deleted
  cleanupNoteTimers(noteId) {
    // Get all tasks for this note
    const tasks = window.storageAPI.getNoteTasks(noteId);

    // Clear any active timers for tasks in this note
    tasks.forEach(task => {
      if (this.activeTimers.has(task.id)) {
        clearInterval(this.activeTimers.get(task.id));
        this.activeTimers.delete(task.id);
      }
    });

    // If this is the current note being viewed, clear the current note ID
    if (this.currentNoteId === noteId) {
      this.currentNoteId = null;
    }

    console.log(`Cleaned up timers for deleted note: ${noteId}`);
  }

  // Toggle tasks section visibility
  toggleTasksSection() {
    const container = document.querySelector('#tasks-content-container');
    const toggleIcon = document.querySelector('#tasks-toggle-icon');

    if (!container || !toggleIcon) return;

    const isCollapsed = container.classList.contains('collapsed');

    if (isCollapsed) {
      // Expandir
      container.classList.remove('collapsed');
      container.classList.add('expanded');
      toggleIcon.style.transform = 'rotate(0deg)';
      toggleIcon.parentElement.title = 'Colapsar seção de tarefas';
    } else {
      // Colapsar
      container.classList.remove('expanded');
      container.classList.add('collapsed');
      toggleIcon.style.transform = 'rotate(-90deg)';
      toggleIcon.parentElement.title = 'Expandir seção de tarefas';
    }
  }

  // Render tasks section within the note view
  renderTasksSection() {
    if (!this.currentNoteId) return;

    const noteContent = document.querySelector("#note-content");
    if (!noteContent) return;

    // Check if tasks section already exists
    let tasksSection = document.querySelector("#note-tasks-section");
    if (!tasksSection) {
      tasksSection = this.createTasksSection();
      noteContent.parentNode.insertBefore(tasksSection, noteContent.nextSibling);
    }

    this.loadNoteTasks();
  }

  createTasksSection() {
    const section = document.createElement('div');
    section.id = 'note-tasks-section';
    section.className = 'mt-6 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-4';

    section.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            ${Icons.get('checkCircle', 'w-5 h-5')}
            Tarefas
          </h3>
          <button id="toggle-tasks-section" class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors" title="Expandir/Colapsar seção de tarefas">
            <svg id="tasks-toggle-icon" class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
        <button id="add-note-task-btn" class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition px-3 py-2 rounded-md text-sm text-white font-medium flex items-center gap-2">
          ${Icons.get('plus', 'w-4 h-4')}
          Nova Tarefa
        </button>
      </div>

      <!-- Container Colapsável do Conteúdo das Tarefas -->
      <div id="tasks-content-container" class="collapsible-section expanded">
        <!-- Task Form -->
        <div id="note-task-form" class="bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 mb-4 hidden">
          <div class="space-y-3">
            <input id="note-task-title" type="text" placeholder="Título da tarefa..."
              class="w-full bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 focus:border-blue-500 dark:focus:border-blue-400 outline-none text-sm font-medium px-3 py-2 rounded text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 transition-colors">
            <textarea id="note-task-description" placeholder="Descrição (opcional)..."
              class="w-full bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 focus:border-blue-500 dark:focus:border-blue-400 outline-none text-sm p-3 rounded resize-none h-16 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 transition-colors"></textarea>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-zinc-300">Tempo estimado:</label>
                <input id="note-task-hours" type="number" min="0" max="23" value="1" class="w-16 px-2 py-1 border border-gray-300 dark:border-zinc-600 rounded text-center text-sm bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100">
                <span class="text-sm text-gray-500 dark:text-zinc-400">h</span>
                <input id="note-task-minutes" type="number" min="0" max="59" value="0" class="w-16 px-2 py-1 border border-gray-300 dark:border-zinc-600 rounded text-center text-sm bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100">
                <span class="text-sm text-gray-500 dark:text-zinc-400">min</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button id="save-note-task-btn" class="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition px-4 py-2 rounded text-sm text-white font-medium flex items-center gap-2">
                ${Icons.get('save', 'w-4 h-4')}
                Salvar
              </button>
              <button id="cancel-note-task-btn" class="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 transition px-4 py-2 rounded text-sm text-white font-medium">
                Cancelar
              </button>
            </div>
          </div>
        </div>

        <!-- Tasks Grid -->
      <div id="note-tasks-grid" class="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4">
        <!-- Backlog Column -->
        <div class="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3 min-h-[200px]" data-status="backlog">
          <div class="flex items-center gap-2 mb-3">
            ${Icons.get('circle', 'w-3 h-3 text-gray-400')}
            <h4 class="font-medium text-gray-700 dark:text-zinc-300 text-sm">Backlog</h4>
            <span class="backlog-count text-xs bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400 px-2 py-1 rounded-full">0</span>
          </div>
          <div class="backlog-tasks space-y-2"></div>
        </div>

        <!-- In Progress Column -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 min-h-[200px]" data-status="progress">
          <div class="flex items-center gap-2 mb-3">
            ${Icons.get('circle', 'w-3 h-3 text-blue-500')}
            <h4 class="font-medium text-blue-700 dark:text-blue-300 text-sm">Em Progresso</h4>
            <span class="progress-count text-xs bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">0</span>
          </div>
          <div class="progress-tasks space-y-2"></div>
        </div>

        <!-- Done Column -->
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 min-h-[200px]" data-status="done">
          <div class="flex items-center gap-2 mb-3">
            ${Icons.get('circle', 'w-3 h-3 text-green-500')}
            <h4 class="font-medium text-green-700 dark:text-green-300 text-sm">Concluído</h4>
            <span class="done-count text-xs bg-green-200 dark:bg-green-800 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">0</span>
          </div>
          <div class="done-tasks space-y-2"></div>
        </div>
      </div>
      </div>
    `;

    // Add event listeners for the new elements
    this.attachTaskSectionEventListeners(section);

    return section;
  }

  attachTaskSectionEventListeners(section) {
    // Add task button
    const addTaskBtn = section.querySelector('#add-note-task-btn');
    if (addTaskBtn) {
      addTaskBtn.onclick = () => this.showTaskForm();
    }

    // Toggle tasks section button
    const toggleTasksBtn = section.querySelector('#toggle-tasks-section');
    if (toggleTasksBtn) {
      toggleTasksBtn.onclick = () => this.toggleTasksSection();
    }

    // Save task button
    const saveTaskBtn = section.querySelector('#save-note-task-btn');
    if (saveTaskBtn) {
      saveTaskBtn.onclick = () => this.saveTask();
    }

    // Cancel task button
    const cancelTaskBtn = section.querySelector('#cancel-note-task-btn');
    if (cancelTaskBtn) {
      cancelTaskBtn.onclick = () => this.hideTaskForm();
    }

    // Form validation
    const titleInput = section.querySelector('#note-task-title');
    const hoursInput = section.querySelector('#note-task-hours');
    const minutesInput = section.querySelector('#note-task-minutes');

    if (titleInput) {
      titleInput.addEventListener('input', () => this.validateTaskForm());
      titleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && this.isTaskFormValid()) {
          this.saveTask();
        }
      });
    }

    if (hoursInput) hoursInput.addEventListener('input', () => this.validateTaskForm());
    if (minutesInput) minutesInput.addEventListener('input', () => this.validateTaskForm());

    // Setup drag and drop for columns
    this.setupDragAndDrop(section);
  }

  setupDragAndDrop(section) {
    const columns = section.querySelectorAll('[data-status]');

    columns.forEach(column => {
      column.addEventListener('dragover', (e) => {
        e.preventDefault();
        column.classList.add('bg-opacity-75', 'border-2', 'border-dashed', 'border-blue-400');
      });

      column.addEventListener('dragleave', (e) => {
        if (!column.contains(e.relatedTarget)) {
          column.classList.remove('bg-opacity-75', 'border-2', 'border-dashed', 'border-blue-400');
        }
      });

      column.addEventListener('drop', (e) => {
        e.preventDefault();
        column.classList.remove('bg-opacity-75', 'border-2', 'border-dashed', 'border-blue-400');

        if (this.draggedTask) {
          const newStatus = column.dataset.status;
          this.updateTaskStatus(this.draggedTask.id, newStatus);
          this.draggedTask = null;
        }
      });
    });
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  resetTimer(taskId) {
    if (!this.currentNoteId) return;

    if (!confirm('Tem certeza que deseja resetar o timer desta tarefa? Todo o tempo registrado será perdido.')) {
      return;
    }

    // Clear local timer
    if (this.activeTimers.has(taskId)) {
      clearInterval(this.activeTimers.get(taskId));
      this.activeTimers.delete(taskId);
    }

    const timerData = {
      isRunning: false,
      currentSessionStart: null,
      workedTime: 0,
      totalWorkedTime: 0,
      pausedTime: 0,
      lastUpdate: Date.now()
    };

    window.storageAPI.updateNoteTaskTimer(this.currentNoteId, taskId, timerData);

    // Also clear manual time entries
    const tasks = window.storageAPI.getNoteTasks(this.currentNoteId);
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      window.storageAPI.updateNoteTask(this.currentNoteId, taskId, { ...task, manualTimeEntries: [] });
    }

    this.loadNoteTasks();
    this.showNotification('Timer resetado!');
  }

  updateTimerDisplay(taskId) {
    if (!this.currentNoteId) return;

    const tasks = window.storageAPI.getNoteTasks(this.currentNoteId);
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.timer?.isRunning) {
      if (this.activeTimers.has(taskId)) {
        clearInterval(this.activeTimers.get(taskId));
        this.activeTimers.delete(taskId);
      }
      return;
    }

    // Update the display in real-time
    const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskCard) {
      const currentSessionTime = Math.floor((Date.now() - task.timer.currentSessionStart) / 1000);
      const totalCurrentTime = (task.timer.workedTime || 0) + currentSessionTime;

      // Update progress bar and time display
      const progressBar = taskCard.querySelector('.bg-blue-500');
      const timeDisplay = taskCard.querySelector('.flex.items-center.gap-2 span');

      if (progressBar && timeDisplay) {
        const estimatedTime = task.estimatedTime || 0;
        const progress = estimatedTime > 0 ? Math.min((totalCurrentTime / estimatedTime) * 100, 100) : 0;
        progressBar.style.width = `${progress}%`;
        timeDisplay.textContent = `${this.formatTime(totalCurrentTime)} / ${this.formatTime(estimatedTime)}`;
      }
    }
  }

  updateTaskStatus(taskId, newStatus) {
    if (!this.currentNoteId) return;

    // If moving to done, pause timer first
    if (newStatus === 'done') {
      this.pauseTimer(taskId);
    }

    const updateData = {
      status: newStatus,
      updated: Date.now()
    };

    window.storageAPI.updateNoteTask(this.currentNoteId, taskId, updateData);
    this.loadNoteTasks();

    const statusMessages = {
      'backlog': 'Tarefa movida para Backlog',
      'progress': 'Tarefa em progresso',
      'done': 'Tarefa concluída! 🎉'
    };

    this.showNotification(statusMessages[newStatus] || 'Status atualizado');
  }

  showManualTimeModal(taskId) {
    this.currentTaskId = taskId;
    const manualTimeModal = document.querySelector("#manual-time-modal");
    if (manualTimeModal) {
      document.querySelector("#manual-hours").value = "0";
      document.querySelector("#manual-minutes").value = "30";
      document.querySelector("#manual-time-description").value = "";
      manualTimeModal.classList.remove("hidden");
      document.querySelector("#manual-minutes").focus();
    }
  }

  hideManualTimeModal() {
    const manualTimeModal = document.querySelector("#manual-time-modal");
    if (manualTimeModal) {
      manualTimeModal.classList.add("hidden");
      this.currentTaskId = null;
    }
  }

  saveManualTime() {
    if (!this.currentNoteId || !this.currentTaskId) return;

    const hours = parseInt(document.querySelector("#manual-hours").value) || 0;
    const minutes = parseInt(document.querySelector("#manual-minutes").value) || 0;
    const description = document.querySelector("#manual-time-description").value.trim();

    if (hours === 0 && minutes === 0) {
      this.showNotification('Informe um tempo válido', 'error');
      return;
    }

    const totalMinutes = hours * 60 + minutes;
    const timeEntry = {
      id: this.generateId(),
      minutes: totalMinutes,
      description: description || 'Tempo adicionado manualmente',
      timestamp: Date.now()
    };

    window.storageAPI.addNoteTaskManualTime(this.currentNoteId, this.currentTaskId, timeEntry);
    this.hideManualTimeModal();
    this.loadNoteTasks();
    this.showNotification(`${this.formatTimeInput(hours, minutes)} adicionado à tarefa`);
  }

  showTaskForm() {
    const taskForm = document.querySelector('#note-task-form');
    if (taskForm) {
      taskForm.classList.remove('hidden');
      const titleInput = document.querySelector('#note-task-title');
      if (titleInput) titleInput.focus();

      // Only clear form if NOT editing (creating new task)
      if (!this.editingTaskId) {
        this.clearTaskForm();
      }
    }
  }

  hideTaskForm() {
    const taskForm = document.querySelector('#note-task-form');
    if (taskForm) {
      taskForm.classList.add('hidden');
      this.clearTaskForm();
    }
  }

  clearTaskForm() {
    const titleInput = document.querySelector('#note-task-title');
    const descInput = document.querySelector('#note-task-description');
    const hoursInput = document.querySelector('#note-task-hours');
    const minutesInput = document.querySelector('#note-task-minutes');

    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    if (hoursInput) hoursInput.value = '1';
    if (minutesInput) minutesInput.value = '0';

    this.editingTaskId = null;
    this.validateTaskForm();
  }

  validateTaskForm() {
    const saveBtn = document.querySelector('#save-note-task-btn');
    const titleInput = document.querySelector('#note-task-title');
    const hoursInput = document.querySelector('#note-task-hours');
    const minutesInput = document.querySelector('#note-task-minutes');

    if (!saveBtn || !titleInput || !hoursInput || !minutesInput) return;

    const title = titleInput.value.trim();
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;

    const isValid = title.length > 0 && (hours > 0 || minutes > 0);

    saveBtn.disabled = !isValid;
    saveBtn.classList.toggle('opacity-50', !isValid);
    saveBtn.classList.toggle('cursor-not-allowed', !isValid);
  }

  isTaskFormValid() {
    const titleInput = document.querySelector('#note-task-title');
    const hoursInput = document.querySelector('#note-task-hours');
    const minutesInput = document.querySelector('#note-task-minutes');

    if (!titleInput || !hoursInput || !minutesInput) return false;

    const title = titleInput.value.trim();
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;

    return title.length > 0 && (hours > 0 || minutes > 0);
  }

  saveTask() {
    if (!this.currentNoteId || !this.isTaskFormValid()) return;

    const titleInput = document.querySelector('#note-task-title');
    const descInput = document.querySelector('#note-task-description');
    const hoursInput = document.querySelector('#note-task-hours');
    const minutesInput = document.querySelector('#note-task-minutes');

    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const estimatedTime = (hours * 60 + minutes) * 60; // Convert to seconds

    try {
      if (this.editingTaskId) {
        // EDITING: Preserve existing data, update only specific fields
        const tasks = window.storageAPI.getNoteTasks(this.currentNoteId);
        const existingTask = tasks.find(t => t.id === this.editingTaskId);

        if (!existingTask) {
          this.showNotification('Erro: Tarefa não encontrada', 'error');
          return;
        }

        // Create updated task preserving existing data
        const updatedTask = {
          ...existingTask, // Preserve all existing data
          title,           // Update only these fields
          description,
          estimatedTime,
          updated: Date.now() // Update timestamp
        };

        window.storageAPI.updateNoteTask(this.currentNoteId, this.editingTaskId, updatedTask);
        this.showNotification('Tarefa atualizada com sucesso!');
      } else {
        // CREATING: Create new task with default values
        const newTask = {
          id: this.generateId(),
          title,
          description,
          estimatedTime,
          status: 'backlog',
          isExpanded: false,
          created: Date.now(),
          updated: Date.now(),
          timer: {
            workedTime: 0,
            pausedTime: 0,
            isRunning: false,
            currentSessionStart: null,
            totalWorkedTime: 0
          },
          manualTimeEntries: []
        };

        window.storageAPI.saveNoteTask(this.currentNoteId, newTask);
        this.showNotification('Tarefa criada com sucesso!');
      }

      this.hideTaskForm();
      this.loadNoteTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      this.showNotification('Erro ao salvar tarefa', 'error');
    }
  }

  formatTime(seconds) {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      if (remainingSeconds > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }

  loadNoteTasks() {
    if (!this.currentNoteId) return;

    const tasks = window.storageAPI.getNoteTasks(this.currentNoteId);
    this.renderTasksGrid(tasks);
  }

  renderTasksGrid(tasks) {
    const backlogTasks = document.querySelector('.backlog-tasks');
    const progressTasks = document.querySelector('.progress-tasks');
    const doneTasks = document.querySelector('.done-tasks');

    const backlogCount = document.querySelector('.backlog-count');
    const progressCount = document.querySelector('.progress-count');
    const doneCount = document.querySelector('.done-count');

    if (!backlogTasks || !progressTasks || !doneTasks) return;

    // Clear existing content
    backlogTasks.innerHTML = '';
    progressTasks.innerHTML = '';
    doneTasks.innerHTML = '';

    // Group tasks by status
    const tasksByStatus = {
      backlog: tasks.filter(t => t.status === 'backlog'),
      progress: tasks.filter(t => t.status === 'progress'),
      done: tasks.filter(t => t.status === 'done')
    };

    // Update counters
    if (backlogCount) backlogCount.textContent = tasksByStatus.backlog.length;
    if (progressCount) progressCount.textContent = tasksByStatus.progress.length;
    if (doneCount) doneCount.textContent = tasksByStatus.done.length;

    // Render tasks in each column
    Object.entries(tasksByStatus).forEach(([status, statusTasks]) => {
      const container = status === 'backlog' ? backlogTasks :
                      status === 'progress' ? progressTasks : doneTasks;

      if (statusTasks.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-gray-400 dark:text-zinc-500 text-xs text-center py-4 border border-dashed border-gray-200 dark:border-zinc-700 rounded';
        emptyDiv.textContent = status === 'backlog' ? 'Nenhuma tarefa' :
                              status === 'progress' ? 'Nada em andamento' :
                              'Nada concluído';
        container.appendChild(emptyDiv);
        return;
      }

      statusTasks.forEach(task => {
        const taskCard = this.createTaskCard(task);
        container.appendChild(taskCard);
      });
    });
  }

  formatTimeInput(hours, minutes) {
    const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
    if (totalMinutes < 60) {
      return `${totalMinutes}min`;
    }
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer';
    card.setAttribute('data-task-id', task.id);
    card.draggable = true;

    const workedTime = task.timer?.totalWorkedTime || 0;
    const estimatedTime = task.estimatedTime || 0;
    const progress = estimatedTime > 0 ? Math.min((workedTime / estimatedTime) * 100, 100) : 0;
    const isRunning = task.timer?.isRunning || false;
    const pausedTime = task.timer?.pausedTime || 0;

    // Card header (always visible)
    const headerHTML = `
      <div class="flex items-start justify-between mb-2">
        <h4 class="font-medium text-gray-900 dark:text-zinc-100 text-sm leading-tight flex-1 pr-2 ${task.status === 'done' ? 'line-through text-gray-500 dark:text-zinc-400' : ''}">${task.title}</h4>
        <div class="flex items-center gap-1 flex-shrink-0">
          <button class="timer-quick-btn p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                  data-action="toggle-timer" data-task-id="${task.id}" title="${isRunning ? 'Pausar' : 'Iniciar'} Timer">
            ${isRunning ? Icons.get('pause', 'w-3 h-3 text-red-500') : Icons.get('play', 'w-3 h-3 text-green-500')}
          </button>
          ${task.status !== 'done' ? `
            <button class="edit-task-btn p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                    data-action="edit-task" data-task-id="${task.id}" title="Editar">
              ${Icons.get('edit', 'w-3 h-3 text-gray-500 dark:text-zinc-400')}
            </button>
            <button class="delete-task-btn p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                    data-action="delete-task" data-task-id="${task.id}" title="Excluir">
              ${Icons.get('trash', 'w-3 h-3 text-red-500')}
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Time summary (always visible)
    const timeSummaryHTML = `
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 mb-2">
        <div class="flex items-center gap-2">
          ${Icons.get('clock', 'w-3 h-3')}
          <span>${this.formatTime(workedTime)} / ${this.formatTime(estimatedTime)}</span>
          ${pausedTime > 0 ? `<span class="text-orange-500">⏸ ${this.formatTime(pausedTime)}</span>` : ''}
        </div>
        <button class="expand-btn p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                data-action="toggle-expansion" data-task-id="${task.id}">
          ${task.isExpanded ? Icons.get('chevronUp', 'w-3 h-3') : Icons.get('chevronDown', 'w-3 h-3')}
        </button>
      </div>
    `;

    // Progress bar (always visible)
    const progressHTML = `
      <div class="mb-2">
        <div class="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5">
          <div class="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
        </div>
        ${progress > 100 ? `<div class="text-xs text-orange-500 mt-1">⚠️ ${this.formatTime(workedTime - estimatedTime)} excedido</div>` : ''}
      </div>
    `;

    // Expanded content (only when expanded)
    const expandedHTML = task.isExpanded ? `
      <div class="expanded-content border-t border-gray-200 dark:border-zinc-700 pt-3 mt-2">
        ${task.description ? `<p class="text-gray-600 dark:text-zinc-400 text-xs mb-3 leading-relaxed">${task.description}</p>` : ''}

        <!-- Timer Controls -->
        ${task.status !== 'done' ? `
          <div class="flex items-center gap-2 mb-3">
            <button class="timer-btn flex-1 ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    data-action="toggle-timer" data-task-id="${task.id}">
              ${isRunning ? Icons.get('pause', 'w-3 h-3') : Icons.get('play', 'w-3 h-3')}
              ${isRunning ? 'Pausar' : 'Iniciar'}
            </button>
            ${workedTime > 0 ? `
              <button class="timer-btn bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                      data-action="reset-timer" data-task-id="${task.id}">
                ${Icons.get('reset', 'w-3 h-3')}
                Reset
              </button>
            ` : ''}
            <button class="timer-btn bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                    data-action="manual-time" data-task-id="${task.id}">
              ${Icons.get('plus', 'w-3 h-3')}
              Tempo
            </button>
          </div>
        ` : ''}

        <!-- Status Controls -->
        <div class="flex items-center gap-1">
          ${task.status === 'backlog' ? `
            <button class="status-btn bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex-1 flex items-center justify-center gap-1"
                    data-action="update-status" data-task-id="${task.id}" data-status="progress">
              ${Icons.get('arrowRight', 'w-3 h-3')}
              Iniciar
            </button>
          ` : ''}
          ${task.status === 'progress' ? `
            <button class="status-btn bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                    data-action="update-status" data-task-id="${task.id}" data-status="backlog">
              ${Icons.get('arrowLeft', 'w-3 h-3')}
              Backlog
            </button>
            <button class="status-btn bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                    data-action="update-status" data-task-id="${task.id}" data-status="done">
              ${Icons.get('checkCircle', 'w-3 h-3')}
              Concluir
            </button>
          ` : ''}
          ${task.status === 'done' ? `
            <button class="status-btn bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex-1 flex items-center justify-center gap-1"
                    data-action="update-status" data-task-id="${task.id}" data-status="progress">
              ${Icons.get('reset', 'w-3 h-3')}
              Reabrir
            </button>
          ` : ''}
        </div>

        ${isRunning ? `
          <div class="mt-2 text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Timer ativo
          </div>
        ` : ''}
      </div>
    ` : '';

    card.innerHTML = headerHTML + timeSummaryHTML + progressHTML + expandedHTML;

    // Add drag event listeners
    card.addEventListener('dragstart', (e) => {
      this.draggedTask = task;
      card.classList.add('opacity-50');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('opacity-50');
    });

    // Add click event listeners for all action buttons
    card.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;

      e.preventDefault();
      e.stopPropagation();

      const action = button.dataset.action;
      const taskId = button.dataset.taskId;

      switch (action) {
        case 'toggle-timer':
          this.toggleTimer(taskId);
          break;
        case 'edit-task':
          this.editTask(taskId);
          break;
        case 'delete-task':
          this.deleteTask(taskId);
          break;
        case 'toggle-expansion':
          this.toggleTaskExpansion(taskId);
          break;
        case 'reset-timer':
          this.resetTimer(taskId);
          break;
        case 'manual-time':
          this.showManualTimeModal(taskId);
          break;
        case 'update-status':
          const newStatus = button.dataset.status;
          this.updateTaskStatus(taskId, newStatus);
          break;
        default:
          console.warn('Unknown action:', action);
      }
    });

    return card;
  }

  toggleTaskExpansion(taskId) {
    if (!this.currentNoteId) return;

    const tasks = window.storageAPI.getNoteTasks(this.currentNoteId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.isExpanded = !task.isExpanded;
    window.storageAPI.updateNoteTask(this.currentNoteId, taskId, { isExpanded: task.isExpanded });
    this.loadNoteTasks();
  }

  editTask(taskId) {
    if (!this.currentNoteId) return;

    const tasks = window.storageAPI.getNoteTasks(this.currentNoteId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    this.editingTaskId = taskId;

    // Populate form with task data
    const titleInput = document.querySelector('#note-task-title');
    const descInput = document.querySelector('#note-task-description');
    const hoursInput = document.querySelector('#note-task-hours');
    const minutesInput = document.querySelector('#note-task-minutes');

    if (titleInput) titleInput.value = task.title;
    if (descInput) descInput.value = task.description || '';

    const totalMinutes = Math.floor((task.estimatedTime || 0) / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hoursInput) hoursInput.value = hours;
    if (minutesInput) minutesInput.value = minutes;

    this.showTaskForm();
    this.validateTaskForm();
  }

  deleteTask(taskId) {
    if (!this.currentNoteId) return;

    if (!confirm('Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.')) {
      return;
    }

    // Clear timer if running
    if (this.activeTimers.has(taskId)) {
      clearInterval(this.activeTimers.get(taskId));
      this.activeTimers.delete(taskId);
    }

    window.storageAPI.deleteNoteTask(this.currentNoteId, taskId);
    this.loadNoteTasks();
    this.showNotification('Tarefa excluída');
  }

  toggleTimer(taskId) {
    if (!this.currentNoteId) return;

    const tasks = window.storageAPI.getNoteTasks(this.currentNoteId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isCurrentlyRunning = task.timer?.isRunning || false;

    if (isCurrentlyRunning) {
      this.pauseTimer(taskId);
    } else {
      // Pause all other timers first
      this.pauseAllTimers();
      this.startTimer(taskId);
    }
  }

  startTimer(taskId) {
    if (!this.currentNoteId) return;

    const now = Date.now();

    // Update task in storage
    const timerData = {
      isRunning: true,
      currentSessionStart: now,
      lastUpdate: now
    };

    window.storageAPI.updateNoteTaskTimer(this.currentNoteId, taskId, timerData);

    // Start local timer
    const interval = setInterval(() => {
      this.updateTimerDisplay(taskId);
    }, 1000);

    this.activeTimers.set(taskId, interval);

    // Auto-move to progress if in backlog
    const tasks = window.storageAPI.getNoteTasks(this.currentNoteId);
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status === 'backlog') {
      this.updateTaskStatus(taskId, 'progress');
    }

    this.loadNoteTasks();
    this.showNotification('Timer iniciado!');
  }

  pauseTimer(taskId) {
    if (!this.currentNoteId) return;

    // Clear local timer
    if (this.activeTimers.has(taskId)) {
      clearInterval(this.activeTimers.get(taskId));
      this.activeTimers.delete(taskId);
    }

    // Calculate worked time for this session
    const tasks = window.storageAPI.getNoteTasks(this.currentNoteId);
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.timer?.currentSessionStart) return;

    const sessionTime = Math.floor((Date.now() - task.timer.currentSessionStart) / 1000);
    const newWorkedTime = (task.timer.workedTime || 0) + sessionTime;
    const newTotalWorkedTime = (task.timer.totalWorkedTime || 0) + sessionTime;

    const timerData = {
      isRunning: false,
      currentSessionStart: null,
      workedTime: newWorkedTime,
      totalWorkedTime: newTotalWorkedTime,
      lastUpdate: Date.now()
    };

    window.storageAPI.updateNoteTaskTimer(this.currentNoteId, taskId, timerData);
    this.loadNoteTasks();
    this.showNotification('Timer pausado!');
  }

  pauseAllTimers() {
    if (!this.currentNoteId) return;

    const tasks = window.storageAPI.getNoteTasks(this.currentNoteId);
    tasks.forEach(task => {
      if (task.timer?.isRunning) {
        this.pauseTimer(task.id);
      }
    });
  }























  hideTaskDetailsModal() {
    this.taskDetailsModal.classList.add("hidden");
  }











  // Enhanced time formatting with better precision
  formatTime(seconds) {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      if (remainingSeconds > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
      }
      return `${hours}h ${minutes}m`;
    }

    if (remainingSeconds > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${minutes}m`;
  }



  handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'n':
          e.preventDefault();
          if (this.currentNoteId) {
            this.showTaskForm();
          }
          break;
      }
    }

    // ESC to close modals and forms
    if (e.key === 'Escape') {
      const taskForm = document.querySelector('#note-task-form');
      const manualTimeModal = document.querySelector("#manual-time-modal");
      const taskDetailsModal = document.querySelector("#task-details-modal");
      const helpModal = document.querySelector("#help-modal");

      if (taskForm && !taskForm.classList.contains('hidden')) {
        this.hideTaskForm();
      } else if (manualTimeModal && !manualTimeModal.classList.contains('hidden')) {
        this.hideManualTimeModal();
      } else if (taskDetailsModal && !taskDetailsModal.classList.contains('hidden')) {
        this.hideTaskDetailsModal();
      } else if (helpModal && !helpModal.classList.contains('hidden')) {
        this.hideHelpModal();
      }
    }
  }

  showTaskDetails(taskId) {
    if (!this.currentNoteId) return;

    const tasks = window.storageAPI.getNoteTasks(this.currentNoteId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const content = document.querySelector("#task-details-content");
    const taskDetailsModal = document.querySelector("#task-details-modal");
    if (!content || !taskDetailsModal) return;

    const workedTime = task.timer?.totalWorkedTime || 0;
    const estimatedTime = task.estimatedTime || 0;
    const manualEntries = task.manualTimeEntries || [];
    const created = new Date(task.created).toLocaleString('pt-BR');
    const updated = new Date(task.updated).toLocaleString('pt-BR');

    content.innerHTML = `
      <div class="space-y-4">
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-zinc-100 mb-2">${task.title}</h4>
          ${task.description ? `<p class="text-gray-600 dark:text-zinc-400 text-sm">${task.description}</p>` : ''}
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-700 dark:text-zinc-300">Status:</span>
            <span class="ml-2 px-2 py-1 rounded text-xs ${
              task.status === 'progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
              task.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }">
              ${task.status === 'progress' ? 'Em Progresso' : task.status === 'done' ? 'Concluído' : 'Backlog'}
            </span>
          </div>
          <div>
            <span class="font-medium text-gray-700 dark:text-zinc-300">Criada em:</span>
            <span class="ml-2 text-gray-600 dark:text-zinc-400">${created}</span>
          </div>
        </div>

        <div class="border-t border-gray-200 dark:border-zinc-700 pt-4">
          <h5 class="font-medium text-gray-900 dark:text-zinc-100 mb-3">Controle de Tempo</h5>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-700 dark:text-zinc-300">Tempo Estimado:</span>
              <div class="text-gray-600 dark:text-zinc-400">${this.formatTime(estimatedTime)}</div>
            </div>
            <div>
              <span class="font-medium text-gray-700 dark:text-zinc-300">Tempo Trabalhado:</span>
              <div class="text-gray-600 dark:text-zinc-400">${this.formatTime(workedTime)}</div>
            </div>
          </div>

          ${workedTime > 0 ? `
            <div class="mt-3">
              <div class="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                <div class="bg-blue-500 h-2 rounded-full" style="width: ${Math.min((workedTime / estimatedTime) * 100, 100)}%"></div>
              </div>
              <div class="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                ${estimatedTime > 0 ? `${Math.round((workedTime / estimatedTime) * 100)}% concluído` : 'Sem estimativa'}
              </div>
            </div>
          ` : ''}
        </div>

        ${manualEntries.length > 0 ? `
          <div class="border-t border-gray-200 dark:border-zinc-700 pt-4">
            <h5 class="font-medium text-gray-900 dark:text-zinc-100 mb-3">Histórico de Tempo Manual</h5>
            <div class="space-y-2 max-h-32 overflow-y-auto">
              ${manualEntries.map(entry => `
                <div class="flex justify-between items-center text-sm bg-gray-50 dark:bg-zinc-800 p-2 rounded">
                  <span class="text-gray-600 dark:text-zinc-400">${entry.description}</span>
                  <span class="font-medium text-gray-900 dark:text-zinc-100">${this.formatTimeInput(Math.floor(entry.minutes / 60), entry.minutes % 60)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="border-t border-gray-200 dark:border-zinc-700 pt-4 text-xs text-gray-500 dark:text-zinc-400">
          Última atualização: ${updated}
        </div>
      </div>
    `;

    taskDetailsModal.classList.remove("hidden");
  }

  hideTaskDetailsModal() {
    const taskDetailsModal = document.querySelector("#task-details-modal");
    if (taskDetailsModal) {
      taskDetailsModal.classList.add("hidden");
    }
  }

  showHelpModal() {
    const helpModal = document.querySelector("#help-modal");
    if (helpModal) {
      helpModal.classList.remove("hidden");
    }
  }

  hideHelpModal() {
    const helpModal = document.querySelector("#help-modal");
    if (helpModal) {
      helpModal.classList.add("hidden");
    }
  }

  persistTimerStates() {
    const timerStates = {};
    this.activeTimers.forEach((interval, taskId) => {
      if (this.currentNoteId) {
        const tasks = window.storageAPI.getNoteTasks(this.currentNoteId);
        const task = tasks.find(t => t.id === taskId);
        if (task && task.timer?.isRunning) {
          timerStates[taskId] = {
            noteId: this.currentNoteId,
            isRunning: true,
            startTime: task.timer.currentSessionStart,
            workedTime: task.timer.workedTime || 0
          };
        }
      }
    });

    localStorage.setItem('deepnote-timer-states', JSON.stringify(timerStates));
  }

  restoreTimerStates() {
    try {
      const savedStates = localStorage.getItem('deepnote-timer-states');
      if (!savedStates) return;

      const timerStates = JSON.parse(savedStates);
      const now = Date.now();

      Object.entries(timerStates).forEach(([taskId, state]) => {
        if (state.isRunning && state.startTime && state.noteId) {
          // Calculate elapsed time since last save
          const elapsedSinceStart = Math.floor((now - state.startTime) / 1000);
          const totalWorkedTime = state.workedTime + elapsedSinceStart;

          // Update task with accumulated time
          window.storageAPI.updateNoteTaskTimer(state.noteId, taskId, {
            isRunning: true,
            currentSessionStart: now, // Reset start time to now
            workedTime: totalWorkedTime,
            totalWorkedTime: totalWorkedTime,
            lastUpdate: now
          });

          // Restart the timer if this note is currently active
          if (this.currentNoteId === state.noteId) {
            const interval = setInterval(() => {
              this.updateTimerDisplay(taskId);
            }, 1000);

            this.activeTimers.set(taskId, interval);
          }
        }
      });

      // Clear saved states
      localStorage.removeItem('deepnote-timer-states');

      if (Object.keys(timerStates).length > 0) {
        this.showNotification('Timers restaurados da sessão anterior');
      }
    } catch (error) {
      console.error('Error restoring timer states:', error);
    }
  }

  showNotification(message, type = 'success') {
    const wrapper = document.createElement("div");
    wrapper.className = "pointer-events-none fixed top-20 right-6 z-50";

    const toast = document.createElement("div");
    const bgColor = type === 'error' ? 'bg-red-500 dark:bg-red-600' : 'bg-green-500 dark:bg-green-600';
    toast.className = `${bgColor} text-white px-4 py-3 rounded-md text-sm font-medium shadow-lg flex items-center gap-2 opacity-0 translate-y-2 transition-all duration-200`;

    const icon = type === 'error' ? Icons.get('info', 'w-4 h-4') : Icons.get('checkCircle', 'w-4 h-4');
    toast.innerHTML = `${icon}${message}`;

    wrapper.appendChild(toast);
    document.body.appendChild(wrapper);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove("opacity-0", "translate-y-2");
    });

    // Remove after delay
    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => wrapper.remove(), 400);
    }, 3000);
  }

  // Cleanup method for when switching views
  cleanup() {
    // Persist timer states before cleanup
    this.persistTimerStates();

    // Clear all active timers
    this.activeTimers.forEach(interval => clearInterval(interval));
    this.activeTimers.clear();
  }
}

// Initialize task manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.taskManager = new TaskManager();
});
