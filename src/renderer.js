let currentUser = null;

// Управление табами авторизации
function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Регистрация
async function register() {
    const cipher = document.getElementById('reg-cipher').value;
    const password = document.getElementById('reg-password').value;
    const name = document.getElementById('reg-name').value;
    const group = document.getElementById('reg-group').value;

    if (!cipher || !password || !name || !group) {
        showMessage('Заполните все поля', 'error');
        return;
    }

    try {
        const result = await window.electronAPI.registerUser({
            cipher, password, name, group
        });
        
        if (result.success) {
            showMessage(result.message, 'success');
            showTab('login');
            document.getElementById('reg-cipher').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-name').value = '';
            document.getElementById('reg-group').value = '';
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        showMessage('Ошибка регистрации', 'error');
    }
}

// Вход
async function login() {
    const cipher = document.getElementById('login-cipher').value;
    const password = document.getElementById('login-password').value;

    if (!cipher || !password) {
        showMessage('Введите шифр и пароль', 'error');
        return;
    }

    try {
        const result = await window.electronAPI.loginUser(cipher, password);
        
        if (result.success) {
            currentUser = result.user;
            showMainSection();
            loadUserData();
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        showMessage('Ошибка входа', 'error');
    }
}

// Показ главной секции
function showMainSection() {
    document.getElementById('auth-section').classList.remove('active');
    document.getElementById('main-section').classList.add('active');
}

// Загрузка данных пользователя
async function loadUserData() {
    if (!currentUser) return;

    try {
        const data = await window.electronAPI.getUserData(currentUser.cipher);
        
        document.getElementById('balance-amount').textContent = 
            `${data.user.balance} Кибиков`;
        document.getElementById('user-name').textContent = data.user.name;
        
        updateTransactionsList(data.transactions);
        updateRecipientsList();
        loadTasks();
    } catch (error) {
        showMessage('Ошибка загрузки данных', 'error');
    }
}

// Обновление списка транзакций
function updateTransactionsList(transactions) {
    const container = document.getElementById('transactions-list');
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-name">Операций пока нет</div>
                    <div class="transaction-date">Совершите первую операцию</div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = transactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-name">${transaction.recipientName}</div>
                <div class="transaction-date">${new Date(transaction.date).toLocaleDateString('ru-RU')}</div>
            </div>
            <div class="transaction-amount ${transaction.toCipher === currentUser.cipher ? 'positive' : 'negative'}">
                ${transaction.toCipher === currentUser.cipher ? '+' : '-'}${transaction.amount} К
            </div>
        </div>
    `).join('');
}

// Обновление списка получателей
async function updateRecipientsList() {
    const select = document.getElementById('transfer-recipient');
    select.innerHTML = '<option value="">Выберите получателя</option>';
    
    // Тестовые пользователи для групп ККСО
    const testUsers = [
        { cipher: 'kkso07_001', name: 'Иван Петров (ККСО-07-23)', group: 'кксо-07-23' },
        { cipher: 'kkso07_002', name: 'Мария Сидорова (ККСО-07-23)', group: 'кксо-07-23' },
        { cipher: 'kkso06_001', name: 'Алексей Козлов (ККСО-06-23)', group: 'кксо-06-23' },
        { cipher: 'kkso06_002', name: 'Елена Новикова (ККСО-06-23)', group: 'кксо-06-23' }
    ];
    
    testUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.cipher;
        option.textContent = user.name;
        option.dataset.group = user.group;
        select.appendChild(option);
    });
}

// Фильтрация получателей по группе
function filterRecipients() {
    const group = document.getElementById('transfer-group').value;
    const select = document.getElementById('transfer-recipient');
    
    Array.from(select.options).forEach(option => {
        if (option.value === '') return;
        option.style.display = !group || option.dataset.group === group ? 'block' : 'none';
    });
}

// Выполнение перевода
async function makeTransfer() {
    if (!currentUser) return;

    const toCipher = document.getElementById('transfer-recipient').value;
    const amount = parseInt(document.getElementById('transfer-amount').value);
    const recipientOption = document.getElementById('transfer-recipient').selectedOptions[0];

    if (!toCipher || !amount || amount <= 0) {
        showMessage('Заполните все поля корректно', 'error');
        return;
    }

    if (amount > currentUser.balance) {
        showMessage('Недостаточно средств', 'error');
        return;
    }

    try {
        const result = await window.electronAPI.makeTransfer(
            currentUser.cipher, 
            toCipher, 
            amount, 
            recipientOption.textContent.split(' (')[0]
        );
        
        if (result.success) {
            showMessage(result.message, 'success');
            document.getElementById('transfer-amount').value = '';
            loadUserData();
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        showMessage('Ошибка перевода', 'error');
    }
}

// Загрузка заданий (только просмотр)
async function loadTasks() {
    try {
        const tasks = await window.electronAPI.getTasks();
        const container = document.getElementById('tasks-container');
        
        container.innerHTML = tasks.map(task => `
            <div class="task-item">
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-status">${task.completed ? '✅ Выполнено' : '⏳ Доступно'}</div>
                </div>
                <div class="task-reward">+${task.reward} К</div>
            </div>
        `).join('');
    } catch (error) {
        showMessage('Ошибка загрузки заданий', 'error');
    }
}

// Управление вкладками главного меню
function showMainTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.main-tab').forEach(tab => tab.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Выход
function logout() {
    currentUser = null;
    document.getElementById('main-section').classList.remove('active');
    document.getElementById('auth-section').classList.add('active');
    
    document.getElementById('login-cipher').value = '';
    document.getElementById('login-password').value = '';
}

// Вспомогательная функция для показа сообщений
function showMessage(text, type) {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    document.body.insertBefore(message, document.body.firstChild);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 3000);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    updateRecipientsList();
});