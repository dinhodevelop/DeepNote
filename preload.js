const { contextBridge } = require("electron");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const os = require("os");

// Cache for data to reduce file system operations
let dataCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 1000; // 1 second cache

// Queue for write operations to prevent conflicts
let writeQueue = Promise.resolve();
let isWriting = false;

const getStoragePath = () => {
  const userDataPath = path.join(os.homedir(), '.config', 'deepnote');
  if (!fsSync.existsSync(userDataPath)) {
    fsSync.mkdirSync(userDataPath, { recursive: true });
  }
  return path.join(userDataPath, 'deepnote-notes.json');
};

const readData = async () => {
  try {
    // Use cache if recent
    const now = Date.now();
    if (dataCache && (now - lastCacheTime) < CACHE_DURATION) {
      return dataCache;
    }

    const filePath = getStoragePath();

    // Check if file exists using sync method for initial check
    if (!fsSync.existsSync(filePath)) {
      dataCache = { notes: [], trash: [] };
      lastCacheTime = now;
      return dataCache;
    }

    const data = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(data);
    dataCache = {
      notes: parsed.notes || [],
      trash: parsed.trash || []
    };
    lastCacheTime = now;
    return dataCache;
  } catch (error) {
    console.error('Error reading data:', error);
    // Return cached data if available, otherwise empty data
    return dataCache || { notes: [], trash: [] };
  }
};

const writeData = async (data) => {
  // Add to write queue to prevent concurrent writes
  writeQueue = writeQueue.then(async () => {
    if (isWriting) {
      console.warn('Write operation already in progress, skipping...');
      return;
    }

    isWriting = true;
    try {
      const filePath = getStoragePath();

      // Create backup before writing
      const backupPath = filePath + '.backup';
      if (fsSync.existsSync(filePath)) {
        await fs.copyFile(filePath, backupPath);
      }

      // Write data atomically
      const tempPath = filePath + '.tmp';
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
      await fs.rename(tempPath, filePath);

      // Update cache
      dataCache = data;
      lastCacheTime = Date.now();

      // Clean up old backup (keep only one)
      if (fsSync.existsSync(backupPath)) {
        setTimeout(() => {
          fsSync.unlink(backupPath, (err) => {
            if (err) console.warn('Could not remove backup file:', err);
          });
        }, 5000); // Remove backup after 5 seconds
      }

    } catch (error) {
      console.error('Error writing data:', error);

      // Try to restore from backup if write failed
      const backupPath = getStoragePath() + '.backup';
      if (fsSync.existsSync(backupPath)) {
        try {
          await fs.copyFile(backupPath, getStoragePath());
          console.log('Restored from backup after write failure');
        } catch (restoreError) {
          console.error('Failed to restore from backup:', restoreError);
        }
      }
      throw error;
    } finally {
      isWriting = false;
    }
  });

  return writeQueue;
};

contextBridge.exposeInMainWorld("storageAPI", {
  getNotes: async () => {
    const data = await readData();
    return data.notes;
  },
  getTrash: async () => {
    const data = await readData();
    return data.trash;
  },
  saveNote: async (note) => {
    const data = await readData();
    data.notes.push(note);
    await writeData(data);
  },
  updateNote: async (id, updatedNote) => {
    const data = await readData();
    const index = data.notes.findIndex(n => n.id === id);
    if (index !== -1) {
      data.notes[index] = { ...data.notes[index], ...updatedNote };
      await writeData(data);
    }
  },

  // Initialize note with tasks array if it doesn't exist
  initializeNoteTasks: async (noteId) => {
    const data = await readData();
    const note = data.notes.find(n => n.id === noteId);
    if (note && !note.tasks) {
      note.tasks = [];
      await writeData(data);
    }
  },
  deleteNote: async (id) => {
    const data = await readData();
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
      await writeData(data);
    }
  },
  restoreNote: async (id) => {
    const data = await readData();
    const trashIndex = data.trash.findIndex(n => n.id === id);
    if (trashIndex !== -1) {
      const note = data.trash[trashIndex];
      delete note.deletedAt;
      data.notes.push(note);
      data.trash.splice(trashIndex, 1);
      await writeData(data);
    }
  },
  permanentlyDeleteNote: async (id) => {
    const data = await readData();
    data.trash = data.trash.filter(n => n.id !== id);
    await writeData(data);
  },
  emptyTrash: async () => {
    const data = await readData();
    data.trash = [];
    await writeData(data);
  },

  // Task Management Functions (within notes)
  getNoteTasks: async (noteId) => {
    const data = await readData();
    const note = data.notes.find(n => n.id === noteId);
    return note?.tasks || [];
  },

  saveNoteTask: async (noteId, task) => {
    const data = await readData();
    const note = data.notes.find(n => n.id === noteId);
    if (note) {
      if (!note.tasks) note.tasks = [];
      note.tasks.push(task);
      await writeData(data);
    }
  },

  updateNoteTask: async (noteId, taskId, updatedTask) => {
    const data = await readData();
    const note = data.notes.find(n => n.id === noteId);
    if (note && note.tasks) {
      const taskIndex = note.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        note.tasks[taskIndex] = { ...note.tasks[taskIndex], ...updatedTask };
        await writeData(data);
      }
    }
  },

  deleteNoteTask: async (noteId, taskId) => {
    const data = await readData();
    const note = data.notes.find(n => n.id === noteId);
    if (note && note.tasks) {
      note.tasks = note.tasks.filter(t => t.id !== taskId);
      await writeData(data);
    }
  },

  // Timer state persistence for tasks within notes
  updateNoteTaskTimer: async (noteId, taskId, timerData) => {
    const data = await readData();
    const note = data.notes.find(n => n.id === noteId);
    if (note && note.tasks) {
      const task = note.tasks.find(t => t.id === taskId);
      if (task) {
        task.timer = { ...task.timer, ...timerData };
        await writeData(data);
      }
    }
  },

  // Add manual time to task within note
  addNoteTaskManualTime: async (noteId, taskId, timeEntry) => {
    const data = await readData();
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
        const manualSeconds = timeEntry.minutes * 60;
        task.timer = {
          ...task.timer,
          totalWorkedTime: (task.timer?.totalWorkedTime || 0) + manualSeconds
        };

        await writeData(data);
      }
    }
  }
});
