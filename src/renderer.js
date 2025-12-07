let currentNoteId = null;
let timerInterval;
let seconds = 25 * 60;
let totalSeconds = 25 * 60;
let isTimerRunning = false;
let isBreakTime = false;
let isTrashView = false;
let isDarkMode = false;
let isAutoSaveEnabled = true;
let saveTimeout;
let lastSavedContent = '';
let lastSavedTitle = '';

const notesList = document.querySelector("#notes-list");
const noteContent = document.querySelector("#note-content");
const noteTitle = document.querySelector("#note-title");
const noteHeader = document.querySelector("#note-header");
const newNoteBtn = document.querySelector("#new-note-btn");
const saveNoteBtn = document.querySelector("#save-note-btn");
const deleteNoteBtn = document.querySelector("#delete-note-btn");
const timerDisplay = document.querySelector("#timer-display");
const startTimerBtn = document.querySelector("#start-timer");
const welcomeMessage = document.querySelector("#welcome-message");
const trashBtn = document.querySelector("#trash-btn");
const timerProgress = document.querySelector("#timer-progress");
const timerFill = document.querySelector("#timer-fill");
const themeToggle = document.querySelector("#theme-toggle");
const themeToggleDarkIcon = document.querySelector("#theme-toggle-dark-icon");
const themeToggleLightIcon = document.querySelector("#theme-toggle-light-icon");
const autoSaveToggle = document.querySelector("#auto-save-toggle");
const autoSaveCheckbox = document.querySelector("#auto-save-checkbox");
const toggleBg = document.querySelector("#toggle-bg");
const toggleSlider = document.querySelector("#toggle-slider");
const saveStatus = document.querySelector("#save-status");
const saveStatusIcon = document.querySelector("#save-status-icon");
const saveStatusText = document.querySelector("#save-status-text");
const noteOptionsBtn = document.querySelector("#note-options-btn");
const noteOptionsMenu = document.querySelector("#note-options-menu");

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Funções de gerenciamento de tema
function initTheme() {
  // Verificar preferência salva ou preferência do sistema
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  isDarkMode = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

  updateTheme();
  updateThemeIcons();
}

function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  updateTheme();
  updateThemeIcons();
}

