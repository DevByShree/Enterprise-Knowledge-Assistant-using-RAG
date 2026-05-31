/* ============================================================
   RAG Chat UI — app.js
   ============================================================
   Connect your RAG backend by replacing the `fetchRAGResponse`
   function below with your actual API call.
   ============================================================ */

// ── DOM refs ──────────────────────────────────────────────────
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarOpen   = document.getElementById('sidebar-open');
const newChatBtn    = document.getElementById('new-chat-btn');
const historyList   = document.getElementById('history-list');
const emptyState    = document.getElementById('empty-state');
const messagesEl    = document.getElementById('messages');
const userInput     = document.getElementById('user-input');
const sendBtn       = document.getElementById('send-btn');

// ── State ─────────────────────────────────────────────────────
let chatHistory = [];
let isLoading   = false;

// ── Sidebar toggle ────────────────────────────────────────────
sidebarToggle.addEventListener('click', () => {
  const isCollapsed = sidebar.classList.toggle('collapsed');
  sidebarOpen.style.display = isCollapsed ? 'flex' : 'none';
  sidebarToggle.querySelector('i').className = isCollapsed
    ? 'ti ti-layout-sidebar-left-expand'
    : 'ti ti-layout-sidebar-left-collapse';
});

sidebarOpen.addEventListener('click', () => {
  // mobile: toggle open
  if (window.innerWidth <= 640) {
    sidebar.classList.toggle('mobile-open');
  } else {
    sidebar.classList.remove('collapsed');
    sidebarOpen.style.display = 'none';
    sidebarToggle.querySelector('i').className = 'ti ti-layout-sidebar-left-collapse';
  }
});

// ── History item clicks ───────────────────────────────────────
historyList.addEventListener('click', (e) => {
  const item = e.target.closest('.history-item');
  if (!item) return;
  document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
  item.classList.add('active');
});

// ── New chat ──────────────────────────────────────────────────
newChatBtn.addEventListener('click', resetChat);

function resetChat() {
  chatHistory = [];
  messagesEl.innerHTML = '';
  messagesEl.classList.remove('visible');
  emptyState.style.display = 'flex';
  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;
}

// ── Suggestion chips ──────────────────────────────────────────
document.querySelectorAll('.suggestion-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const prompt = chip.dataset.prompt;
    userInput.value = prompt;
    sendBtn.disabled = false;
    sendMessage();
  });
});

// ── Input handling ────────────────────────────────────────────
userInput.addEventListener('input', () => {
  sendBtn.disabled = userInput.value.trim() === '';
  autoResize(userInput);
});

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 140) + 'px';
}

// ── Show messages view ────────────────────────────────────────
function showMessagesView() {
  emptyState.style.display = 'none';
  messagesEl.classList.add('visible');
}

// ── Send message ──────────────────────────────────────────────
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isLoading) return;

  showMessagesView();
  appendUserMessage(text);
  chatHistory.push({ role: 'user', content: text });

  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;
  isLoading = true;

  const typingId = appendTyping();

  try {
    const response = await fetchRAGResponse(text, chatHistory);
    removeTyping(typingId);
    appendAIMessage(response.answer, response.sources);
    chatHistory.push({ role: 'assistant', content: response.answer });
    addToHistory(text);
  } catch (err) {
    removeTyping(typingId);
    appendAIMessage('Something went wrong. Please check your RAG backend connection.', []);
    console.error('RAG error:', err);
  }

  isLoading = false;
  sendBtn.disabled = userInput.value.trim() === '';
}

// ── DOM builders ──────────────────────────────────────────────
function appendUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'msg-row user';
  row.innerHTML = `
    <div class="msg-avatar user-avatar">SJ</div>
    <div class="bubble">${escapeHtml(text)}</div>
  `;
  messagesEl.appendChild(row);
  scrollToBottom();
}

