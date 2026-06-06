const API = "https://backend-1-9b6f.onrender.com";
const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const params = new URLSearchParams(location.search);
const pendingUserId = params.get("user") || params.get("userId") || "";

const state = {
  me:null,
  myId:localStorage.getItem("userId") || "",
  token:getToken(),
  socket:null,
  conversations:[],
  activeUser:null,
  messages:[],
  selected:null,
  replyTo:null,
  attachment:null,
  filter:"all",
  typingTimer:null
};

function getToken(){
  const role = String(localStorage.getItem("role") || "").toLowerCase();

  return (
    localStorage.getItem(role + "Token") ||
    localStorage.getItem("studentToken") ||
    localStorage.getItem("teacherToken") ||
    localStorage.getItem("schoolToken") ||
    localStorage.getItem("employerToken") ||
    localStorage.getItem("talentToken") ||
    localStorage.getItem("agentToken") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

function authHeaders(extra = {}){
  return {
    ...(state.token ? { Authorization:"Bearer " + state.token } : {}),
    ...extra
  };
}

function esc(value=""){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function api(path, options = {}){
  const res = await fetch(API + path, {
    ...options,
    headers:{
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let data = {};

  try{
    data = text ? JSON.parse(text) : {};
  }catch{
    data = { message:text };
  }

  if(!res.ok){
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function toast(message){
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>{
    el.classList.remove("show");
  },2300);
}

function userName(user){
  return user?.companyName || user?.schoolName || user?.name || "AIFT User";
}

function userImage(user){
  return user?.profileImage || user?.logo || user?.avatar || FALLBACK_AVATAR;
}

function messageSenderId(message){
  return String(message?.sender?._id || message?.sender || "");
}

function messageReceiverId(message){
  return String(message?.receiver?._id || message?.receiver || "");
}

function isMine(message){
  return messageSenderId(message) === String(state.myId);
}

function formatTime(value){
  if(!value) return "";

  const date = new Date(value);
  const now = new Date();

  if(date.toDateString() === now.toDateString()){
    return date.toLocaleTimeString([], {
      hour:"numeric",
      minute:"2-digit"
    });
  }

  return date.toLocaleDateString([], {
    month:"short",
    day:"numeric"
  });
}

function formatDay(value){
  const date = new Date(value);
  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if(date.toDateString() === today.toDateString()) return "Today";
  if(date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], {
    month:"long",
    day:"numeric",
    year:"numeric"
  });
}

function setConversationFilter(filter, btn){
  state.filter = filter;

  document.querySelectorAll(".conversation-tabs button")
    .forEach(item=>item.classList.remove("active"));

  btn?.classList.add("active");

  renderConversations();
}

function showSidebar(){
  document.getElementById("sidebar").classList.remove("hidden-mobile");
}

function hideSidebarOnMobile(){
  if(window.innerWidth <= 980){
    document.getElementById("sidebar").classList.add("hidden-mobile");
  }
}

function showChat(){
  document.getElementById("emptyState").classList.add("hidden");
  document.getElementById("messagesBox").classList.remove("hidden");
}

function showEmpty(){
  document.getElementById("emptyState").classList.remove("hidden");
  document.getElementById("messagesBox").classList.add("hidden");
}

function focusUserSearch(){
  showSidebar();
  setTimeout(()=>{
    document.getElementById("userSearchInput")?.focus();
  },100);
}

function autoGrowTextarea(){
  const input = document.getElementById("messageInput");
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight,130) + "px";
}

async function loadMe(){
  const data = await api("/api/users/me", {
    headers:authHeaders()
  });

  state.me = data.user || data;

  if(state.me?._id){
    state.myId = state.me._id;
    localStorage.setItem("userId", state.me._id);
  }

  if(state.me?.role){
    localStorage.setItem("role", state.me.role);
  }
}

function connectSocket(){
  state.socket = io(API, {
    auth:{ token:state.token }
  });

  state.socket.emit("join", state.myId);

  state.socket.on("newMessage", handleIncomingMessage);

  state.socket.on("typing", payload=>{
    const from = payload?.from || payload?.sender || "";
    if(state.activeUser && String(from) === String(state.activeUser._id)){
      document.getElementById("activeUserStatus").textContent = "Typing...";
    }
  });

  state.socket.on("stopTyping", payload=>{
    const from = payload?.from || payload?.sender || "";
    if(state.activeUser && String(from) === String(state.activeUser._id)){
      document.getElementById("activeUserStatus").textContent = "Online";
    }
  });

  state.socket.on("reactionUpdate", updated=>{
    const index = state.messages.findIndex(m => String(m._id) === String(updated._id));
    if(index !== -1){
      state.messages[index] = updated;
      renderMessages();
    }
  });
}

async function loadConversations(){
  const data = await api("/api/messages", {
    headers:authHeaders()
  });

  state.conversations = Array.isArray(data)
    ? data
    : data.conversations || data.results || [];

  renderConversations();
}

function normalizeConversation(conv){
  const user = conv.user || conv.otherUser || conv.participant || {};
  return {
    ...conv,
    user,
    id:user._id || user.id,
    name:userName(user),
    image:userImage(user),
    last:conv.lastMessage || conv.preview || "Start a conversation",
    date:conv.lastMessageDate || conv.updatedAt || conv.createdAt,
    unread:conv.unread || conv.unreadCount || 0,
    pinned:!!conv.pinned
  };
}

function renderConversations(){
  const box = document.getElementById("conversationList");
  const normalized = state.conversations.map(normalizeConversation);

  let list = normalized.filter(conv => conv.id && String(conv.id) !== String(state.myId));

  if(state.filter === "unread"){
    list = list.filter(conv => Number(conv.unread) > 0);
  }

  if(state.filter === "pinned"){
    list = list.filter(conv => conv.pinned);
  }

  list.sort((a,b)=>{
    if(a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  if(!list.length){
    box.innerHTML = `
      <div class="empty-list">
        No conversations found.
      </div>
    `;
    return;
  }

  box.innerHTML = list.map(conv=>`
    <article
      class="conversation ${state.activeUser && String(state.activeUser._id) === String(conv.id) ? "active" : ""}"
      onclick="openConversation('${esc(conv.id)}')"
    >
      <img src="${esc(conv.image)}" alt="">
      <div class="conversation-main">
        <div class="conversation-top">
          <div class="conversation-name">${esc(conv.name)}</div>
          <div class="conversation-time">${esc(formatTime(conv.date))}</div>
        </div>
        <div class="conversation-preview">${esc(conv.last)}</div>
      </div>
      ${Number(conv.unread) > 0 ? `<span class="unread-dot"></span>` : ""}
    </article>
  `).join("");
}

async function getPublicUser(userId){
  const data = await api(`/api/users/${encodeURIComponent(userId)}/public`, {
    headers:authHeaders()
  });

  return data.user || data.profile || data.employer || data.school || data;
}

async function openConversation(userId, fallbackName = "", fallbackImage = ""){
  try{
    let user = null;

    try{
      user = await getPublicUser(userId);
    }catch{
      const found = state.conversations
        .map(normalizeConversation)
        .find(conv => String(conv.id) === String(userId));

      user = found?.user || {
        _id:userId,
        name:fallbackName || "AIFT User",
        profileImage:fallbackImage || FALLBACK_AVATAR
      };
    }

    state.activeUser = {
      ...user,
      _id:user._id || user.id || userId
    };

    clearSelectedMessage();
    clearReply();
    showChat();
    hideSidebarOnMobile();

    document.getElementById("activeUserName").textContent = userName(state.activeUser);
    document.getElementById("activeUserImage").src = userImage(state.activeUser);
    document.getElementById("activeUserStatus").textContent = "Online";

    renderConversations();

    const messagesData = await api(`/api/messages/${encodeURIComponent(userId)}`, {
      headers:authHeaders()
    });

    state.messages = Array.isArray(messagesData)
      ? messagesData
      : messagesData.messages || [];

    renderMessages();

    try{
      await api(`/api/messages/seen/${encodeURIComponent(userId)}`, {
        method:"PATCH",
        headers:authHeaders()
      });
    }catch{}

    await loadConversations();

  }catch(error){
    toast(error.message || "Unable to open conversation");
  }
}

function renderMessages(){
  const box = document.getElementById("messagesBox");
  box.innerHTML = "";

  if(!state.messages.length){
    box.innerHTML = `<div class="day-divider">No messages yet</div>`;
    return;
  }

  let lastDay = "";

  state.messages.forEach(message=>{
    const day = formatDay(message.createdAt || new Date());

    if(day !== lastDay){
      const divider = document.createElement("div");
      divider.className = "day-divider";
      divider.textContent = day;
      box.appendChild(divider);
      lastDay = day;
    }

    box.appendChild(createMessageNode(message));
  });

  box.scrollTop = box.scrollHeight;
}

function createMessageNode(message){
  const mine = isMine(message);

  const row = document.createElement("div");
  row.className = "message-row " + (mine ? "me" : "other");

  const bubble = document.createElement("article");
  bubble.className = "bubble " + (mine ? "me" : "other");
  bubble.dataset.id = message._id || "";
  bubble.onclick = () => selectMessage(message,bubble);

  bubble.innerHTML = `
    ${replyHtml(message)}
    ${message.text ? `<div class="message-text">${esc(message.text)}</div>` : ""}
    ${fileHtml(message)}
    <div class="message-meta">
      <span>${esc(formatTime(message.createdAt))}</span>
      ${mine ? `<span class="${message.seen ? "status-seen" : ""}">${message.seen ? "Read" : "Sent"}</span>` : ""}
    </div>
  `;

  row.appendChild(bubble);
  return row;
}

function replyHtml(message){
  const reply = message.replyTo;
  if(!reply) return "";

  return `
    <div class="reply-preview">
      <strong>${esc(reply.sender?.name || "Reply")}</strong>
      <span>${esc(reply.text || "Message")}</span>
    </div>
  `;
}

function fileHtml(message){
  const url = message.fileUrl || message.mediaUrl || "";
  const type = message.fileType || message.mediaType || "";

  if(!url) return "";

  if(type.includes("image")){
    return `<img class="message-file" src="${esc(url)}" alt="Attachment">`;
  }

  if(type.includes("video")){
    return `<video class="message-file" src="${esc(url)}" controls></video>`;
  }

  if(type.includes("audio")){
    return `<audio class="message-file" src="${esc(url)}" controls></audio>`;
  }

  return `
    <a class="file-card" href="${esc(url)}" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path></svg>
      <span>Open attachment</span>
    </a>
  `;
}

function selectMessage(message,bubble){
  clearSelectedMessage();

  state.selected = {
    id:message._id,
    text:message.text || "",
    sender:isMine(message) ? "You" : userName(state.activeUser)
  };

  bubble.classList.add("selected");
  document.getElementById("messageActionBar").classList.remove("hidden");
}

function clearSelectedMessage(){
  state.selected = null;
  document.querySelectorAll(".bubble.selected").forEach(el=>el.classList.remove("selected"));
  document.getElementById("messageActionBar")?.classList.add("hidden");
}

function replyToSelected(){
  if(!state.selected) return;

  state.replyTo = {
    id:state.selected.id,
    text:state.selected.text || "Message",
    sender:state.selected.sender || "User"
  };

  document.getElementById("replyTitle").textContent = "Replying to " + state.replyTo.sender;
  document.getElementById("replyText").textContent = state.replyTo.text;
  document.getElementById("replyBar").classList.remove("hidden");

  clearSelectedMessage();
  document.getElementById("messageInput").focus();
}

function clearReply(){
  state.replyTo = null;
  document.getElementById("replyBar").classList.add("hidden");
  document.getElementById("replyText").textContent = "";
}

async function copySelectedMessage(){
  if(!state.selected?.text) return;

  await navigator.clipboard.writeText(state.selected.text);
  clearSelectedMessage();
  toast("Message copied");
}

function deleteSelectedFromView(){
  if(!state.selected?.id) return;

  document.querySelector(`.bubble[data-id="${CSS.escape(state.selected.id)}"]`)
    ?.closest(".message-row")
    ?.remove();

  clearSelectedMessage();
  toast("Message removed from view");
}

function toggleAttachmentMenu(){
  document.getElementById("attachmentMenu").classList.toggle("hidden");
}

function chooseAttachment(type){
  const input = document.getElementById("fileInput");

  if(type === "image") input.accept = "image/*";
  if(type === "video") input.accept = "video/*";
  if(type === "audio") input.accept = "audio/*";
  if(type === "document") input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";

  document.getElementById("attachmentMenu").classList.add("hidden");
  input.click();
}

function renderAttachmentPreview(file){
  const box = document.getElementById("attachmentPreview");

  let preview = "";

  if(file.type.startsWith("image")){
    preview = `<img src="${URL.createObjectURL(file)}" alt="">`;
  }else if(file.type.startsWith("video")){
    preview = `<video src="${URL.createObjectURL(file)}" controls></video>`;
  }else{
    preview = `<strong>${esc(file.name)}</strong>`;
  }

  box.innerHTML = `
    <div class="preview-card">
      ${preview}
      <button onclick="clearAttachment()">Remove</button>
    </div>
  `;

  box.classList.remove("hidden");
}

function clearAttachment(){
  state.attachment = null;
  document.getElementById("fileInput").value = "";
  document.getElementById("attachmentPreview").classList.add("hidden");
  document.getElementById("attachmentPreview").innerHTML = "";
}

async function sendMessage(){
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  const file = state.attachment;

  if(!state.activeUser){
    toast("Select a conversation first");
    return;
  }

  if(!text && !file) return;

  const tempMessage = {
    _id:"temp-" + Date.now(),
    sender:{ _id:state.myId, name:"You" },
    receiver:{ _id:state.activeUser._id },
    text,
    fileUrl:file ? URL.createObjectURL(file) : "",
    fileType:file ? file.type : "",
    createdAt:new Date().toISOString(),
    seen:false,
    replyTo:state.replyTo ? {
      text:state.replyTo.text,
      sender:{ name:state.replyTo.sender }
    } : null
  };

  state.messages.push(tempMessage);
  renderMessages();

  const form = new FormData();
  form.append("receiverId", state.activeUser._id);
  if(text) form.append("text", text);
  if(file) form.append("file", file);
  if(state.replyTo?.id) form.append("replyTo", state.replyTo.id);

  input.value = "";
  input.style.height = "42px";
  clearAttachment();
  clearReply();

  try{
    const saved = await api("/api/messages", {
      method:"POST",
      headers:authHeaders(),
      body:form
    });

    const msg = saved.message || saved;

    const index = state.messages.findIndex(m => m._id === tempMessage._id);
    if(index !== -1){
      state.messages[index] = msg;
      renderMessages();
    }

    await loadConversations();

  }catch(error){
    toast(error.message || "Message failed to send");
  }
}

function handleIncomingMessage(message){
  const senderId = messageSenderId(message);
  const receiverId = messageReceiverId(message);

  const belongsToOpenChat =
    state.activeUser &&
    (
      senderId === String(state.activeUser._id) ||
      receiverId === String(state.activeUser._id)
    );

  if(belongsToOpenChat){
    const exists = state.messages.some(m => String(m._id) === String(message._id));
    if(!exists){
      state.messages.push(message);
      renderMessages();
    }
  }

  loadConversations();
}

async function searchUsers(query){
  if(query.trim().length < 2){
    document.getElementById("searchResults").classList.add("hidden");
    return;
  }

  try{
    const data = await api(`/api/users/network?search=${encodeURIComponent(query)}&limit=8`, {
      headers:authHeaders()
    });

    const users = Array.isArray(data)
      ? data
      : data.users || data.results || [];

    renderSearchResults(users.filter(u => String(u._id || u.id) !== String(state.myId)));

  }catch{
    renderSearchResults([]);
  }
}

function renderSearchResults(users){
  const box = document.getElementById("searchResults");

  if(!users.length){
    box.innerHTML = `<div class="empty-list">No users found.</div>`;
    box.classList.remove("hidden");
    return;
  }

  box.innerHTML = users.map(user=>`
    <article class="conversation" onclick="selectSearchUser('${esc(user._id || user.id)}')">
      <img src="${esc(userImage(user))}" alt="">
      <div class="conversation-main">
        <div class="conversation-name">${esc(userName(user))}</div>
        <div class="conversation-preview">${esc(user.headline || user.profession || user.role || "AIFT member")}</div>
      </div>
    </article>
  `).join("");

  box.classList.remove("hidden");
}

async function selectSearchUser(userId){
  document.getElementById("searchResults").classList.add("hidden");
  document.getElementById("userSearchInput").value = "";
  await openConversation(userId);
}

function startAudioCall(){
  toast("Audio call UI is ready. Backend WebRTC signaling must be enabled for production calls.");
}

function startVideoCall(){
  toast("Video call UI is ready. Backend WebRTC signaling must be enabled for production calls.");
}

function openChatInfo(){
  if(!state.activeUser){
    toast("Select a conversation first");
    return;
  }

  const url = profileUrl(state.activeUser);
  location.href = url;
}

function profileUrl(user){
  const id = user?._id || user?.id;
  const role = String(user?.role || "").toLowerCase();

  if(role === "student") return `student-public-profile.html?id=${encodeURIComponent(id)}`;
  if(role === "teacher") return `teacher-public-profile.html?id=${encodeURIComponent(id)}`;
  if(role === "school") return `school-public-profile.html?id=${encodeURIComponent(id)}`;
  if(role === "employer") return `employer-public-profile.html?id=${encodeURIComponent(id)}`;
  return `agent-public-profile.html?id=${encodeURIComponent(id)}`;
}

function bindEvents(){
  const input = document.getElementById("messageInput");

  input.addEventListener("input", ()=>{
    autoGrowTextarea();

    if(state.activeUser && state.socket){
      state.socket.emit("typing", { to:state.activeUser._id });

      clearTimeout(state.typingTimer);
      state.typingTimer = setTimeout(()=>{
        state.socket.emit("stopTyping", { to:state.activeUser._id });
      },900);
    }
  });

  input.addEventListener("keydown", event=>{
    if(event.key === "Enter" && !event.shiftKey){
      event.preventDefault();
      sendMessage();
    }
  });

  document.getElementById("fileInput").addEventListener("change", event=>{
    const file = event.target.files?.[0];
    if(!file) return;
    state.attachment = file;
    renderAttachmentPreview(file);
  });

  let searchTimer = null;
  document.getElementById("userSearchInput").addEventListener("input", event=>{
    clearTimeout(searchTimer);
    searchTimer = setTimeout(()=>{
      searchUsers(event.target.value);
    },260);
  });

  document.addEventListener("click", event=>{
    const search = document.querySelector(".sidebar-header");
    if(search && !search.contains(event.target)){
      document.getElementById("searchResults").classList.add("hidden");
    }

    if(!event.target.closest(".attachment-menu") && !event.target.closest(".composer-btn")){
      document.getElementById("attachmentMenu").classList.add("hidden");
    }

    if(!event.target.closest(".bubble") && !event.target.closest(".message-action-bar")){
      clearSelectedMessage();
    }
  });
}

async function init(){
  if(!state.token){
    location.href = "login.html";
    return;
  }

  bindEvents();

  try{
    await loadMe();
    connectSocket();
    await loadConversations();

    if(pendingUserId){
      await openConversation(pendingUserId);
    }else{
      showEmpty();
    }

  }catch(error){
    toast(error.message || "Unable to load messages");
  }
}

init();
