const { contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");

const getStoragePath = () => {
  const userDataPath = path.join(os.homedir(), '.config', 'deepnote');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return path.join(userDataPath, 'deepnote-notes.json');
};

const readData = () => {
  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      return {
        notes: parsed.notes || [],
        trash: parsed.trash || []
      };
    }
    return { notes: [], trash: [] };
  } catch (error) {
    console.error('Error reading data:', error);
    return { notes: [], trash: [] };
  }
};

const writeData = (data) => {
  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data:', error);
  }
};

contextBridge.exposeInMainWorld("storageAPI", {
  getNotes: () => {
    const data = readData();
    return data.notes;
  },
  getTrash: () => {
    const data = readData();
    return data.trash;
  },
  saveNote: (note) => {
    const data = readData();
    data.notes.push(note);
    writeData(data);
  },
  updateNote: (id, updatedNote) => {
    const data = readData();
    const index = data.notes.findIndex(n => n.id === id);
    if (index !== -1) {
      data.notes[index] = { ...data.notes[index], ...updatedNote };
      writeData(data);
    }
  },

  // Initialize note with tasks array if it doesn't exist
  initializeNoteTasks: (noteId) => {
    const data = readData();
    const note = data.notes.find(n => n.id === noteId);
    if (note && !note.tasks) {
      note.tasks = [];
      writeData(data);
    }
  },
  deleteNote: (id) => {
    const data = readData();
    const noteIndex = data.notes.findIndex(n => n.id === id);
    if (noteIndex !== -1) {
      const note = data.notes[noteIndex];

      // Clear any active timers for tasks in this note
      if (note.tasks && note.tasks.length > 0) {
        // Notify TaskManager to clean up timers for this note
        if (typeof window !== 'undefined' && window.taskManager) {
          window.taskManager.cleanupNoteTimers(id);
        }
      }

      note.deletedAt = Date.now();
      data.trash.push(note);
      data.notes.splice(noteIndex, 1);
      writeData(data);
    }
  },
  restoreNote: (id) => {
    const data = readData();
    const trashIndex = data.trash.findIndex(n => n.id === id);
    if (trashIndex !== -1) {
      const note = data.trash[trashIndex];
      delete note.deletedAt;
      data.notes.push(note);
      data.trash.splice(trashIndex, 1);
      writeData(data);
    }
  },
  permanentlyDeleteNote: (id) => {
    const data = readData();
    data.trash = data.trash.filter(n => n.id !== id);
    writeData(data);
  },
  emptyTrash: () => {
    const data = readData();
    data.trash = [];
    writeData(data);
  },

  // Task Management Functions (within notes)
  getNoteTasks: (noteId) => {
    const data = readData();
    const note = data.notes.find(n => n.id === noteId);
    return note?.tasks || [];
  },

  saveNoteTask: (noteId, task) => {
    const data = readData();
    const note = data.notes.find(n => n.id === noteId);
    if (note) {
      if (!note.tasks) note.tasks = [];
      note.tasks.push(task);
      writeData(data);
    }
  },

  updateNoteTask: (noteId, taskId, updatedTask) => {
    const data = readData();
    const note = data.notes.find(n => n.id === noteId);
    if (note && note.tasks) {
      const taskIndex = note.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        note.tasks[taskIndex] = { ...note.tasks[taskIndex], ...updatedTask };
        writeData(data);
      }
    }
  },

  deleteNoteTask: (noteId, taskId) => {
    const data = readData();
    const note = data.notes.find(n => n.id === noteId);
    if (note && note.tasks) {
      note.tasks = note.tasks.filter(t => t.id !== taskId);
      writeData(data);
    }
  },

  // Timer state persistence for tasks within notes
  updateNoteTaskTimer: (noteId, taskId, timerData) => {
    const data = readData();
    const note = data.notes.find(n => n.id === noteId);
    if (note && note.tasks) {
      const task = note.tasks.find(t => t.id === taskId);
      if (task) {
        task.timer = { ...task.timer, ...timerData };
        writeData(data);
      }
    }
  },

  // Add manual time to task within note
  addNoteTaskManualTime: (noteId, taskId, timeEntry) => {
    const data = readData();
    const note = data.notes.find(n => n.id === noteId);
    if (note && note.tasks) {
      const task = note.tasks.find(t => t.id === taskId);
      if (task) {
        if (!task.manualTimeEntries) {
          task.manualTimeEntries = [];
        }
        task.manualTimeEntries.push(timeEntry);

        // Update total worked time
        const totalManualTime = task.manualTimeEntries.reduce((sum, entry) => sum + entry.minutes, 0);
        const timerWorkedTime = task.timer?.workedTime || 0;
        task.timer = {
          ...task.timer,
          totalWorkedTime: timerWorkedTime + (totalManualTime * 60) // Convert to seconds
        };

        writeData(data);
      }
    }
  }
});
