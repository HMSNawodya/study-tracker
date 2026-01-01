document.addEventListener("DOMContentLoaded", () => {
    initLogin();           // login + gender theme
    initThemeToggle();     // dark/light toggle
    initLogout();          // log out

    initYear();
    initSummary();
    initHoursTracker();
    initStreakTracker();
    initAnnouncements();
    initFlashcards();
    initTimerWithGarden();
    initMusicPlayer();
    initTodoList();
    initTipsAccordion();
});

/* ========== LOGIN, THEME, LOGOUT ========== */

function loadUser() {
    const raw = localStorage.getItem("st_user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}
function saveUser(user) {
    localStorage.setItem("st_user", JSON.stringify(user));
}

function initLogin() {
    const loginScreen = document.getElementById("loginScreen");
    const form = document.getElementById("loginForm");
    const nameInput = document.getElementById("loginName");
    const genderRadios = document.querySelectorAll("input[name='gender']");
    const errorEl = document.getElementById("loginError");
    const nameDisplay = document.getElementById("userNameDisplay");

    if (!loginScreen || !form) return;

    const existing = loadUser();
    if (existing) {
        applyTheme(existing.gender || "male", existing.mode || "dark");
        if (nameDisplay && existing.name) nameDisplay.textContent = existing.name;
        loginScreen.classList.add("login-hidden");
        return;
    } else {
        applyTheme("male", "dark");
    }

    form.addEventListener("submit", e => {
        e.preventDefault();
        errorEl.textContent = "";

        const name = nameInput.value.trim();
        const genderRadio = Array.from(genderRadios).find(r => r.checked);

        if (!name) {
            errorEl.textContent = "Please enter your name.";
            return;
        }
        if (!genderRadio) {
            errorEl.textContent = "Please select your gender.";
            return;
        }

        const user = { name, gender: genderRadio.value, mode: "dark" };
        saveUser(user);

        applyTheme(user.gender, user.mode);
        if (nameDisplay) nameDisplay.textContent = user.name;
        loginScreen.classList.add("login-hidden");
    });
}

function applyTheme(gender, mode) {
    const body = document.body;
    body.classList.remove("gender-male", "gender-female", "mode-dark", "mode-light");

    const g = gender === "female" ? "female" : "male";
    const m = mode === "light" ? "light" : "dark";

    body.classList.add(`gender-${g}`, `mode-${m}`);
}

function initThemeToggle() {
    const btn = document.getElementById("btnThemeToggle");
    if (!btn) return;

    const user = loadUser();
    const currentMode = user?.mode || "dark";
    applyTheme(user?.gender || "male", currentMode);
    updateIcon(currentMode);

    btn.addEventListener("click", () => {
        const isLight = document.body.classList.contains("mode-light");
        const newMode = isLight ? "dark" : "light";

        const stored = loadUser() || { name: "Student", gender: "male", mode: "dark" };
        stored.mode = newMode;
        saveUser(stored);
        applyTheme(stored.gender, newMode);
        updateIcon(newMode);
    });

    function updateIcon(mode) {
        btn.textContent = mode === "light" ? "🌙" : "☀";
    }
}

function initLogout() {
    const btn = document.getElementById("btnLogout");
    const loginScreen = document.getElementById("loginScreen");
    const nameDisplay = document.getElementById("userNameDisplay");
    if (!btn || !loginScreen) return;

    btn.addEventListener("click", () => {
        localStorage.removeItem("st_user");
        if (nameDisplay) nameDisplay.textContent = "Student";
        applyTheme("male", "dark");
        loginScreen.classList.remove("login-hidden");
    });
}

/* ========== SHARED HELPERS ========== */

function initYear() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function formatDate(str) {
    if (!str) return "";
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return str;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    }[c]));
}

/* ========== HOME SUMMARY ========== */

