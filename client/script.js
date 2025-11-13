import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.getElementById('chat_container');
const submitButton = document.querySelector('button[type="submit"]');
const BASE_URL = 'https://aichat-x0q0.onrender.com';

let loadInterval, abortController, isResponding = false;

// ===== Helpers =====
const generateId = () => `id-${Date.now()}-${Math.random().toString(16)}`;
const toggleBtn = on => submitButton.innerHTML = on ? '<svg width="12" height="12"><rect width="12" height="12" rx="2" fill="white"/></svg>' : '<img src="./assets/send.svg" alt="Send" />';
const chatStripe = (isAi, value, id) => `
<div class="wrapper ${isAi && 'ai'}">
  <div class="chat">
    <div class="profile"><img src="${isAi ? bot : user}" alt="${isAi ? 'bot' : 'user'}"/></div>
    <div class="message" id=${id}>${value}</div>
  </div>
</div>`;

// ===== Loader & Typewriter =====
const loader = el => {
  el.textContent = '';
  loadInterval = setInterval(() => {
    el.textContent += '.';
    if (el.textContent === '....') el.textContent = '';
  }, 300);
};

const typeText = (el, html) => {
  el.innerHTML = '';
  let i = 0;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const nodes = Array.from(tempDiv.childNodes);

  const interval = setInterval(() => {
    if (i < nodes.length) el.appendChild(nodes[i++]);
    else clearInterval(interval);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }, 20);
};

// ===== Markdown to HTML =====
const markdownToHTML = text =>
  text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>');

// ===== LocalStorage Chat =====
const loadChatHistory = () => {
  const saved = localStorage.getItem('chatHistory');
  if (saved) {
    chatContainer.innerHTML = saved;
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
};

const saveChatToStorage = () => {
  localStorage.setItem('chatHistory', chatContainer.innerHTML);
};

// Clear chat
const clearChatHistory = () => {
  chatContainer.innerHTML = '';
  localStorage.removeItem('chatHistory');
  const sessionId = localStorage.getItem('chatSessionId');
  if (sessionId)
    fetch(`${BASE_URL}/clear`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
};

// ===== Handle Submit =====
const handleSubmit = async e => {
  e.preventDefault();
  if (isResponding) return abortController?.abort();

  const prompt = new FormData(form).get('prompt')?.trim();
  if (!prompt) return;

  const sessionId = localStorage.getItem('chatSessionId') || (localStorage.setItem('chatSessionId', crypto.randomUUID()), localStorage.getItem('chatSessionId'));
  const id = generateId();

  chatContainer.innerHTML += chatStripe(false, prompt) + chatStripe(true, ' ', id);
  saveChatToStorage();
  chatContainer.scrollTop = chatContainer.scrollHeight;
  form.reset();

  const msgDiv = document.getElementById(id);
  loader(msgDiv); toggleBtn(true); isResponding = true;
  abortController = new AbortController();

  try {
    const res = await fetch(BASE_URL + '/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, sessionId }),
      signal: abortController.signal
    });

    clearInterval(loadInterval);
    msgDiv.textContent = '';

    if (res.ok) {
      const data = await res.json();
      typeText(msgDiv, markdownToHTML(data.bot.trim()));
      saveChatToStorage();
    } else {
      msgDiv.textContent = 'Something went wrong!!!';
    }
  } catch (err) {
    msgDiv.textContent = 'Something went wrong!!!';
    console.error(err);
  } finally {
    toggleBtn(false);
    isResponding = false;
  }
};

// ===== Initialize =====
// In your DOMContentLoaded event:
document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
    
    // Add event listener for the clear button
    document.getElementById('clearChat').addEventListener('click', clearChatHistory);
  });
// ===== Event Listeners =====
form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', e => e.key === 'Enter' && handleSubmit(e));
