let currentNoteId = null;
let timerInterval;
let seconds = 25 * 60;

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

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function renderNotes() {
  const notes = window.storageAPI.getNotes();
  notesList.innerHTML = "";

  if (notes.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "text-zinc-500 text-sm p-2";
    emptyDiv.textContent = "Nenhuma nota criada";
    notesList.appendChild(emptyDiv);
    return;
  }

  notes.sort((a, b) => (b.updated || b.created) - (a.updated || a.created));

  notes.forEach(note => {
    const div = document.createElement("div");
    div.className = `cursor-pointer hover:bg-zinc-800 p-2 rounded text-sm ${currentNoteId === note.id ? 'bg-zinc-800' : ''}`;

    const titleSpan = document.createElement("span");
    const displayTitle = note.title || (note.content ? note.content.slice(0, 30) : "Nota sem título");
    titleSpan.textContent = displayTitle;
    titleSpan.className = "truncate block";

    div.appendChild(titleSpan);
    div.onclick = () => loadNote(note.id);
    notesList.appendChild(div);
  });
}

function loadNote(noteId) {
  const notes = window.storageAPI.getNotes();
  const note = notes.find(n => n.id === noteId);

  if (note) {
    currentNoteId = noteId;
    noteTitle.value = note.title || "";
    noteContent.value = note.content || "";
    showEditor();
    renderNotes();
  }
}

function createNewNote() {
  currentNoteId = null;
  noteTitle.value = "";
  noteContent.value = "";
  showEditor();
  noteTitle.focus();
}

function saveNote() {
  const title = noteTitle.value.trim();
  const content = noteContent.value.trim();
  if (!title && !content) {
    return;
  }

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

  renderNotes();
  showSaveIndicator();
}

function showSaveIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "fixed top-4 right-4 bg-green-600 text-white px-3 py-1 rounded text-sm";
  indicator.textContent = "Nota salva";
  document.body.appendChild(indicator);

  setTimeout(() => {
    indicator.remove();
  }, 2000);
}

function deleteNote() {
  if (currentNoteId && confirm("Tem certeza que deseja deletar esta nota?")) {
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
}

function hideEditor() {
  noteHeader.classList.add("hidden");
  noteContent.classList.add("hidden");
  welcomeMessage.classList.remove("hidden");
}

function updateTimer() {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `Pomodoro: ${m}:${s}`;
  if (seconds > 0) {
    seconds--;
  } else {
    clearInterval(timerInterval);
    timerDisplay.textContent = "Pomodoro: 00:00";
  }
}

function startTimer() {
  clearInterval(timerInterval);
  seconds = 25 * 60;
  timerInterval = setInterval(updateTimer, 1000);
}

newNoteBtn.onclick = createNewNote;
saveNoteBtn.onclick = saveNote;
deleteNoteBtn.onclick = deleteNote;
startTimerBtn.onclick = startTimer;

let saveTimeout;

function autoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    if (currentNoteId || noteTitle.value.trim() || noteContent.value.trim()) {
      saveNote();
    }
  }, 1000);
}

noteContent.addEventListener("input", autoSave);
noteTitle.addEventListener("input", autoSave);

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

renderNotes();
