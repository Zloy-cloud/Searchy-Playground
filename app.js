// === НАСТРОЙКИ ===
// ПРИ ДЕПЛОЕ: поменяй на адрес бэка @feitov
// Например: const API_BASE_URL = "https://your-backend.onrender.com";
const API_BASE_URL = "https://backend-flask-rqsp.onrender.com";

let authToken = null;

// ЭЛЕМЕНТЫ
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const tokenInfo = document.getElementById("tokenInfo");

const authStatus = document.getElementById("authStatus");
const codeInput = document.getElementById("codeInput");
const replyOutput = document.getElementById("replyOutput");
const sendChatBtn = document.getElementById("sendChatBtn");
const sendSearchBtn = document.getElementById("sendSearchBtn");

const openEditorBtn = document.getElementById("openEditorBtn");

// Вспомогательные

function setAuthStatus(isAuthed) {
    if (!authStatus) return;
    if (isAuthed) {
        authStatus.textContent = "Авторизовано";
        authStatus.classList.remove("badge-offline");
        authStatus.classList.add("badge-online");
    } else {
        authStatus.textContent = "Не авторизовано";
        authStatus.classList.remove("badge-online");
        authStatus.classList.add("badge-offline");
    }
}

function setReply(text) {
    replyOutput.textContent = text || "";
}

// Восстановление токена из localStorage
(function initTokenFromStorage() {
    const saved = localStorage.getItem("wf_token");
    if (saved) {
        authToken = saved;
        setAuthStatus(true);
        tokenInfo.textContent = "Токен загружен из памяти браузера.";
    } else {
        setAuthStatus(false);
    }
})();

// Логин

loginBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        tokenInfo.textContent = "Введите логин и пароль.";
        return;
    }

    tokenInfo.textContent = "Получаем токен...";

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            tokenInfo.textContent = "Ошибка авторизации. Проверьте данные.";
            setAuthStatus(false);
            return;
        }

        const data = await res.json();
        authToken = data.token;
        localStorage.setItem("wf_token", authToken);

        tokenInfo.textContent = `Токен получен. Истекает: ${data.expires_at}`;
        setAuthStatus(true);
    } catch (err) {
        console.error(err);
        tokenInfo.textContent = "Ошибка сети при авторизации.";
        setAuthStatus(false);
    }
});

// /api/chat

sendChatBtn.addEventListener("click", async () => {
    if (!authToken) {
        setReply("Нет токена. Сначала авторизуйся.");
        return;
    }

    const code = codeInput.value.trim();
    if (!code) {
        setReply("Введи код для анализа.");
        return;
    }

    setReply("Отправляем в нейронку...");

    try {
        const res = await fetch(`${API_BASE_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({
                message: `Проанализируй этот код, исправь ошибки и объясни:\n\n${code}`
            })
        });

        const data = await res.json();

        if (!res.ok) {
            setReply(`Ошибка: ${data.message || data.error || "Неизвестная ошибка"}`);
            if (res.status === 401) {
                setAuthStatus(false);
            }
            return;
        }

        setReply(data.reply || "Пустой ответ от нейронки.");
    } catch (err) {
        console.error(err);
        setReply("Ошибка сети при запросе к /api/chat.");
    }
});

// /api/search

sendSearchBtn.addEventListener("click", async () => {
    if (!authToken) {
        setReply("Нет токена. Сначала авторизуйся.");
        return;
    }

    const code = codeInput.value.trim();
    if (!code) {
        setReply("Введи код или вопрос для анализа.");
        return;
    }

    setReply("Отправляем в нейронку с веб‑поиском...");

    try {
        const res = await fetch(`${API_BASE_URL}/api/search`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({
                query: `Помоги с этим кодом (можешь использовать поиск):\n\n${code}`
            })
        });

        const data = await res.json();

        if (!res.ok) {
            setReply(`Ошибка: ${data.message || data.error || "Неизвестная ошибка"}`);
            if (res.status === 401) {
                setAuthStatus(false);
            }
            return;
        }

        let suffix = data.search_performed ? "\n\n(Был использован веб‑поиск)" : "";
        setReply((data.reply || "Пустой ответ от нейронки.") + suffix);
    } catch (err) {
        console.error(err);
        setReply("Ошибка сети при запросе к /api/search.");
    }
});

// Кнопка "Перейти к редактору"

openEditorBtn.addEventListener("click", () => {
    const editorPanel = document.getElementById("editorPanel");
    editorPanel?.scrollIntoView({ behavior: "smooth" });
});
