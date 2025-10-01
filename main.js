const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src/preload.js')
    }
  });

  mainWindow.loadFile('index.html');
}

// Хранилище данных
let users = [];
let transactions = [];
let tasks = [
  { id: 1, title: "Пройти обучение по финансовой грамотности", reward: 50, completed: false },
  { id: 2, title: "Пригласить друга в систему", reward: 100, completed: false },
  { id: 3, title: "Участвовать в опросе сообщества", reward: 25, completed: false },
  { id: 4, title: "Провести код-ревью", reward: 75, completed: false },
  { id: 5, title: "Завершить учебный проект", reward: 150, completed: false }
];

// API для работы с данными
ipcMain.handle('register-user', (event, userData) => {
  const existingUser = users.find(u => u.cipher === userData.cipher);
  if (existingUser) {
    return { success: false, message: "Пользователь с таким шифром уже существует" };
  }
  
  users.push({
    ...userData,
    balance: 1000, // Стартовый бонус
    joinedDate: new Date().toISOString()
  });
  
  return { success: true, message: "Регистрация успешна!" };
});

ipcMain.handle('login-user', (event, cipher, password) => {
  const user = users.find(u => u.cipher === cipher && u.password === password);
  if (user) {
    return { success: true, user };
  }
  return { success: false, message: "Неверный шифр или пароль" };
});

ipcMain.handle('get-user-data', (event, cipher) => {
  const user = users.find(u => u.cipher === cipher);
  const userTransactions = transactions.filter(t => 
    t.fromCipher === cipher || t.toCipher === cipher
  ).slice(-5);
  
  return { user, transactions: userTransactions };
});

ipcMain.handle('make-transfer', (event, fromCipher, toCipher, amount, recipientName) => {
  const fromUser = users.find(u => u.cipher === fromCipher);
  const toUser = users.find(u => u.cipher === toCipher);
  
  if (!fromUser) return { success: false, message: "Отправитель не найден" };
  if (!toUser) return { success: false, message: "Получатель не найден" };
  if (fromUser.balance < amount) return { success: false, message: "Недостаточно средств" };
  
  fromUser.balance -= amount;
  toUser.balance += amount;
  
  const transaction = {
    id: Date.now(),
    fromCipher,
    toCipher,
    recipientName,
    amount,
    date: new Date().toISOString(),
    type: "transfer"
  };
  transactions.push(transaction);
  
  return { success: true, message: "Перевод успешно выполнен" };
});

ipcMain.handle('complete-task', (event, cipher, taskId) => {
  const user = users.find(u => u.cipher === cipher);
  const task = tasks.find(t => t.id === taskId);
  
  if (!user || !task) return { success: false, message: "Ошибка выполнения задания" };
  if (task.completed) return { success: false, message: "Задание уже выполнено" };
  
  user.balance += task.reward;
  task.completed = true;
  
  const transaction = {
    id: Date.now(),
    fromCipher: "system",
    toCipher: cipher,
    recipientName: task.title,
    amount: task.reward,
    date: new Date().toISOString(),
    type: "task_reward"
  };
  transactions.push(transaction);
  
  return { success: true, message: `Получено ${task.reward} Кибиков!` };
});

ipcMain.handle('get-tasks', () => {
  return tasks;
});

app.whenReady().then(createWindow);