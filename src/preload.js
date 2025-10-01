const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  registerUser: (userData) => ipcRenderer.invoke('register-user', userData),
  loginUser: (cipher, password) => ipcRenderer.invoke('login-user', cipher, password),
  getUserData: (cipher) => ipcRenderer.invoke('get-user-data', cipher),
  makeTransfer: (fromCipher, toCipher, amount, recipientName) => 
    ipcRenderer.invoke('make-transfer', fromCipher, toCipher, amount, recipientName),
  completeTask: (cipher, taskId) => ipcRenderer.invoke('complete-task', cipher, taskId),
  getTasks: () => ipcRenderer.invoke('get-tasks')
});