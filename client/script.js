import "bootstrap-icons/font/bootstrap-icons.css";
import DOMPurify from "dompurify";
import { marked } from "marked";

const form = document.querySelector("form");
const chatContainer = document.getElementById("chat_container");
const submitButton = document.querySelector('button[type="submit"]');
const promptInput = form.querySelector('textarea[name="prompt"]');
const quickActions = document.getElementById("quick_actions");
const BASE_URL = "http://localhost:5000/";
//const BASE_URL = "https://aichat-x0q0.onrender.com";

let abortController,
  isResponding = false;
let typingInterval = null;
let resolveTyping = null;
let activeMessageDiv = null;
const COMMON_QUESTIONS = [
  "Who developed you?",
  "What can you do?",
  "How do I clear this chat?",
  "Can you access real-time information?",
];

marked.setOptions({
  gfm: true,
  breaks: true,
});

// ===== Helpers =====
const generateId = () => `id-${Date.now()}-${Math.random().toString(16)}`;
const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const toggleBtn = (on) =>
  (submitButton.innerHTML = on
    ? '<i class="bi bi-stop-fill"></i>'
    : '<i class="bi bi-send-fill"></i>');
const toggleQuickActions = (disabled) => {
  quickActions
    ?.querySelectorAll(".quick-chip")
    .forEach((btn) => (btn.disabled = disabled));
};
const chatStripe = (isAi, value, id) => `
<div class="wrapper ${isAi ? "ai" : "user"}">
  <div class="chat">
    <div class="profile"><i class="bi ${isAi ? "bi-robot" : "bi-person-fill"}"></i></div>
    <div class="message"${id ? ` id="${id}"` : ""}>${isAi ? value : escapeHtml(value).replaceAll("\n", "<br/>")}</div>
  </div>
</div>`;

// ===== Loader & Typewriter =====
const loader = (el) => {
  el.innerHTML = `
    <span class="typing-indicator" aria-label="Assistant is typing">
      <span></span><span></span><span></span>
    </span>
  `;
};

const stopTypingAnimation = () => {
  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
  }
  if (resolveTyping) {
    resolveTyping();
    resolveTyping = null;
  }
  if (activeMessageDiv) {
    activeMessageDiv.classList.remove("streaming");
    activeMessageDiv = null;
  }
};

const formatMath = (text) =>
  text
    .replace(
      /\$\$([\s\S]+?)\$\$/g,
      (_, expr) =>
        `\n<div class="equation-block">${escapeHtml(expr.trim())}</div>\n`,
    )
    .replace(
      /(^|[^\$])\$([^\n$]+)\$/g,
      (_, prefix, expr) =>
        `${prefix}<span class="equation-inline">${escapeHtml(expr.trim())}</span>`,
    );

const renderResponse = (el, text) => {
  const safeHtml = DOMPurify.sanitize(marked.parse(formatMath(text)));
  el.innerHTML = safeHtml;
  chatContainer.scrollTop = chatContainer.scrollHeight;
};

const typeResponse = (el, text) =>
  new Promise((resolve) => {
    stopTypingAnimation();
    activeMessageDiv = el;
    el.classList.add("streaming");
    el.textContent = "";

    const chars = Array.from(text);
    let i = 0;
    const step = () => {
      const chunkSize = chars[i] === "\n" ? 1 : 2;
      i = Math.min(i + chunkSize, chars.length);
      el.textContent = chars.slice(0, i).join("");
      chatContainer.scrollTop = chatContainer.scrollHeight;

      if (i >= chars.length) {
        stopTypingAnimation();
        renderResponse(el, text);
        resolve();
      }
    };

    resolveTyping = resolve;
    typingInterval = setInterval(step, 16);
  });

// ===== LocalStorage Chat =====
const loadChatHistory = () => {
  const saved = localStorage.getItem("chatHistory");
  if (saved) {
    chatContainer.innerHTML = saved;
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
};

const saveChatToStorage = () => {
  localStorage.setItem("chatHistory", chatContainer.innerHTML);
};

const resizePromptInput = () => {
  promptInput.style.height = "auto";
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, 180)}px`;
};

const renderQuickActions = () => {
  if (!quickActions) return;
  quickActions.innerHTML = COMMON_QUESTIONS.map(
    (q) => `<button class="quick-chip" type="button" data-prompt="${escapeHtml(q)}">${escapeHtml(q)}</button>`,
  ).join("");
};

// Clear chat
const clearChatHistory = () => {
  chatContainer.innerHTML = "";
  localStorage.removeItem("chatHistory");
  const sessionId = localStorage.getItem("chatSessionId");
  if (sessionId)
    fetch(`${BASE_URL}/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
};

// ===== Handle Submit =====
const sendPrompt = async (rawPrompt) => {
  if (isResponding) {
    abortController?.abort();
    stopTypingAnimation();
    return;
  }

  const prompt = rawPrompt?.trim();
  if (!prompt) return;

  const sessionId =
    localStorage.getItem("chatSessionId") ||
    (localStorage.setItem("chatSessionId", crypto.randomUUID()),
    localStorage.getItem("chatSessionId"));
  const id = generateId();

  chatContainer.innerHTML +=
    chatStripe(false, prompt) + chatStripe(true, " ", id);
  saveChatToStorage();
  chatContainer.scrollTop = chatContainer.scrollHeight;
  form.reset();
  promptInput.style.height = "48px";

  const msgDiv = document.getElementById(id);
  loader(msgDiv);
  toggleBtn(true);
  toggleQuickActions(true);
  isResponding = true;
  abortController = new AbortController();

  try {
    const res = await fetch(BASE_URL + "/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, sessionId }),
      signal: abortController.signal,
    });

    msgDiv.textContent = "";

    if (res.ok) {
      const data = await res.json();
      await typeResponse(msgDiv, data.bot.trim());
      saveChatToStorage();
    } else {
      msgDiv.textContent = "Something went wrong!!!";
    }
  } catch (err) {
    msgDiv.textContent = "Something went wrong!!!";
    console.error(err);
  } finally {
    toggleBtn(false);
    toggleQuickActions(false);
    isResponding = false;
  }
};

const handleSubmit = async (e) => {
  e?.preventDefault();
  const prompt = new FormData(form).get("prompt");
  await sendPrompt(prompt);
};

// ===== Initialize =====
// In your DOMContentLoaded event:
document.addEventListener("DOMContentLoaded", () => {
  loadChatHistory();
  resizePromptInput();
  renderQuickActions();

  // Add event listener for the clear button
  document
    .getElementById("clearChat")
    .addEventListener("click", clearChatHistory);

  quickActions?.addEventListener("click", async (e) => {
    const chip = e.target.closest(".quick-chip");
    if (!chip) return;
    await sendPrompt(chip.dataset.prompt || "");
  });
});
// ===== Event Listeners =====
form.addEventListener("submit", handleSubmit);
promptInput.addEventListener("input", resizePromptInput);
form.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSubmit(e);
  }
});