function updateTheme() {
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function updateThemeIcons() {
  if (isDarkMode) {
    themeToggleDarkIcon.classList.add('hidden');
    themeToggleLightIcon.classList.remove('hidden');
  } else {
    themeToggleDarkIcon.classList.remove('hidden');
    themeToggleLightIcon.classList.add('hidden');
  }
}

// Funções de gerenciamento do auto-save
function toggleAutoSave() {
  isAutoSaveEnabled = !isAutoSaveEnabled;
  localStorage.setItem('autoSaveEnabled', isAutoSaveEnabled.toString());
  updateAutoSaveUI();

  if (isAutoSaveEnabled) {
    showNotification('Auto-save ativado');
    updateSaveStatus('auto');
  } else {
    showNotification('Auto-save desativado');
    updateSaveStatus('manual');
  }
}

function updateAutoSaveUI() {
  if (isAutoSaveEnabled) {
    // Estado ativo - azul com slider à direita
    toggleBg.className = 'w-8 h-4 bg-blue-500 rounded-full shadow-inner transition-colors duration-200';
    toggleSlider.className = 'absolute left-0 top-0 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 translate-x-4';
    autoSaveCheckbox.checked = true;
  } else {
    // Estado inativo - cinza com slider à esquerda
    toggleBg.className = 'w-8 h-4 bg-gray-300 dark:bg-zinc-600 rounded-full shadow-inner transition-colors duration-200';
    toggleSlider.className = 'absolute left-0 top-0 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 translate-x-0';
    autoSaveCheckbox.checked = false;
  }
}

function updateSaveStatus(status, message = '') {
  const statusMap = {
    'saved': { text: 'Salvo', icon: true, color: 'text-green-500' },
    'saving': { text: 'Salvando...', icon: false, color: 'text-blue-500' },
    'auto': { text: 'Auto-save ativo', icon: true, color: 'text-green-500' },
    'manual': { text: 'Modo manual', icon: false, color: 'text-gray-500 dark:text-zinc-400' },
    'draft': { text: 'Rascunho', icon: false, color: 'text-orange-500' },
    'error': { text: message || 'Erro ao salvar', icon: false, color: 'text-red-500' }
  };

  const config = statusMap[status] || statusMap['draft'];

  saveStatusText.textContent = config.text;
  saveStatusText.className = `text-sm font-medium ${config.color}`;

  if (config.icon) {
    saveStatusIcon.classList.remove('hidden');
    saveStatusIcon.className = `w-4 h-4 ${config.color}`;
  } else {
    saveStatusIcon.classList.add('hidden');
  }
}

function hasUnsavedChanges() {
  const currentTitle = noteTitle.value.trim();
  const currentContent = noteContent.value.trim();
  return currentTitle !== lastSavedTitle || currentContent !== lastSavedContent;
}

function renderNotes() {
  if (!window.storageAPI) {
    console.error('StorageAPI not available');
    return;
  }

  const items = isTrashView ? window.storageAPI.getTrash() : window.storageAPI.getNotes();
  notesList.innerHTML = "";

  // Atualizar título da seção
  const sectionTitle = document.querySelector('.notes-section-title');
  if (sectionTitle) {
    sectionTitle.textContent = isTrashView ? 'Lixeira' : 'Suas Notas';
  }

  if (items.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "text-gray-500 dark:text-zinc-500 text-sm p-3 text-center bg-gray-50 dark:bg-zinc-800 rounded-md border border-gray-200 dark:border-zinc-700";
    emptyDiv.textContent = isTrashView ? "Lixeira vazia" : "Nenhuma nota criada";
    notesList.appendChild(emptyDiv);
    return;
  }

  items.sort((a, b) => (b.updated || b.created) - (a.updated || a.created));

  items.forEach(item => {
    const div = document.createElement("div");
    const isSelected = currentNoteId === item.id && !isTrashView;
    div.className = `cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 p-3 rounded-md text-sm border transition-colors ${
      isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
    }`;

    const titleSpan = document.createElement("span");
    const displayTitle = item.title || (item.content ? item.content.slice(0, 30) : "Nota sem título");
    titleSpan.textContent = displayTitle;
    titleSpan.className = `truncate block font-medium ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-zinc-100'}`;

    const dateSpan = document.createElement("span");
    const date = new Date(isTrashView ? item.deletedAt : (item.updated || item.created));
    const datePrefix = isTrashView ? 'Excluída em: ' : '';
    dateSpan.textContent = datePrefix + date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    dateSpan.className = `text-xs ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-zinc-400'} mt-1 block`;

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "flex gap-2 mt-2";

    if (isTrashView) {
      const restoreBtn = document.createElement("button");
      restoreBtn.className = "text-xs bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-1 rounded";
      restoreBtn.textContent = "Restaurar";
      restoreBtn.onclick = (e) => {
        e.stopPropagation();
        restoreNote(item.id);
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "text-xs bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 px-2 py-1 rounded";
      deleteBtn.textContent = "Excluir";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        permanentlyDeleteNote(item.id);
      };

      actionsDiv.appendChild(restoreBtn);
      actionsDiv.appendChild(deleteBtn);
    } else {
      div.onclick = () => loadNote(item.id);
    }

    div.appendChild(titleSpan);
    div.appendChild(dateSpan);
    if (isTrashView) {
      div.appendChild(actionsDiv);
    }
    notesList.appendChild(div);
  });
}

function loadNote(noteId) {
  if (!window.storageAPI) {
    console.error('StorageAPI not available');
    return;
  }

  const notes = window.storageAPI.getNotes();
  const note = notes.find(n => n.id === noteId);

  if (note) {
    currentNoteId = noteId;
    noteTitle.value = note.title || "";
    noteContent.value = note.content || "";
    lastSavedTitle = note.title || "";
    lastSavedContent = note.content || "";
    showEditor();
    renderNotes();
    updateSaveStatus(isAutoSaveEnabled ? 'auto' : 'manual');

    // Initialize tasks for this note
    if (window.taskManager) {
      window.taskManager.initializeTasksForNote(noteId);
    }
  }
}

function createNewNote() {
  currentNoteId = null;
  noteTitle.value = "";
  noteContent.value = "";
  lastSavedTitle = "";
  lastSavedContent = "";
  showEditor();
  noteTitle.focus();
  updateSaveStatus('draft');

  // Clear tasks section when creating new note
  const tasksSection = document.querySelector("#note-tasks-section");
  if (tasksSection) {
    tasksSection.remove();
  }
}

function saveNote(isAutoSave = false) {
  if (!window.storageAPI) {
    console.error('StorageAPI not available');
    updateSaveStatus('error', 'Sistema indisponível');
    return;
  }

  const title = noteTitle.value.trim();
  const content = noteContent.value.trim();

  if (!title && !content) {
    updateSaveStatus('draft');
    return;
  }

  // Mostrar estado de salvamento
  if (!isAutoSave) {
    updateSaveStatus('saving');
    // Adicionar efeito visual no botão
    const saveBtn = document.querySelector('#save-note-btn');
    saveBtn.classList.add('opacity-75', 'cursor-not-allowed');
    saveBtn.disabled = true;
  }

  try {
    if (currentNoteId) {
      window.storageAPI.updateNote(currentNoteId, {
        title: title,
        content: content,
        updated: Date.now()
      });
    } else {
      const newNote = {
        id: generateId(),
        title: title,
        content: content,
        created: Date.now(),
        updated: Date.now()
      };
      window.storageAPI.saveNote(newNote);
      currentNoteId = newNote.id;
    }

    // Atualizar conteúdo salvo
    lastSavedTitle = title;
    lastSavedContent = content;

    renderNotes();

    // Feedback visual
    if (isAutoSave) {
      updateSaveStatus('saved');
      setTimeout(() => {
        if (isAutoSaveEnabled) {
          updateSaveStatus('auto');
        }
      }, 2000);
    } else {
      updateSaveStatus('saved');
      showSaveIndicator();

      // Restaurar botão
      setTimeout(() => {
        const saveBtn = document.querySelector('#save-note-btn');
        saveBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        saveBtn.disabled = false;

        if (isAutoSaveEnabled) {
          updateSaveStatus('auto');
        }
      }, 1000);
    }
  } catch (error) {
    console.error('Error saving note:', error);
    updateSaveStatus('error');

    // Restaurar botão em caso de erro
    if (!isAutoSave) {
      const saveBtn = document.querySelector('#save-note-btn');
      saveBtn.classList.remove('opacity-75', 'cursor-not-allowed');
      saveBtn.disabled = false;
    }
  }
}

function showSaveIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "fixed top-20 right-6 bg-green-500 dark:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-lg z-20 flex items-center gap-2";
  indicator.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>
    Nota salva automaticamente
  `;
  document.body.appendChild(indicator);

  setTimeout(() => {
    indicator.remove();
  }, 3000);
}

function deleteNote() {
  if (!window.storageAPI) {
    console.error('StorageAPI not available');
    return;
  }

  if (currentNoteId && confirm("Tem certeza que deseja deletar esta nota?")) {
    // Clean up any active timers for tasks in this note
    if (window.taskManager) {
      window.taskManager.cleanupNoteTimers(currentNoteId);
    }

    window.storageAPI.deleteNote(currentNoteId);
    clearEditor();
    renderNotes();
  }
}

function clearEditor() {
  currentNoteId = null;
  noteTitle.value = "";
  noteContent.value = "";
  hideEditor();
}

function showEditor() {
  noteHeader.classList.remove("hidden");
  noteContent.classList.remove("hidden");
  welcomeMessage.classList.add("hidden");

  // Show the collapse button when editor is visible
  const toggleBtn = document.querySelector('#toggle-note-content');
  if (toggleBtn) {
    toggleBtn.classList.remove("hidden");
  }

  // Hide task management if active
  const taskManagement = document.querySelector("#task-management");
  if (taskManagement) {
    taskManagement.classList.add("hidden");
  }

  // Update task manager state
  if (window.taskManager) {
    window.taskManager.isTaskViewActive = false;
  }
}

function hideEditor() {
  noteHeader.classList.add("hidden");
  noteContent.classList.add("hidden");
  welcomeMessage.classList.remove("hidden");

  // Hide the collapse button and collapsed bar when editor is hidden
  const toggleBtn = document.querySelector('#toggle-note-content');
  const collapsedBar = document.querySelector('#note-content-collapsed');
  if (toggleBtn) toggleBtn.classList.add("hidden");
  if (collapsedBar) collapsedBar.style.display = 'none';

  // Reset collapse state
  isNoteFieldCollapsed = false;

  // Also hide task management if active
  if (window.taskManager && window.taskManager.isTaskViewActive) {
    window.taskManager.hideTaskView();
  }
}

function updateTimer() {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${m}:${s}`;

  // Atualizar progresso visual
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;
  updateTimerProgress(progress);

  if (seconds > 0) {
    seconds--;
  } else {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerCompleted();
  }
}

