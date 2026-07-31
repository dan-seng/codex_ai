import "bootstrap-icons/font/bootstrap-icons.css";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import DOMPurify from "dompurify";
import { marked } from "marked";

const form = document.getElementById("chat-form");
const chatContainer = document.getElementById("chat_container");
const welcome = document.getElementById("welcome");
const submitButton = document.getElementById("sendBtn");
const promptInput = form.querySelector("textarea");
const suggestions = document.getElementById("suggestions");
const historyList = document.getElementById("historyList");
const newChatBtn = document.getElementById("newChat");
const clearChatBtn = document.getElementById("clearChat");
const themeToggle = document.getElementById("themeToggle");
const openSidebarBtn = document.getElementById("openSidebar");
const closeSidebarBtn = document.getElementById("closeSidebar");
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const topbarTitle = document.getElementById("topbarTitle");

const STORE_KEY = "jarvis.conversations.v1";
const ACTIVE_KEY = "jarvis.activeConv.v1";
const THEME_KEY = "jarvis.theme";

const BASE_URL = (
  import.meta.env.VITE_CHAT_URL || import.meta.env.LOCAL_URL
).replace(/\/+$/, "");

const SUGGESTIONS = [
  {
    icon: "bi-person-fill",
    title: "Who developed you?",
    sub: "Meet your creator",
    prompt: "Who developed you?",
  },
  {
    icon: "bi-geo-alt-fill",
    title: "Where does he live?",
    sub: "Across the world",
    prompt: "Where does he live?",
  },
  {
    icon: "bi-code-slash",
    title: "What tech stack?",
    sub: "Frameworks & tools",
    prompt: "What tech stack does he use?",
  },
  {
    icon: "bi-lightning-charge-fill",
    title: "Tell me about him",
    sub: "A quick intro",
    prompt: "Tell me about him",
  },
];

marked.setOptions({ gfm: true, breaks: true });

let conversations = loadConversations();
let activeId = loadActiveId() || conversations[0]?.id || null;
let isResponding = false;
let abortController = null;
let typingInterval = null;
let resolveTyping = null;
let activeMessageDiv = null;

// ===== Persistence =====
function loadConversations() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveConversations() {
  localStorage.setItem(STORE_KEY, JSON.stringify(conversations));
}

function loadActiveId() {
  return localStorage.getItem(ACTIVE_KEY);
}

function saveActiveId() {
  localStorage.setItem(ACTIVE_KEY, activeId);
}

function getActive() {
  return conversations.find((c) => c.id === activeId) || null;
}

function makeId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ===== Theme =====
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme =
    saved ||
    (window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark");
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const next =
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "light"
      : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  themeToggle.querySelector("i").className =
    theme === "dark" ? "bi bi-moon-stars" : "bi bi-sun";
}

// ===== Markdown helpers =====
const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const formatMath = (text) =>
  text
    .replace(
      /\$\$([\s\S]+?)\$\$/g,
      (_, expr) => `\n<div class="equation-block">${escapeHtml(expr.trim())}</div>\n`,
    )
    .replace(
      /(^|[^\$])\$([^\n$]+)\$/g,
      (_, prefix, expr) =>
        `${prefix}<span class="equation-inline">${escapeHtml(expr.trim())}</span>`,
    );

function renderMarkdown(text) {
  return DOMPurify.sanitize(marked.parse(formatMath(text)));
}

function timeLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

function flashCopyBtn(btn) {
  btn.classList.add("done");
  const icon = btn.querySelector("i");
  const original = icon.className;
  icon.className = "bi bi-check2";
  setTimeout(() => {
    icon.className = original;
    btn.classList.remove("done");
  }, 1600);
}

// ===== Rendering =====
function avatarHtml(role) {
  return role === "ai"
    ? '<span class="avatar ai"><i class="bi bi-lightning-charge-fill"></i></span>'
    : '<span class="avatar user"><i class="bi bi-person-fill"></i></span>';
}

function enhanceCodeBlocks(root) {
  root.querySelectorAll("pre").forEach((pre) => {
    if (pre.dataset.enhanced) return;
    pre.dataset.enhanced = "1";
    const code = pre.querySelector("code");
    const match = (code?.className || "").match(/language-([\w+-]+)/);
    const lang = match ? match[1] : "text";

    const head = document.createElement("div");
    head.className = "code-head";
    const label = document.createElement("span");
    label.textContent = lang;
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "copy-code";
    copy.title = "Copy code";
    copy.innerHTML = '<i class="bi bi-clipboard"></i>';
    copy.addEventListener("click", async () => {
      await copyText(code.innerText);
      flashCopyBtn(copy);
    });

    head.append(label, copy);
    pre.prepend(head);
  });
}

