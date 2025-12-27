// === НАСТРОЙКИ ===
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

// Новые элементы
const fileInput = document.getElementById("fileInput");
const analyzeFileBtn = document.getElementById("analyzeFileBtn");
const fileAnalyzeOutput = document.getElementById("fileAnalyzeOutput");

const filePromptInput = document.getElementById("filePromptInput");
const fileNameInput = document.getElementById("fileNameInput");
const generateFileBtn = document.getElementById("generateFileBtn");

const bgPicker = document.getElementById("bgPicker");

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


// ===============================
//      1. АНАЛИЗ ФАЙЛА
// ===============================

analyzeFileBtn.addEventListener("click", async () => {
    if (!authToken) {
        fileAnalyzeOutput.textContent = "Нет токена. Авторизуйся.";
        return;
    }

    const file = fileInput.files[0];
    if (!file) {
        fileAnalyzeOutput.textContent = "Выберите файл.";
        return;
    }

    fileAnalyzeOutput.textContent = "Отправляем файл в нейронку...";

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(`${API_BASE_URL}/api/file/analyze`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${authToken}`
            },
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            fileAnalyzeOutput.textContent = `Ошибка: ${data.error}`;
            return;
        }

        fileAnalyzeOutput.textContent = data.reply;
    } catch (err) {
        console.error(err);
        fileAnalyzeOutput.textContent = "Ошибка сети при анализе файла.";
    }
});


// ===============================
//      2. ГЕНЕРАЦИЯ ФАЙЛА
// ===============================

generateFileBtn.addEventListener("click", async () => {
    if (!authToken) {
        alert("Нет токена. Авторизуйся.");
        return;
    }

    const prompt = filePromptInput.value.trim();
    const filename = fileNameInput.value.trim() || "generated.txt";

    if (!prompt) {
        alert("Введите запрос для генерации файла.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/file/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({ prompt, filename })
        });

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
    } catch (err) {
        console.error(err);
        alert("Ошибка при генерации файла.");
    }
});


// ===============================
//      3. СМЕНА ФОНА
// ===============================

bgPicker.addEventListener("input", (e) => {
    document.documentElement.style.setProperty("--bg-color", e.target.value);
});