function initSummary() {
    const dateEl = document.getElementById("summaryDate");
    if (dateEl) {
        const d = new Date();
        dateEl.textContent = d.toLocaleDateString(undefined,
            { weekday: "long", year: "numeric", month: "short", day: "numeric" });
    }
    updateSummary();
}

function updateSummary() {
    const minutesEl = document.getElementById("summaryMinutes");
    const tasksEl = document.getElementById("summaryTasks");
    const streakEl = document.getElementById("summaryStreak");

    const hoursStorage = localStorage.getItem("st_hours");
    let minutesToday = 0;
    if (hoursStorage) {
        const hours = JSON.parse(hoursStorage);
        const tISO = todayISO();
        minutesToday = hours
            .filter(h => h.date === tISO)
            .reduce((sum, h) => sum + (h.minutes || 0), 0);
    }
    if (minutesEl) minutesEl.textContent = minutesToday;

    const todoStorage = localStorage.getItem("st_todos");
    let tasks = 0;
    if (todoStorage) {
        const todos = JSON.parse(todoStorage);
        tasks = todos.length;
    }
    if (tasksEl) tasksEl.textContent = tasks;

    const streakStorage = localStorage.getItem("st_streak");
    let current = 0;
    if (streakStorage) {
        const obj = JSON.parse(streakStorage);
        current = obj.current || 0;
    }
    if (streakEl) streakEl.textContent = current;
}

/* ========== STUDY HOURS TRACKER ========== */

let hoursData = [];

function initHoursTracker() {
    const stored = localStorage.getItem("st_hours");
    hoursData = stored ? JSON.parse(stored) : [];

    const form = document.getElementById("hoursForm");
    if (!form) return;

    const subjectInput = document.getElementById("hoursSubject");
    const dateInput = document.getElementById("hoursDate");
    const minutesInput = document.getElementById("hoursMinutes");

    const subjectError = document.getElementById("hoursSubjectError");
    const dateError = document.getElementById("hoursDateError");
    const minutesError = document.getElementById("hoursMinutesError");
    const successEl = document.getElementById("hoursSuccess");
    const filterDateInput = document.getElementById("hoursFilterDate");

    const tISO = todayISO();
    if (dateInput) dateInput.value = tISO;
    if (filterDateInput) filterDateInput.value = tISO;

    form.addEventListener("submit", e => {
        e.preventDefault();
        subjectError.textContent = "";
        dateError.textContent = "";
        minutesError.textContent = "";
        successEl.textContent = "";

        const subject = subjectInput.value.trim();
        const date = dateInput.value;
        const minutes = parseInt(minutesInput.value, 10);

        let valid = true;
        if (!subject) {
            subjectError.textContent = "Please enter a subject.";
            valid = false;
        }
        if (!date) {
            dateError.textContent = "Please select a date.";
            valid = false;
        }
        if (Number.isNaN(minutes) || minutes <= 0) {
            minutesError.textContent = "Please enter minutes (> 0).";
            valid = false;
        }

        if (!valid) return;

        hoursData.push({
            id: Date.now(),
            subject,
            date,
            minutes
        });
        localStorage.setItem("st_hours", JSON.stringify(hoursData));

        successEl.textContent = "Study session added.";
        form.reset();
        dateInput.value = tISO;

        renderHoursTable();
        updateSummary();
    });

    if (filterDateInput) {
        filterDateInput.addEventListener("change", () => {
            renderHoursTable();
        });
    }

    renderHoursTable();
}