function attachCopyBtn(meta, text) {
  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "copy-btn";
  copyBtn.title = "Copy message";
  copyBtn.innerHTML = '<i class="bi bi-copy"></i> Copy';
  copyBtn.addEventListener("click", async () => {
    await copyText(text);
    const icon = copyBtn.querySelector("i");
    icon.className = "bi bi-check2";
    copyBtn.classList.add("done");
    copyBtn.lastChild.textContent = " Copied";
    setTimeout(() => {
      icon.className = "bi bi-copy";
      copyBtn.classList.remove("done");
      copyBtn.lastChild.textContent = " Copy";
    }, 1600);
  });
  meta.appendChild(copyBtn);
}

function appendMessage(role, text, { animate = true } = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = `msg ${role}`;
  wrapper.style.animation = animate ? "" : "none";

  const col = document.createElement("div");
  col.className = "msg-col";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `<span class="time">${timeLabel()}</span>`;
  col.append(bubble, meta);

  wrapper.innerHTML = avatarHtml(role);
  wrapper.appendChild(col);

  if (role === "user") {
    bubble.innerHTML = escapeHtml(text).replaceAll("\n", "<br/>");
  } else if (text) {
    bubble.innerHTML = renderMarkdown(text);
    enhanceCodeBlocks(bubble);
    attachCopyBtn(meta, text);
  }

  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return bubble;
}

function renderThread() {
  chatContainer.innerHTML = "";
  const conv = getActive();

  if (!conv || !conv.messages.length) {
    welcome.classList.remove("hidden");
    chatContainer.classList.add("hidden");
    topbarTitle.textContent = "New chat";
    return;
  }

  welcome.classList.add("hidden");
  chatContainer.classList.remove("hidden");
  topbarTitle.textContent = conv.title;

  conv.messages.forEach((m) => {
    if (m.role === "user" || m.text) appendMessage(m.role, m.text, { animate: false });
  });
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function renderSidebar() {
  historyList.innerHTML = "";
  conversations.forEach((conv) => {
    const item = document.createElement("div");
    item.className = `history-item${conv.id === activeId ? " active" : ""}`;
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.setAttribute(
      "aria-label",
      `Open chat: ${conv.title === "New chat" ? "New chat" : conv.title}`,
    );
    item.innerHTML = `<i class="bi bi-chat-left-text"></i><span class="history-title">${escapeHtml(conv.title)}</span>`;

    const del = document.createElement("button");
    del.className = "history-del";
    del.title = "Delete chat";
    del.setAttribute("aria-label", `Delete chat: ${conv.title}`);
    del.innerHTML = '<i class="bi bi-trash3"></i>';
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteConversation(conv.id);
    });

    item.appendChild(del);
    item.addEventListener("click", () => switchConversation(conv.id));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        switchConversation(conv.id);
      }
    });
    historyList.appendChild(item);
  });
}

function renderSuggestions() {
  suggestions.innerHTML = SUGGESTIONS.map(
    (s, i) => `
    <button class="suggestion" type="button" style="animation-delay:${i * 0.06}s" data-prompt="${escapeHtml(s.prompt)}">
      <span class="suggestion-tile"><i class="bi ${s.icon}"></i></span>
      <span class="suggestion-body">
        <b>${escapeHtml(s.title)}</b>
        <span>${escapeHtml(s.sub)}</span>
      </span>
    </button>`,
  ).join("");
}

// ===== Conversation actions =====
function newConversation() {
  const conv = {
    id: makeId(),
    title: "New chat",
    createdAt: Date.now(),
    messages: [],
  };
  conversations.unshift(conv);
  activeId = conv.id;
  saveConversations();
  saveActiveId();
  renderSidebar();
  renderThread();
  closeSidebar();
  promptInput.focus();
}

function switchConversation(id) {
  activeId = id;
  saveActiveId();
  renderSidebar();
  renderThread();
  closeSidebar();
}

function deleteConversation(id) {
  conversations = conversations.filter((c) => c.id !== id);
  saveConversations();
  if (activeId === id) {
    activeId = conversations[0]?.id || null;
    saveActiveId();
  }
  if (!conversations.length) newConversation();
  else {
    renderSidebar();
    renderThread();
  }
}