function updateTimerProgress(progress) {
  const circumference = 2 * Math.PI * 14; // raio de 14px
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Criar ou atualizar o círculo SVG de progresso
  if (!document.querySelector('#timer-circle')) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'timer-circle';
    svg.className = 'absolute inset-0 w-8 h-8 transform -rotate-90';
    svg.innerHTML = `
      <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" fill="none"
              class="text-gray-200" />
      <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" fill="none"
              class="${isBreakTime ? 'text-red-500' : 'text-green-500'}"
              stroke-dasharray="${strokeDasharray}"
              stroke-dashoffset="${strokeDashoffset}"
              style="transition: stroke-dashoffset 1s linear" />
    `;
    timerProgress.appendChild(svg);
  } else {
    const circle = document.querySelector('#timer-circle circle:last-child');
    circle.style.strokeDashoffset = strokeDashoffset;
    circle.className = isBreakTime ? 'text-red-500' : 'text-green-500';
  }
}

function startTimer() {
  if (isTimerRunning) {
    // Pausar timer
    clearInterval(timerInterval);
    isTimerRunning = false;
    startTimerBtn.textContent = isBreakTime ? 'Continuar Pausa' : 'Continuar Pomodoro';
    startTimerBtn.className = 'bg-blue-500 hover:bg-blue-600 transition px-4 py-2 rounded-md text-sm text-white font-medium';
  } else {
    // Iniciar/continuar timer
    isTimerRunning = true;
    startTimerBtn.textContent = 'Pausar';
    startTimerBtn.className = 'bg-red-500 hover:bg-red-600 transition px-4 py-2 rounded-md text-sm text-white font-medium';
    timerInterval = setInterval(updateTimer, 1000);
  }
}