function appendAIMessage(text, sources = []) {
  const row = document.createElement('div');
  row.className = 'msg-row ai';

  const sourcesHtml = sources.length
    ? `<div class="source-tags">
        ${sources.map(s => `
          <span class="source-tag">
            <i class="ti ti-file-text"></i>${escapeHtml(s)}
          </span>`).join('')}
       </div>`
    : '';

  const actionsHtml = `
    <div class="msg-actions">
      <button class="action-btn copy-btn"><i class="ti ti-copy"></i> Copy</button>
      <button class="action-btn thumb-btn"><i class="ti ti-thumb-up"></i></button>
      <button class="action-btn thumb-btn"><i class="ti ti-thumb-down"></i></button>
    </div>`;

  row.innerHTML = `
    <div class="msg-avatar ai-avatar"><i class="ti ti-brain"></i></div>
    <div class="bubble">
      <div class="bubble-text">${formatText(text)}</div>
      ${sourcesHtml}
      ${actionsHtml}
    </div>
  `;

  // Copy button
  row.querySelector('.copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(text).catch(() => {});
    const btn = row.querySelector('.copy-btn');
    btn.innerHTML = '<i class="ti ti-check"></i> Copied';
    setTimeout(() => { btn.innerHTML = '<i class="ti ti-copy"></i> Copy'; }, 1800);
  });

  messagesEl.appendChild(row);
  scrollToBottom();
}

function appendTyping() {
  const id = 'typing-' + Date.now();
  const row = document.createElement('div');
  row.className = 'msg-row ai';
  row.id = id;
  row.innerHTML = `
    <div class="msg-avatar ai-avatar"><i class="ti ti-brain"></i></div>
    <div class="bubble">
      <div class="typing-bubble">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>
  `;
  messagesEl.appendChild(row);
  scrollToBottom();
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function addToHistory(text) {
  const item = document.createElement('div');
  item.className = 'history-item active';
  item.innerHTML = `<i class="ti ti-message"></i><span>${escapeHtml(text.slice(0, 32))}${text.length > 32 ? '…' : ''}</span>`;
  document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
  historyList.insertBefore(item, historyList.firstChild);
  item.addEventListener('click', () => {
    document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
}

// ── Helpers ───────────────────────────────────────────────────
function scrollToBottom() {
  const area = document.getElementById('chat-area');
  requestAnimationFrame(() => { area.scrollTop = area.scrollHeight; });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatText(text) {
  // basic markdown: **bold**, `code`, newlines
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code style="font-family:var(--font-mono);font-size:12px;background:var(--bg-secondary);padding:1px 5px;border-radius:4px;">$1</code>')
    .replace(/\n/g, '<br>');
}

// ── ✅ YOUR RAG BACKEND — replace this function ───────────────
// Expected return: { answer: string, sources: string[] }
// ─────────────────────────────────────────────────────────────
async function fetchRAGResponse(query, history) {
  
  // ── EXAMPLE: connect to your RAG FastAPI backend ──
  const res = await fetch('http://127.0.0.1:8000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, history })
  });
  if (!res.ok) throw new Error('API error ' + res.status);
  const data = await res.json();
  return { answer: data.answer, sources: data.sources || [] };
  

  // ── DEMO responses (remove once backend is connected) ─────
  await new Promise(r => setTimeout(r, 1100 + Math.random() * 600));

  const demos = [
    {
      answer: 'RAG (Retrieval-Augmented Generation) works in two stages:\n\n1. **Retrieval** — your query is embedded using `all-MiniLM-L6-v2` and compared against stored vectors in ChromaDB using cosine similarity.\n2. **Generation** — the top-k relevant chunks are passed as context to `llama3.2:3b`, which generates a grounded answer.',
      sources: ['rag_notes.pdf', 'langchain_docs.pdf']
    },
    {
      answer: 'Your knowledge base currently contains documents on LangChain, ChromaDB, Ollama, and vector embeddings. The most referenced topic is **semantic similarity search**.',
      sources: ['kb_index.pdf']
    },
    {
      answer: 'Found 4 relevant passages. The `all-MiniLM-L6-v2` model encodes your query into a **384-dimensional vector**, compared against stored embeddings. Chunks with similarity > 0.75 are included as context.',
      sources: ['embeddings_guide.pdf', 'model_notes.txt']
    },
    {
      answer: 'ChromaDB stores embeddings in-memory or on disk and supports metadata filtering. FAISS is faster for large-scale similarity search but requires more manual management. For your RAG project, ChromaDB is the simpler choice.',
      sources: ['vector_db_comparison.pdf']
    }
  ];

  return demos[Math.floor(Math.random() * demos.length)];
}