function renderHoursTable() {
    const tbody = document.querySelector("#hoursTable tbody");
    const emptyEl = document.getElementById("hoursEmpty");
    const totalEl = document.getElementById("hoursTotalForDay");
    const filterDateInput = document.getElementById("hoursFilterDate");
    if (!tbody || !filterDateInput) return;

    const selectedDate = filterDateInput.value || todayISO();
    filterDateInput.value = selectedDate;

    const filtered = hoursData.filter(h => h.date === selectedDate);

    tbody.innerHTML = "";
    if (!filtered.length) {
        emptyEl.style.display = "block";
        if (totalEl) totalEl.textContent = 0;
        return;
    } else {
        emptyEl.style.display = "none";
    }

    let total = 0;
    filtered.forEach(h => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${formatDate(h.date)}</td>
            <td>${escapeHtml(h.subject)}</td>
            <td>${h.minutes}</td>
            <td><button class="btn ghost-btn btn-sm" data-id="${h.id}">✕</button></td>
        `;
        total += h.minutes;
        tbody.appendChild(tr);
    });

    if (totalEl) totalEl.textContent = total;

    tbody.querySelectorAll("button[data-id]").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            hoursData = hoursData.filter(h => h.id !== id);
            localStorage.setItem("st_hours", JSON.stringify(hoursData));
            renderHoursTable();
            updateSummary();
        });
    });
}

/* ========== STREAK TRACKER ========== */

function initStreakTracker() {
    const storage = localStorage.getItem("st_streak");
    let data = storage ? JSON.parse(storage) : { current: 0, best: 0, lastDate: null };

    const currentEl = document.getElementById("streakCurrent");
    const bestEl = document.getElementById("streakBest");
    const lastEl = document.getElementById("streakLast");
    const msgEl = document.getElementById("streakMessage");
    const btn = document.getElementById("btnCheckIn");

    function render() {
        if (currentEl) currentEl.textContent = data.current || 0;
        if (bestEl) bestEl.textContent = data.best || 0;
        if (lastEl) lastEl.textContent = data.lastDate ? formatDate(data.lastDate) : "–";
    }

    render();

    if (btn) {
        btn.addEventListener("click", () => {
            const today = todayISO();
            if (data.lastDate === today) {
                msgEl.textContent = "You already checked in for today. Great job!";
                return;
            }

            if (!data.lastDate) {
                data.current = 1;
            } else {
                const last = new Date(data.lastDate);
                const now = new Date(today);
                const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) data.current += 1;
                else data.current = 1;
            }

            data.lastDate = today;
            if (data.current > data.best) data.best = data.current;

            localStorage.setItem("st_streak", JSON.stringify(data));
            render();
            updateSummary();
            msgEl.textContent = "Check‑in recorded! Keep going.";
        });
    }
}

/* ========== ANNOUNCEMENTS ========== */

let announcements = [];

function initAnnouncements() {
    const storage = localStorage.getItem("st_announcements");
    announcements = storage ? JSON.parse(storage) : [];

    const form = document.getElementById("announcementForm");
    if (!form) return;

    const titleInput = document.getElementById("annTitle");
    const dateInput = document.getElementById("annDate");
    const titleError = document.getElementById("annTitleError");
    const dateError = document.getElementById("annDateError");

    form.addEventListener("submit", e => {
        e.preventDefault();
        titleError.textContent = "";
        dateError.textContent = "";

        const title = titleInput.value.trim();
        const date = dateInput.value;

        let valid = true;
        if (!title) {
            titleError.textContent = "Please enter a title.";
            valid = false;
        }
        if (!date) {
            dateError.textContent = "Please select a date.";
            valid = false;
        }
        if (!valid) return;

        announcements.push({ id: Date.now(), title, date });
        localStorage.setItem("st_announcements", JSON.stringify(announcements));
        form.reset();
        renderAnnouncements();
    });

    renderAnnouncements();
}

function renderAnnouncements() {
    const list = document.getElementById("annList");
    const emptyEl = document.getElementById("annEmpty");
    if (!list) return;

    const now = todayISO();
    const sorted = [...announcements].sort((a, b) => new Date(a.date) - new Date(b.date));

    list.innerHTML = "";
    if (!sorted.length) {
        emptyEl.style.display = "block";
        return;
    } else {
        emptyEl.style.display = "none";
    }

    sorted.forEach(a => {
        const li = document.createElement("li");
        const days = daysBetween(now, a.date);
        const soon = days <= 3 && days >= 0;
        li.innerHTML = `
            <div>
                <span class="ann-title">${escapeHtml(a.title)}</span>
                <span class="ann-date">${formatDate(a.date)}${soon ? " · <strong>Due soon</strong>" : ""}</span>
            </div>
            <div class="ann-right">
                <button class="ann-delete" data-id="${a.id}">✕</button>
            </div>
        `;
        list.appendChild(li);
    });

    list.querySelectorAll(".ann-delete").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            announcements = announcements.filter(x => x.id !== id);
            localStorage.setItem("st_announcements", JSON.stringify(announcements));
            renderAnnouncements();
        });
    });
}

function daysBetween(startIso, endIso) {
    const s = new Date(startIso);
    const e = new Date(endIso);
    return Math.round((e - s) / (1000 * 60 * 60 * 24));
}

/* ========== FLASHCARDS (user-defined) ========== */
/*   st_flashMeta   -> { level, subjects: [{key,name}...] }
     st_flashCards  -> { [subjectKey]: [ {id, question, answer}, ... ] }
*/

let flashMeta = null;
let flashCardsBySubject = {};
let currentSubjectKey = null;
let currentDeck = [];
let currentCardIndex = 0;
let currentShowBack = false;

function initFlashcards() {
    const setupDiv = document.getElementById("flashSetup");
    const mainDiv = document.getElementById("flashMain");
    if (!setupDiv || !mainDiv) return;

    const storedMeta = localStorage.getItem("st_flashMeta");
    const storedCards = localStorage.getItem("st_flashCards");
    flashMeta = storedMeta ? JSON.parse(storedMeta) : null;
    flashCardsBySubject = storedCards ? JSON.parse(storedCards) : {};

    if (!flashMeta) {
        setupDiv.classList.remove("hidden");
        mainDiv.classList.add("hidden");
        initFlashSetupForm();
    } else {
        setupDiv.classList.add("hidden");
        mainDiv.classList.remove("hidden");
        initFlashMain();
    }
}

/* Setup (level + subjects) */
function initFlashSetupForm() {
    const form = document.getElementById("flashSetupForm");
    const levelInput = document.getElementById("flashLevel");
    const subjectsInput = document.getElementById("flashSubjects");
    const errorEl = document.getElementById("flashSetupError");

    form.addEventListener("submit", e => {
        e.preventDefault();
        errorEl.textContent = "";

        const level = levelInput.value;
        const subjectsRaw = subjectsInput.value.trim();

        if (!level) {
            errorEl.textContent = "Please select your study level.";
            return;
        }
        if (!subjectsRaw) {
            errorEl.textContent = "Please enter at least one subject.";
            return;
        }

        const names = subjectsRaw.split(",").map(s => s.trim()).filter(Boolean);
        if (!names.length) {
            errorEl.textContent = "Please enter valid subject names.";
            return;
        }

        const subjects = names.map(name => ({
            key: name.toLowerCase().replace(/\s+/g, "_"),
            name
        }));

        flashMeta = { level, subjects };
        flashCardsBySubject = {};
        subjects.forEach(s => { flashCardsBySubject[s.key] = []; });

        localStorage.setItem("st_flashMeta", JSON.stringify(flashMeta));
        localStorage.setItem("st_flashCards", JSON.stringify(flashCardsBySubject));

        document.getElementById("flashSetup").classList.add("hidden");
        document.getElementById("flashMain").classList.remove("hidden");
        initFlashMain();
    });
}

/* Main flashcard UI */
function initFlashMain() {
    const levelDisplay = document.getElementById("flashLevelDisplay");
    const subjectSelect = document.getElementById("flashSubjectSelect");
    const addBtn = document.getElementById("flashAddBtn");
    const qInput = document.getElementById("flashQuestion");
    const aInput = document.getElementById("flashAnswerInput");
    const addError = document.getElementById("flashAddError");
    const listEl = document.getElementById("flashList");
    const listEmptyEl = document.getElementById("flashListEmpty");

    const cardEl = document.getElementById("flashcardText");
    const idxEl = document.getElementById("flashIndex");
    const btnPrev = document.getElementById("flashPrev");
    const btnNext = document.getElementById("flashNext");
    const btnToggle = document.getElementById("flashToggle");

    if (!flashMeta) return;

    if (levelDisplay) {
        const levelLabel = {
            school: "School student",
            college: "College student",
            undergraduate: "Undergraduate",
            other: "Other"
        }[flashMeta.level] || flashMeta.level;
        levelDisplay.textContent = levelLabel;
    }

    subjectSelect.innerHTML = "";
    flashMeta.subjects.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.key;
        opt.textContent = s.name;
        subjectSelect.appendChild(opt);
    });

    subjectSelect.addEventListener("change", () => {
        currentSubjectKey = subjectSelect.value;
        currentDeck = flashCardsBySubject[currentSubjectKey] || [];
        currentCardIndex = 0;
        currentShowBack = false;
        renderFlashPractice();
        renderFlashList();
    });

    currentSubjectKey = flashMeta.subjects[0].key;
    subjectSelect.value = currentSubjectKey;
    currentDeck = flashCardsBySubject[currentSubjectKey] || [];
    currentCardIndex = 0;
    currentShowBack = false;

    addBtn.addEventListener("click", () => {
        addError.textContent = "";
        const q = qInput.value.trim();
        const a = aInput.value.trim();
        if (!q || !a) {
            addError.textContent = "Please enter both question and answer.";
            return;
        }

        const card = { id: Date.now(), question: q, answer: a };
        if (!flashCardsBySubject[currentSubjectKey]) {
            flashCardsBySubject[currentSubjectKey] = [];
        }
        flashCardsBySubject[currentSubjectKey].push(card);
        localStorage.setItem("st_flashCards", JSON.stringify(flashCardsBySubject));

        qInput.value = "";
        aInput.value = "";
        currentDeck = flashCardsBySubject[currentSubjectKey];
        currentCardIndex = currentDeck.length - 1;
        currentShowBack = false;
        renderFlashPractice();
        renderFlashList();
    });

    btnPrev.addEventListener("click", () => {
        if (!currentDeck.length) return;
        currentCardIndex = (currentCardIndex - 1 + currentDeck.length) % currentDeck.length;
        currentShowBack = false;
        renderFlashPractice();
    });
    btnNext.addEventListener("click", () => {
        if (!currentDeck.length) return;
        currentCardIndex = (currentCardIndex + 1) % currentDeck.length;
        currentShowBack = false;
        renderFlashPractice();
    });
    btnToggle.addEventListener("click", () => {
        currentShowBack = !currentShowBack;
        renderFlashPractice();
    });

    function renderFlashPractice() {
        if (!cardEl || !idxEl) return;
        if (!currentDeck.length) {
            cardEl.textContent = "No cards yet for this subject.";
            idxEl.textContent = "";
            btnToggle.textContent = "Show Answer";
            return;
        }
        const current = currentDeck[currentCardIndex];
        cardEl.textContent = currentShowBack ? current.answer : current.question;
        idxEl.textContent = `${currentCardIndex + 1} / ${currentDeck.length}`;
        btnToggle.textContent = currentShowBack ? "Show Question" : "Show Answer";
    }

    function renderFlashList() {
        listEl.innerHTML = "";
        const deck = flashCardsBySubject[currentSubjectKey] || [];
        if (!deck.length) {
            listEmptyEl.style.display = "block";
            return;
        } else {
            listEmptyEl.style.display = "none";
        }

        deck.forEach(card => {
            const li = document.createElement("li");
            li.innerHTML = `
                <div class="flash-list-main">
                    <span class="flash-q">${escapeHtml(card.question)}</span>
                    <span class="flash-a">${escapeHtml(card.answer)}</span>
                </div>
                <button class="flash-delete" data-id="${card.id}">✕</button>
            `;
            listEl.appendChild(li);
        });

        listEl.querySelectorAll(".flash-delete").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = Number(btn.dataset.id);
                const deck = flashCardsBySubject[currentSubjectKey] || [];
                flashCardsBySubject[currentSubjectKey] = deck.filter(c => c.id !== id);
                localStorage.setItem("st_flashCards", JSON.stringify(flashCardsBySubject));
                currentDeck = flashCardsBySubject[currentSubjectKey];
                if (currentCardIndex >= currentDeck.length) currentCardIndex = currentDeck.length - 1;
                if (currentCardIndex < 0) currentCardIndex = 0;
                currentShowBack = false;
                renderFlashPractice();
                renderFlashList();
            });
        });
    }

    renderFlashPractice();
    renderFlashList();
}

/* ========== TIMER ========== */

let timerInterval = null;
let timerRemaining = 25 * 60;
let timerRunning = false;
let timerFinished = false;

function initTimerWithGarden() {
    const display = document.getElementById("timerDisplay");
    const minutesInput = document.getElementById("timerMinutes");
    const btnStart = document.getElementById("btnStart");
    const btnPause = document.getElementById("btnPause");
    const btnReset = document.getElementById("btnReset");

    if (!display || !minutesInput || !btnStart || !btnPause || !btnReset) return;

    function updateDisplay() {
        const m = Math.floor(timerRemaining / 60);
        const s = timerRemaining % 60;
        display.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    function setPlantState(state) {
        const plant = document.getElementById("plant");
        const status = document.getElementById("plantStatus");
        if (!plant || !status) return;

        plant.classList.remove("plant-empty", "plant-seed", "plant-flower", "plant-dead");

        switch (state) {
            case "seed":
                plant.classList.add("plant-seed");
                status.textContent = "Seed planted. Stay focused until the timer ends!";
                break;
            case "flower":
                plant.classList.add("plant-flower");
                status.textContent = "Great job! Your focus grew a flower.";
                break;
            case "dead":
                plant.classList.add("plant-dead");
                status.textContent = "The plant died. Try another focused session.";
                break;
            default:
                plant.classList.add("plant-empty");
                status.textContent = "Start a session to plant a new seed.";
        }
    }

    setPlantState("empty");
    updateDisplay();

    btnStart.addEventListener("click", () => {
        if (timerRunning) return;

        if (timerFinished || timerRemaining === 25 * 60 || timerRemaining <= 0) {
            const customMin = parseInt(minutesInput.value, 10);
            timerRemaining = (!Number.isNaN(customMin) && customMin > 0)
                ? customMin * 60
                : 25 * 60;
            timerFinished = false;
            setPlantState("seed");
        }

        timerRunning = true;
        btnStart.disabled = true;
        btnPause.disabled = false;
        btnReset.disabled = false;

        timerInterval = setInterval(() => {
            timerRemaining -= 1;
            if (timerRemaining <= 0) {
                timerRemaining = 0;
                clearInterval(timerInterval);
                timerInterval = null;
                timerRunning = false;
                timerFinished = true;
                setPlantState("flower");
                btnStart.disabled = false;
                btnPause.disabled = true;
            }
            updateDisplay();
        }, 1000);
    });

    btnPause.addEventListener("click", () => {
        if (!timerRunning) return;
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;
        btnStart.disabled = false;
        btnPause.disabled = true;
    });

    btnReset.addEventListener("click", () => {
        if (timerRunning && !timerFinished) {
            setPlantState("dead");
        } else if (timerFinished) {
            setPlantState("empty");
        }

        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;

        const customMin = parseInt(minutesInput.value, 10);
        timerRemaining = (!Number.isNaN(customMin) && customMin > 0)
            ? customMin * 60
            : 25 * 60;
        timerFinished = false;
        updateDisplay();

        btnStart.disabled = false;
        btnPause.disabled = true;
        btnReset.disabled = false;
    });
}

/* ========== MUSIC PLAYER (3 TRACKS) ========== */

const tracks = [
    { id: 1, title: "Calm Ocean Waves", file: "audio/calm_ocean.mp3" },
    { id: 2, title: "Soft Piano Focus", file: "audio/soft_piano.mp3" },
    { id: 3, title: "Night Lofi",       file: "audio/night_lofi.mp3" }
];

function initMusicPlayer() {
    const list = document.getElementById("musicList");
    const nowEl = document.getElementById("musicNowPlaying");
    const audio = document.getElementById("audioPlayer");
    if (!list || !audio) return;

    list.innerHTML = "";
    tracks.forEach(t => {
        const li = document.createElement("li");
        li.textContent = t.title;
        li.dataset.id = t.id;
        list.appendChild(li);
    });

    list.querySelectorAll("li").forEach(li => {
        li.addEventListener("click", () => {
            const id = Number(li.dataset.id);
            const track = tracks.find(t => t.id === id);
            if (!track) return;

            audio.src = track.file;
            audio.play().catch(() => {});
            if (nowEl) nowEl.textContent = `Now Playing: ${track.title}`;

            list.querySelectorAll("li").forEach(x => x.classList.remove("active"));
            li.classList.add("active");
        });
    });
}

/* ========== TO-DO LIST ========== */

let todos = [];

function initTodoList() {
    const storage = localStorage.getItem("st_todos");
    todos = storage ? JSON.parse(storage) : [];

    const form = document.getElementById("todoForm");
    if (!form) return;

    const input = document.getElementById("todoText");
    const errorEl = document.getElementById("todoError");

    form.addEventListener("submit", e => {
        e.preventDefault();
        errorEl.textContent = "";
        const text = (input.value || "").trim();
        if (!text) {
            errorEl.textContent = "Please enter a task.";
            return;
        }

        todos.push({
            id: Date.now(),
            text,
            completed: false
        });
        localStorage.setItem("st_todos", JSON.stringify(todos));
        input.value = "";
        renderTodos();
        updateSummary();
    });

    renderTodos();
}

function renderTodos() {
    const list = document.getElementById("todoList");
    const emptyEl = document.getElementById("todoEmpty");
    if (!list) return;

    list.innerHTML = "";
    if (!todos.length) {
        emptyEl.style.display = "block";
        return;
    } else {
        emptyEl.style.display = "none";
    }

    todos.forEach(t => {
        const li = document.createElement("li");
        li.classList.add("todo-item");
        if (t.completed) li.classList.add("completed");

        li.innerHTML = `
            <div class="todo-left">
                <input type="checkbox" ${t.completed ? "checked" : ""}>
                <span class="todo-text">${escapeHtml(t.text)}</span>
            </div>
            <button class="todo-delete">✕</button>
        `;

        const checkbox = li.querySelector("input[type='checkbox']");
        const delBtn = li.querySelector(".todo-delete");

        checkbox.addEventListener("change", () => {
            t.completed = checkbox.checked;
            localStorage.setItem("st_todos", JSON.stringify(todos));
            renderTodos();
        });

        delBtn.addEventListener("click", () => {
            if (confirm("Delete this task?")) {
                todos = todos.filter(x => x.id !== t.id);
                localStorage.setItem("st_todos", JSON.stringify(todos));
                renderTodos();
                updateSummary();
            }
        });

        list.appendChild(li);
    });
}

/* ========== STUDY TIPS ACCORDION ========== */

function initTipsAccordion() {
    const tips = document.querySelectorAll(".tip");
    tips.forEach(tip => {
        const header = tip.querySelector(".tip-header");
        const toggle = tip.querySelector(".tip-toggle");
        header.addEventListener("click", () => {
            const open = tip.classList.toggle("open");
            if (toggle) toggle.textContent = open ? "−" : "+";
        });
    });
}