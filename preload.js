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
  deleteNote: (id) => {
    const data = readData();
    const noteIndex = data.notes.findIndex(n => n.id === id);
    if (noteIndex !== -1) {
      const note = data.notes[noteIndex];
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
  }
});