function timerCompleted() {
  // Alternar entre foco e pausa
  isBreakTime = !isBreakTime;

  if (isBreakTime) {
    seconds = 5 * 60; // 5 minutos de pausa
    totalSeconds = 5 * 60;
    startTimerBtn.textContent = 'Iniciar Pausa';
    showNotification('Pomodoro concluído! Hora da pausa.');
  } else {
    seconds = 25 * 60; // 25 minutos de foco
    totalSeconds = 25 * 60;
    startTimerBtn.textContent = 'Iniciar Pomodoro';
    showNotification('Pausa concluída! Hora de focar.');
  }

  startTimerBtn.className = 'bg-blue-500 hover:bg-blue-600 transition px-4 py-2 rounded-md text-sm text-white font-medium';
  updateTimerProgress(0);
}

function showNotification(message) {
  const wrapper = document.createElement("div");
  wrapper.className = "pointer-events-none fixed top-20 right-6 z-50";

  const toast = document.createElement("div");
  toast.className =
    "bg-blue-500 dark:bg-blue-600 text-white px-4 py-3 rounded-md text-sm font-medium shadow-lg flex items-center gap-2 opacity-0 translate-y-2 transition-all duration-200";

  toast.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    ${message}
  `;

  wrapper.appendChild(toast);
  document.body.appendChild(wrapper);

  // Animar entrada
  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-y-2");
  });

  // Remover depois
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => wrapper.remove(), 400);
  }, 500);
}



function toggleTrashView() {
  isTrashView = !isTrashView;

  if (isTrashView) {
    trashBtn.className = "w-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition py-2 rounded-md text-red-700 dark:text-red-400 text-sm font-medium flex items-center justify-center gap-2";
    trashBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"></path>
      </svg>
      Voltar às Notas
    `;
    hideEditor();
  } else {
    trashBtn.className = "w-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition py-2 rounded-md text-gray-600 dark:text-zinc-400 text-sm font-medium flex items-center justify-center gap-2";
    trashBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
      </svg>
      Lixeira
    `;
  }

  renderNotes();
}

function restoreNote(id) {
  if (confirm("Deseja restaurar esta nota?")) {
    window.storageAPI.restoreNote(id);
    renderNotes();
    showNotification("Nota restaurada com sucesso!");
  }
}

function permanentlyDeleteNote(id) {
  if (confirm("Esta ação não pode ser desfeita. Deseja excluir permanentemente esta nota?")) {
    window.storageAPI.permanentlyDeleteNote(id);
    renderNotes();
    showNotification("Nota excluída permanentemente.");
  }
}

// Funções do menu de opções
function toggleOptionsMenu() {
  noteOptionsMenu.classList.toggle('hidden');
}

function duplicateNote() {
  if (!currentNoteId) return;

  const title = noteTitle.value.trim();
  const content = noteContent.value.trim();

  const duplicatedNote = {
    id: generateId(),
    title: title ? `${title} (Cópia)` : 'Nota sem título (Cópia)',
    content: content,
    created: Date.now(),
    updated: Date.now()
  };

  window.storageAPI.saveNote(duplicatedNote);
  renderNotes();
  showNotification('Nota duplicada com sucesso!');
  noteOptionsMenu.classList.add('hidden');
}

function exportNote() {
  if (!currentNoteId) return;

  const title = noteTitle.value.trim() || 'nota-sem-titulo';
  const content = noteContent.value.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification('Nota exportada com sucesso!');
  noteOptionsMenu.classList.add('hidden');
}

function showNoteInfo() {
  if (!currentNoteId) return;

  const notes = window.storageAPI.getNotes();
  const note = notes.find(n => n.id === currentNoteId);

  if (note) {
    const created = new Date(note.created).toLocaleString('pt-BR');
    const updated = new Date(note.updated).toLocaleString('pt-BR');
    const wordCount = note.content ? note.content.split(/\s+/).filter(word => word.length > 0).length : 0;
    const charCount = note.content ? note.content.length : 0;

    const info = `
Informações da Nota:

📅 Criada em: ${created}
🔄 Última modificação: ${updated}
📝 Palavras: ${wordCount}
🔤 Caracteres: ${charCount}
    `.trim();

    alert(info);
  }

  noteOptionsMenu.classList.add('hidden');
}

newNoteBtn.onclick = createNewNote;
saveNoteBtn.onclick = () => saveNote(false);
deleteNoteBtn.onclick = deleteNote;
startTimerBtn.onclick = startTimer;
trashBtn.onclick = toggleTrashView;
themeToggle.onclick = toggleTheme;
autoSaveToggle.onclick = toggleAutoSave;
noteOptionsBtn.onclick = toggleOptionsMenu;

function autoSave() {
  if (!isAutoSaveEnabled) {
    updateSaveStatus('manual');
    return;
  }

  clearTimeout(saveTimeout);

  // Verificar se há mudanças
  if (hasUnsavedChanges()) {
    updateSaveStatus('draft');

    saveTimeout = setTimeout(() => {
      if (currentNoteId || noteTitle.value.trim() || noteContent.value.trim()) {
        saveNote(true); // true indica que é auto-save
      }
    }, 2000); // Aumentado para 2 segundos para melhor UX
  }
}

noteContent.addEventListener("input", autoSave);
noteTitle.addEventListener("input", autoSave);

// ===== FUNCIONALIDADE DE EXPANSÃO/COLAPSO DO CAMPO DA NOTA =====

let isNoteFieldCollapsed = false;

function collapseNoteField() {
  const textarea = document.querySelector('#note-content');
  const toggleBtn = document.querySelector('#toggle-note-content');
  const collapsedBar = document.querySelector('#note-content-collapsed');

  if (!textarea || !toggleBtn || !collapsedBar) return;

  // Esconder textarea e botão de colapsar
  textarea.style.display = 'none';
  toggleBtn.style.display = 'none';

  // Mostrar barra colapsada
  collapsedBar.style.display = 'flex';

  isNoteFieldCollapsed = true;
}

function expandNoteField() {
  const textarea = document.querySelector('#note-content');
  const toggleBtn = document.querySelector('#toggle-note-content');
  const collapsedBar = document.querySelector('#note-content-collapsed');

  if (!textarea || !toggleBtn || !collapsedBar) return;

  // Mostrar textarea e botão de colapsar
  textarea.style.display = 'block';
  toggleBtn.style.display = 'block';

  // Esconder barra colapsada
  collapsedBar.style.display = 'none';

  // Focar no textarea
  textarea.focus();

  isNoteFieldCollapsed = false;
}

// Event listeners para os botões de toggle do campo da nota
document.addEventListener('DOMContentLoaded', () => {
  const toggleNoteBtn = document.querySelector('#toggle-note-content');
  const expandNoteBtn = document.querySelector('#expand-note-content');

  if (toggleNoteBtn) {
    toggleNoteBtn.onclick = collapseNoteField;
  }

  if (expandNoteBtn) {
    expandNoteBtn.onclick = expandNoteField;
  }
});

// Event listeners para o menu de opções
document.addEventListener('click', (e) => {
  if (!noteOptionsBtn.contains(e.target) && !noteOptionsMenu.contains(e.target)) {
    noteOptionsMenu.classList.add('hidden');
  }
});

// Event listeners para as opções do menu
noteOptionsMenu.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;

  const text = button.textContent.trim();
  if (text.includes('Duplicar')) {
    duplicateNote();
  } else if (text.includes('Exportar')) {
    exportNote();
  } else if (text.includes('Informações')) {
    showNoteInfo();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "n") {
    e.preventDefault();
    createNewNote();
  }
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    saveNote();
  }
});

// Inicializar aplicação
function initApp() {
  // Inicializar tema
  initTheme();

  // Inicializar auto-save
  const savedAutoSave = localStorage.getItem('autoSaveEnabled');
  if (savedAutoSave !== null) {
    isAutoSaveEnabled = savedAutoSave === 'true';
  }
  updateAutoSaveUI();

  // Inicializar status
  updateSaveStatus('draft');

  if (window.storageAPI) {
    renderNotes();
  } else {
    console.error('StorageAPI not available - check preload script');
    setTimeout(() => {
      if (window.storageAPI) {
        renderNotes();
      } else {
        const errorDiv = document.createElement("div");
        errorDiv.className = "text-red-500 dark:text-red-400 text-sm p-2";
        errorDiv.textContent = "Erro: Sistema de armazenamento não disponível";
        notesList.appendChild(errorDiv);
      }
    }, 100);
  }
}

// Inicializar quando a página carregar
initApp();

// Make taskManager globally available for integration
window.addEventListener('DOMContentLoaded', () => {
  // Wait for taskManager to be initialized
  setTimeout(() => {
    if (window.taskManager) {
      console.log('Task Manager initialized and integrated with DeepNote');
    }
  }, 100);
});