function clearCurrentChat() {
  const conv = getActive();
  if (!conv) return;
  conv.messages = [];
  conv.title = "New chat";
  saveConversations();
  renderSidebar();
  renderThread();
}

// ===== Typing / loader =====
function loader(el) {
  el.innerHTML = `
    <span class="typing-indicator" aria-label="Assistant is thinking">
      <span></span><span></span><span></span>
    </span>`;
}

function stopTyping() {
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
}

function typeResponse(el, text) {
  return new Promise((resolve) => {
    stopTyping();
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
        stopTyping();
        el.classList.remove("streaming");
        el.innerHTML = renderMarkdown(text);
        enhanceCodeBlocks(el);
        attachCopyBtn(el.closest(".msg-col").querySelector(".meta"), text);
        resolve();
      }
    };

    resolveTyping = resolve;
    typingInterval = setInterval(step, 16);
  });
}

// ===== Send flow =====
function setResponding(on) {
  isResponding = on;
  submitButton.classList.toggle("responding", on);
  submitButton.querySelector("i").className = on
    ? "bi bi-stop-fill"
    : "bi bi-arrow-up";
  submitButton.setAttribute(
    "aria-label",
    on ? "Stop responding" : "Send message",
  );
  suggestions
    .querySelectorAll(".suggestion")
    .forEach((b) => (b.disabled = on));
}

const sendPrompt = async (rawPrompt) => {
  if (isResponding) {
    abortController?.abort();
    stopTyping();
    return;
  }

  const prompt = rawPrompt?.trim();
  if (!prompt) return;

  let conv = getActive();
  if (!conv) newConversation();
  conv = getActive();

  if (conv.title === "New chat") {
    conv.title =
      prompt.length > 32 ? `${prompt.slice(0, 32).trimEnd()}…` : prompt;
    topbarTitle.textContent = conv.title;
  }
  if (!conv.messages.length) {
    welcome.classList.add("hidden");
    chatContainer.classList.remove("hidden");
  }

  const userBubble = appendMessage("user", prompt);
  conv.messages.push({ role: "user", text: prompt });
  conv.messages.push({ role: "ai", text: "" });
  saveConversations();
  renderSidebar();

  form.reset();
  promptInput.style.height = "2.6rem";

  const msgDiv = appendMessage("ai", "");
  loader(msgDiv);
  setResponding(true);
  abortController = new AbortController();

  try {
    const res = await fetch(`${BASE_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, sessionId: conv.id }),
      signal: abortController.signal,
    });

    msgDiv.textContent = "";
    if (res.ok) {
      const data = await res.json();
      const text = (data.bot || "").trim();
      if (text) {
        await typeResponse(msgDiv, text);
      } else {
        msgDiv.textContent = "I didn't get a response. Try again?";
      }
      conv.messages[conv.messages.length - 1].text = text;
    } else {
      msgDiv.textContent = "Something went wrong. Please try again.";
      conv.messages[conv.messages.length - 1].text = msgDiv.textContent;
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      msgDiv.textContent = "Something went wrong. Please try again.";
      conv.messages[conv.messages.length - 1].text = msgDiv.textContent;
      console.error(err);
    }
  } finally {
    stopTyping();
    saveConversations();
    setResponding(false);
  }
};

// ===== Sidebar mobile =====
function openSidebar() {
  sidebar.classList.add("open");
  sidebarBackdrop.classList.add("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarBackdrop.classList.remove("show");
}

// ===== Composer =====
function resizePromptInput() {
  promptInput.style.height = "auto";
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, 200)}px`;
}

// ===== Init =====
initTheme();
renderSuggestions();
renderSidebar();

if (getActive()) {
  renderThread();
} else {
  newConversation();
}

newChatBtn.addEventListener("click", newConversation);
clearChatBtn.addEventListener("click", clearCurrentChat);
themeToggle.addEventListener("click", toggleTheme);
openSidebarBtn.addEventListener("click", openSidebar);
closeSidebarBtn.addEventListener("click", closeSidebar);
sidebarBackdrop.addEventListener("click", closeSidebar);

suggestions.addEventListener("click", async (e) => {
  const chip = e.target.closest(".suggestion");
  if (!chip) return;
  await sendPrompt(chip.dataset.prompt || "");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const prompt = new FormData(form).get("prompt");
  await sendPrompt(prompt);
});

promptInput.addEventListener("input", resizePromptInput);

form.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    newConversation();
  }
  if (e.key === "Escape" && sidebar.classList.contains("open")) {
    closeSidebar();
  }
});
