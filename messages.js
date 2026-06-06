const API = "https://backend-1-9b6f.onrender.com";

const FALLBACK_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const params =
  new URLSearchParams(window.location.search);

const initialUserId =
  params.get("user") ||
  params.get("userId") ||
  "";

const initialConversationId =
  params.get("conversation") ||
  params.get("conversationId") ||
  "";

const state = {
  token:"",
  role:"",
  me:null,
  myId:"",
  socket:null,

  conversations:[],
  filteredConversations:[],
  activeConversation:null,
  activeOtherUser:null,
  messages:[],

  onlineUsers:new Map(),

  conversationFilter:"all",
  conversationSearch:"",
  userSearchTimer:null,
  conversationSearchTimer:null,

  selectedMessage:null,
  replyTo:null,
  attachment:null,

  typingTimer:null,
  isSending:false,
  isLoadingMessages:false,
  messagesPageBefore:null,
  hasMoreMessages:true,

  confirmCallback:null
};

/* =========================
   AUTH
========================= */

function getRole(){
  return String(localStorage.getItem("role") || "").toLowerCase();
}

function getToken(){
  const role = getRole();

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

function requireAuth(){
  state.role = getRole();
  state.token = getToken();

  if(!state.token){
    window.location.href =
      "login.html?next=" +
      encodeURIComponent(
        "messages.html" + window.location.search
      );

    return false;
  }

  return true;
}

function authHeaders(extra = {}){
  return {
    ...(state.token
      ? { Authorization:"Bearer " + state.token }
      : {}),
    ...extra
  };
}

/* =========================
   SAFE HELPERS
========================= */

function esc(value = ""){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function cleanText(value = ""){
  return String(value ?? "").trim();
}

function getId(value){
  if(!value) return "";

  if(typeof value === "string"){
    return value;
  }

  return value._id || value.id || "";
}

function userDisplayName(user = {}){
  return (
    user.companyName ||
    user.schoolName ||
    user.name ||
    "AIFT User"
  );
}

function userAvatar(user = {}){
  return (
    user.profileImage ||
    user.logo ||
    user.avatar ||
    FALLBACK_AVATAR
  );
}

function userSubtitle(user = {}){
  return (
    user.headline ||
    user.profession ||
    user.course ||
    user.role ||
    "AIFT member"
  );
}

function readableRole(role = ""){
  const r = String(role).toLowerCase();

  if(r === "talent") return "Job Seeker";
  if(r === "student") return "Student";
  if(r === "teacher") return "Teacher";
  if(r === "employer") return "Employer";
  if(r === "school") return "School";
  if(r === "agent") return "Recruiter";
  if(r === "admin") return "Admin";

  return "AIFT Member";
}

function profileUrl(user = {}){
  const id = getId(user);
  const role = String(user.role || "").toLowerCase();

  if(!id) return "home.html";

  if(role === "student"){
    return `student-public-profile.html?id=${encodeURIComponent(id)}`;
  }

  if(role === "teacher"){
    return `teacher-public-profile.html?id=${encodeURIComponent(id)}`;
  }

  if(role === "school"){
    return `school-public-profile.html?id=${encodeURIComponent(id)}`;
  }

  if(role === "employer"){
    return `employer-public-profile.html?id=${encodeURIComponent(id)}`;
  }

  return `agent-public-profile.html?id=${encodeURIComponent(id)}`;
}

function formatTime(value){
  if(!value) return "";

  const date = new Date(value);

  if(Number.isNaN(date.getTime())){
    return "";
  }

  const now = new Date();

  if(date.toDateString() === now.toDateString()){
    return date.toLocaleTimeString([],{
      hour:"numeric",
      minute:"2-digit"
    });
  }

  return date.toLocaleDateString([],{
    month:"short",
    day:"numeric"
  });
}

function formatMessageTime(value){
  if(!value) return "";

  const date = new Date(value);

  if(Number.isNaN(date.getTime())){
    return "";
  }

  return date.toLocaleTimeString([],{
    hour:"numeric",
    minute:"2-digit"
  });
}

function formatDay(value){
  const date = new Date(value || Date.now());

  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if(date.toDateString() === today.toDateString()){
    return "Today";
  }

  if(date.toDateString() === yesterday.toDateString()){
    return "Yesterday";
  }

  return date.toLocaleDateString([],{
    month:"long",
    day:"numeric",
    year:"numeric"
  });
}

function fileSize(bytes = 0){
  const size = Number(bytes || 0);

  if(size < 1024) return size + " B";
  if(size < 1024 * 1024) return Math.round(size / 1024) + " KB";

  return (size / (1024 * 1024)).toFixed(1) + " MB";
}

/* =========================
   API HELPER
========================= */

async function api(path, options = {}){
  const response =
    await fetch(API + path,{
      ...options,
      headers:{
        ...(options.headers || {})
      }
    });

  const text =
    await response.text();

  let data = {};

  try{
    data =
      text
        ? JSON.parse(text)
        : {};
  }catch{
    data = {
      message:text
    };
  }

  if(!response.ok){
    throw new Error(
      data.message ||
      "Request failed"
    );
  }

  return data;
}

async function apiJSON(path, method = "GET", body = null){
  return api(path,{
    method,
    headers:authHeaders({
      "Content-Type":"application/json"
    }),
    body:body
      ? JSON.stringify(body)
      : undefined
  });
}

/* =========================
   UI HELPERS
========================= */

function toast(message){
  const el =
    document.getElementById("toast");

  if(!el) return;

  el.textContent =
    message;

  el.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer =
    setTimeout(()=>{
      el.classList.remove("show");
    },2400);
}

function openConfirmModal({
  title = "Confirm action",
  text = "Are you sure?",
  confirmText = "Confirm",
  danger = false,
  onConfirm
} = {}){
  state.confirmCallback =
    typeof onConfirm === "function"
      ? onConfirm
      : null;

  document.getElementById("confirmTitle").textContent =
    title;

  document.getElementById("confirmText").textContent =
    text;

  const btn =
    document.getElementById("confirmActionBtn");

  btn.textContent =
    confirmText;

  btn.classList.toggle(
    "danger",
    danger
  );

  btn.onclick = async ()=>{
    const callback =
      state.confirmCallback;

    closeConfirmModal();

    if(callback){
      await callback();
    }
  };

  document
    .getElementById("confirmModal")
    .classList
    .remove("hidden");
}

function closeConfirmModal(){
  state.confirmCallback = null;

  document
    .getElementById("confirmModal")
    .classList
    .add("hidden");
}

function showConversationSidebar(){
  document
    .getElementById("conversationSidebar")
    ?.classList
    .remove("hidden-mobile");
}

function hideConversationSidebarOnMobile(){
  if(window.innerWidth <= 980){
    document
      .getElementById("conversationSidebar")
      ?.classList
      .add("hidden-mobile");
  }
}

function showEmptyState(){
  document
    .getElementById("emptyState")
    ?.classList
    .remove("hidden");

  document
    .getElementById("messagesBox")
    ?.classList
    .add("hidden");
}

function showMessagesState(){
  document
    .getElementById("emptyState")
    ?.classList
    .add("hidden");

  document
    .getElementById("messagesBox")
    ?.classList
    .remove("hidden");
}

function setStatus(text){
  const el =
    document.getElementById("activeConversationStatus");

  if(el){
    el.textContent = text;
  }
}

function autoGrowComposer(){
  const input =
    document.getElementById("messageInput");

  if(!input) return;

  input.style.height = "auto";
  input.style.height =
    Math.min(input.scrollHeight,132) + "px";
}
/* =========================
   SOCKETS
========================= */

function connectSocket(){
  if(state.socket){
    state.socket.disconnect();
  }

  state.socket = io(API,{
    auth:{
      token:state.token
    },
    transports:["websocket","polling"]
  });

  state.socket.on("connect",()=>{
    if(state.myId){
      state.socket.emit("join",state.myId);
    }
  });

  state.socket.on("connect_error",error=>{
    console.warn("Socket connection error:",error.message);
  });

  state.socket.on("userOnline",payload=>{
    if(!payload?.userId) return;

    state.onlineUsers.set(
      String(payload.userId),
      {
        online:!!payload.online,
        lastSeen:payload.lastSeen || null
      }
    );

    renderConversations();

    if(
      state.activeOtherUser &&
      String(getId(state.activeOtherUser)) ===
      String(payload.userId)
    ){
      updateActiveHeader();
    }
  });

  state.socket.on("typing",payload=>{
    const from =
      payload?.from ||
      payload?.sender ||
      "";

    if(
      state.activeOtherUser &&
      String(from) === String(getId(state.activeOtherUser))
    ){
      setStatus("Typing...");
    }
  });

  state.socket.on("stopTyping",payload=>{
    const from =
      payload?.from ||
      payload?.sender ||
      "";

    if(
      state.activeOtherUser &&
      String(from) === String(getId(state.activeOtherUser))
    ){
      updateActiveHeader();
    }
  });

  state.socket.on("newMessage",message=>{
    handleRealtimeMessage(message);
  });

  state.socket.on("messageDeleted",payload=>{
    if(!payload?.messageId) return;

    const index =
      state.messages.findIndex(
        item => String(item._id) === String(payload.messageId)
      );

    if(index !== -1){
      state.messages[index].deletedForEveryone = true;
      state.messages[index].text = "This message was deleted";
      state.messages[index].fileUrl = "";
      state.messages[index].fileType = "";
      state.messages[index].attachments = [];
      renderMessages();
    }

    loadConversations();
  });

  state.socket.on("messageEdited",message=>{
    const index =
      state.messages.findIndex(
        item => String(item._id) === String(message._id)
      );

    if(index !== -1){
      state.messages[index] = message;
      renderMessages();
    }

    loadConversations();
  });

  state.socket.on("reactionUpdate",message=>{
    const index =
      state.messages.findIndex(
        item => String(item._id) === String(message._id)
      );

    if(index !== -1){
      state.messages[index] = message;
      renderMessages();
    }
  });

  state.socket.on("conversationCreated",()=>{
    loadConversations();
  });

  state.socket.on("conversationUpdated",()=>{
    loadConversations();
  });

  state.socket.on("conversationRead",()=>{
    loadConversations();
  });

  state.socket.on("meetingInvited",payload=>{
    toast(
      payload?.title
        ? `Meeting invitation: ${payload.title}`
        : "You have a new meeting invitation"
    );
  });

  state.socket.on("incomingCall",payload=>{
    toast(
      payload?.callType === "video"
        ? "Incoming video call"
        : "Incoming audio call"
    );
  });
}

/* =========================
   ME
========================= */

async function loadMe(){
  const data =
    await api("/api/users/me",{
      headers:authHeaders()
    });

  state.me =
    data.user || data;

  state.myId =
    getId(state.me);

  if(state.myId){
    localStorage.setItem("userId",state.myId);
  }

  if(state.me?.role){
    localStorage.setItem("role",state.me.role);
  }
}

/* =========================
   CONVERSATIONS
========================= */

function conversationId(conversation){
  return getId(conversation);
}

function conversationTitle(conversation){
  if(!conversation) return "Conversation";

  if(conversation.displayName){
    return conversation.displayName;
  }

  if(conversation.type !== "direct" && conversation.title){
    return conversation.title;
  }

  return userDisplayName(
    conversation.user ||
    getOtherParticipant(conversation) ||
    {}
  );
}

function conversationImage(conversation){
  if(!conversation) return FALLBACK_AVATAR;

  if(conversation.displayImage){
    return conversation.displayImage;
  }

  if(conversation.type !== "direct" && conversation.photo){
    return conversation.photo;
  }

  return userAvatar(
    conversation.user ||
    getOtherParticipant(conversation) ||
    {}
  );
}

function getOtherParticipant(conversation){
  const participants =
    conversation?.participants || [];

  const other =
    participants.find(item=>{
      const user =
        item.user || item;

      return String(getId(user)) !== String(state.myId);
    });

  return other?.user || other || conversation?.user || null;
}

function conversationPreview(conversation){
  const last =
    conversation?.lastMessage;

  if(typeof last === "string"){
    return last || "Start a conversation";
  }

  if(last?.text){
    return last.text;
  }

  if(last?.messageType === "image") return "Image";
  if(last?.messageType === "video") return "Video";
  if(last?.messageType === "audio") return "Audio";
  if(last?.messageType === "document") return "Document";
  if(last?.messageType === "meeting") return "Meeting";

  return "Start a conversation";
}

function conversationUpdatedAt(conversation){
  return (
    conversation.lastMessageDate ||
    conversation.lastMessage?.createdAt ||
    conversation.updatedAt ||
    conversation.createdAt
  );
}

function isConversationOnline(conversation){
  const other =
    conversation.user ||
    getOtherParticipant(conversation);

  const id =
    getId(other);

  if(!id) return false;

  return state.onlineUsers.get(String(id))?.online === true;
}

async function loadConversations(){
  const query = new URLSearchParams();

  if(state.conversationFilter === "archived"){
    query.set("archived","true");
  }

  if(state.conversationFilter === "unread"){
    query.set("unread","true");
  }

  if(state.conversationFilter === "pinned"){
    query.set("pinned","true");
  }

  if(state.conversationSearch){
    query.set("search",state.conversationSearch);
  }

  const path =
    "/api/conversations" +
    (query.toString()
      ? "?" + query.toString()
      : "");

  const data =
    await api(path,{
      headers:authHeaders()
    });

  state.conversations =
    Array.isArray(data)
      ? data
      : data.conversations || [];

  applyConversationFilter();
  renderConversations();
}

function applyConversationFilter(){
  let list =
    [...state.conversations];

  if(state.conversationFilter === "all"){
    list = list.filter(item => !item.archived);
  }

  if(state.conversationFilter === "archived"){
    list = list.filter(item => item.archived);
  }

  if(state.conversationFilter === "pinned"){
    list = list.filter(item => item.pinned && !item.archived);
  }

  if(state.conversationFilter === "unread"){
    list = list.filter(item => Number(item.unreadCount || item.unread || 0) > 0);
  }

  if(state.conversationSearch){
    const q =
      state.conversationSearch.toLowerCase();

    list = list.filter(item=>{
      return [
        conversationTitle(item),
        conversationPreview(item),
        userSubtitle(item.user || {})
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }

  list.sort((a,b)=>{
    if(Boolean(a.pinned) !== Boolean(b.pinned)){
      return a.pinned ? -1 : 1;
    }

    return new Date(conversationUpdatedAt(b) || 0) -
      new Date(conversationUpdatedAt(a) || 0);
  });

  state.filteredConversations = list;
}

function renderConversations(){
  const box =
    document.getElementById("conversationList");

  if(!box) return;

  applyConversationFilter();

  if(!state.filteredConversations.length){
    box.innerHTML = `
      <div class="empty-list">
        No conversations found.
      </div>
    `;
    return;
  }

  box.innerHTML =
    state.filteredConversations
      .map(conversation=>{
        const id =
          conversationId(conversation);

        const active =
          state.activeConversation &&
          String(conversationId(state.activeConversation)) === String(id);

        const unread =
          Number(conversation.unreadCount || conversation.unread || 0);

        const online =
          isConversationOnline(conversation);

        return `
          <article
            class="conversation-item ${active ? "active" : ""}"
            onclick="openConversation('${esc(id)}')"
          >
            <div class="conversation-avatar-wrap">
              <img
                class="conversation-avatar"
                src="${esc(conversationImage(conversation))}"
                alt=""
              >
              ${online ? `<span class="online-dot"></span>` : ""}
            </div>

            <div class="conversation-main">
              <div class="conversation-top">
                <div class="conversation-name">
                  ${esc(conversationTitle(conversation))}
                </div>

                <div class="conversation-time">
                  ${esc(formatTime(conversationUpdatedAt(conversation)))}
                </div>
              </div>

              <div class="conversation-preview">
                ${esc(conversationPreview(conversation))}
              </div>

              <div class="conversation-meta-row">
                ${
                  conversation.pinned
                    ? `<span class="mini-pill blue">Pinned</span>`
                    : ""
                }

                ${
                  conversation.muted
                    ? `<span class="mini-pill">Muted</span>`
                    : ""
                }

                ${
                  conversation.type && conversation.type !== "direct"
                    ? `<span class="mini-pill">${esc(conversation.type)}</span>`
                    : ""
                }

                ${
                  unread > 0
                    ? `<span class="unread-count">${unread > 99 ? "99+" : unread}</span>`
                    : ""
                }
              </div>
            </div>
          </article>
        `;
      })
      .join("");
}

function setConversationFilter(filter,button){
  state.conversationFilter = filter;

  document
    .querySelectorAll(".conversation-tabs button")
    .forEach(item=>item.classList.remove("active"));

  button?.classList.add("active");

  loadConversations();
}

/* =========================
   OPEN CONVERSATION
========================= */

async function openConversation(id){
  if(!id) return;

  try{
    showMessagesState();
    hideConversationSidebarOnMobile();

    state.isLoadingMessages = true;
    state.messages = [];
    state.messagesPageBefore = null;
    state.hasMoreMessages = true;

    const conversation =
      await api(`/api/conversations/${encodeURIComponent(id)}`,{
        headers:authHeaders()
      });

    state.activeConversation = conversation;
    state.activeOtherUser =
      conversation.user ||
      getOtherParticipant(conversation) ||
      null;

    updateActiveHeader();

    renderMessagesSkeleton();

    const messages =
      await api(
        `/api/conversations/${encodeURIComponent(id)}/messages?limit=60`,
        {
          headers:authHeaders()
        }
      );

    state.messages =
      Array.isArray(messages)
        ? messages
        : [];

    state.messagesPageBefore =
      state.messages[0]?.createdAt || null;

    state.hasMoreMessages =
      state.messages.length >= 60;

    renderMessages();

    await markConversationRead(id);

    await loadConversations();

  }catch(error){
    console.error(error);
toast(error.message || "Unable to open conversation");

if(
  String(error.message || "").toLowerCase().includes("access") &&
  id
){
  console.warn("Access denied for conversation:", id);
}

showEmptyState();
  }finally{
    state.isLoadingMessages = false;
  }
}

function updateActiveHeader(){
  const conversation =
    state.activeConversation;

  const other =
    state.activeOtherUser || {};

  const title =
    conversation
      ? conversationTitle(conversation)
      : "Messages";

  const avatar =
    conversation
      ? conversationImage(conversation)
      : FALLBACK_AVATAR;

  document.getElementById("activeConversationTitle").textContent =
    title;

  document.getElementById("activeUserImage").src =
    avatar;

  if(!conversation){
    setStatus("Select a conversation");
    return;
  }

  const otherId =
    getId(other);

  const online =
    otherId &&
    state.onlineUsers.get(String(otherId))?.online;

  if(online){
    setStatus("Online");
  }else{
    setStatus(
      conversation.type === "direct"
        ? userSubtitle(other)
        : `${conversation.participants?.length || 0} participants`
    );
  }

  document.getElementById("drawerUserImage").src =
    avatar;

  document.getElementById("drawerUserName").textContent =
    title;

  document.getElementById("drawerUserMeta").textContent =
    conversation.type === "direct"
      ? `${readableRole(other.role)} • ${userSubtitle(other)}`
      : `${conversation.type || "Group"} conversation`;
}

async function markConversationRead(id){
  try{
    await apiJSON(
      `/api/conversations/${encodeURIComponent(id)}/read`,
      "PATCH",
      {}
    );
  }catch(error){
    console.warn("Mark read failed:",error.message);
  }
}
/* =========================
   MESSAGE RENDERING
========================= */

function senderId(message){
  return getId(message.sender);
}

function receiverId(message){
  return getId(message.receiver);
}

function isMyMessage(message){
  return String(senderId(message)) === String(state.myId);
}

function messageId(message){
  return getId(message) || message._id || "";
}

function renderMessagesSkeleton(){
  const box =
    document.getElementById("messagesBox");

  if(!box) return;

  box.innerHTML = `
    <div class="day-divider">Loading messages</div>
  `;
}

function renderMessages(){
  const box =
    document.getElementById("messagesBox");

  if(!box) return;

  if(!state.messages.length){
    box.innerHTML = `
      <div class="day-divider">
        No messages yet
      </div>
    `;
    return;
  }

  let lastDay = "";

  box.innerHTML = "";

  state.messages.forEach(message=>{
    const day =
      formatDay(message.createdAt || new Date());

    if(day !== lastDay){
      const divider =
        document.createElement("div");

      divider.className =
        "day-divider";

      divider.textContent =
        day;

      box.appendChild(divider);

      lastDay = day;
    }

    box.appendChild(
      createMessageNode(message)
    );
  });

  scrollMessagesToBottom();
}

function createMessageNode(message){
  const mine =
    isMyMessage(message);

  if(message.messageType === "system"){
    const system =
      document.createElement("div");

    system.className =
      "system-message";

    system.textContent =
      message.text || "System update";

    return system;
  }

  const row =
    document.createElement("div");

  row.className =
    "message-row " + (mine ? "me" : "other");

  const bubble =
    document.createElement("article");

  bubble.className =
    "message-bubble " + (mine ? "me" : "other");

  bubble.dataset.messageId =
    messageId(message);

  bubble.onclick = event=>{
    event.stopPropagation();
    selectMessage(message,bubble);
  };

  bubble.innerHTML = `
    ${replyPreviewHtml(message)}
    ${messageContentHtml(message)}
    ${messageMetaHtml(message,mine)}
  `;

  row.appendChild(bubble);

  return row;
}

function replyPreviewHtml(message){
  const reply =
    message.replyTo;

  if(!reply){
    return "";
  }

  const replySender =
    reply.sender?.name ||
    reply.sender?.companyName ||
    reply.sender?.schoolName ||
    "Reply";

  return `
    <div class="reply-preview">
      <strong>${esc(replySender)}</strong>
      <span>${esc(reply.text || reply.messageType || "Message")}</span>
    </div>
  `;
}

function messageContentHtml(message){
  if(message.deletedForEveryone){
    return `
      <div class="message-deleted">
        This message was deleted
      </div>
    `;
  }

  const parts = [];

  if(message.text){
    parts.push(`
      <div class="message-text">
        ${esc(message.text)}
      </div>
    `);
  }

  const attachment =
    getPrimaryAttachment(message);

  if(attachment){
    parts.push(
      attachmentHtml(attachment,message)
    );
  }

  if(!parts.length){
    parts.push(`
      <div class="message-text">
        Message
      </div>
    `);
  }

  return parts.join("");
}

function getPrimaryAttachment(message){
  if(Array.isArray(message.attachments) && message.attachments.length){
    return message.attachments[0];
  }

  if(message.fileUrl || message.mediaUrl){
    return {
      url:message.fileUrl || message.mediaUrl,
      secureUrl:message.fileUrl || message.mediaUrl,
      type:normalizeAttachmentType(message.fileType || message.mediaType || ""),
      mimeType:message.fileType || message.mediaType || "",
      originalName:message.fileName || "Attachment",
      size:message.fileSize || 0
    };
  }

  return null;
}

function normalizeAttachmentType(type = ""){
  const t =
    String(type).toLowerCase();

  if(t.includes("image")) return "image";
  if(t.includes("video")) return "video";
  if(t.includes("audio")) return "audio";
  if(t.includes("pdf") || t.includes("document")) return "document";

  return t || "file";
}

function attachmentHtml(attachment,message){
  const url =
    attachment.secureUrl ||
    attachment.url ||
    "";

  if(!url){
    return "";
  }

  const type =
    normalizeAttachmentType(
      attachment.type ||
      attachment.mimeType ||
      message.fileType ||
      ""
    );

  const name =
    attachment.originalName ||
    message.fileName ||
    "Attachment";

  if(type === "image"){
    return `
      <img
        class="message-file-image"
        src="${esc(url)}"
        alt="${esc(name)}"
        loading="lazy"
        onclick="event.stopPropagation();window.open('${esc(url)}','_blank')"
      >
    `;
  }

  if(type === "video"){
    return `
      <video
        class="message-file-video"
        src="${esc(url)}"
        controls
      ></video>
    `;
  }

  if(type === "audio"){
    return `
      <audio
        class="message-file-audio"
        src="${esc(url)}"
        controls
      ></audio>
    `;
  }

  return `
    <a
      class="file-card"
      href="${esc(url)}"
      target="_blank"
      rel="noopener noreferrer"
      onclick="event.stopPropagation()"
    >
      <svg viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 2v6h6"></path>
      </svg>

      <div>
        <strong>${esc(name)}</strong>
        <span>${esc(fileSize(attachment.size || message.fileSize || 0))}</span>
      </div>
    </a>
  `;
}

function messageMetaHtml(message,mine){
  const edited =
    message.isEdited || message.editedAt;

  const status =
    mine
      ? message.status === "failed"
        ? `<span class="status-failed">Failed</span>`
        : message.seen || message.status === "seen"
          ? `<span class="status-read">Read</span>`
          : `<span>Sent</span>`
      : "";

  return `
    <div class="message-meta">
      ${edited ? `<span>Edited</span>` : ""}
      <span>${esc(formatMessageTime(message.createdAt))}</span>
      ${status}
    </div>
  `;
}

function scrollMessagesToBottom(){
  const box =
    document.getElementById("messagesBox");

  if(!box) return;

  requestAnimationFrame(()=>{
    box.scrollTop =
      box.scrollHeight;
  });
}

/* =========================
   OLDER MESSAGES
========================= */

async function loadOlderMessages(){
  if(
    state.isLoadingMessages ||
    !state.hasMoreMessages ||
    !state.activeConversation ||
    !state.messagesPageBefore
  ){
    return;
  }

  const box =
    document.getElementById("messagesBox");

  if(!box) return;

  const oldHeight =
    box.scrollHeight;

  try{
    state.isLoadingMessages = true;

    const id =
      conversationId(state.activeConversation);

    const older =
      await api(
        `/api/conversations/${encodeURIComponent(id)}/messages?limit=40&before=${encodeURIComponent(state.messagesPageBefore)}`,
        {
          headers:authHeaders()
        }
      );

    const list =
      Array.isArray(older)
        ? older
        : [];

    if(!list.length){
      state.hasMoreMessages = false;
      return;
    }

    const existingIds =
      new Set(
        state.messages.map(item => String(messageId(item)))
      );

    const unique =
      list.filter(item =>
        !existingIds.has(String(messageId(item)))
      );

    state.messages =
      [...unique,...state.messages];

    state.messagesPageBefore =
      state.messages[0]?.createdAt || null;

    if(list.length < 40){
      state.hasMoreMessages = false;
    }

    renderMessages();

    requestAnimationFrame(()=>{
      box.scrollTop =
        box.scrollHeight - oldHeight;
    });

  }catch(error){
    console.warn("Load older messages failed:",error.message);
  }finally{
    state.isLoadingMessages = false;
  }
}

/* =========================
   MESSAGE SELECTION
========================= */

function selectMessage(message,bubble){
  clearSelectedMessage();

  state.selectedMessage = {
    id:messageId(message),
    text:message.text || "",
    mine:isMyMessage(message),
    message
  };

  bubble.classList.add("selected");

  document
    .getElementById("messageActionBar")
    .classList
    .remove("hidden");
}

function clearSelectedMessage(){
  state.selectedMessage = null;

  document
    .querySelectorAll(".message-bubble.selected")
    .forEach(item=>{
      item.classList.remove("selected");
    });

  document
    .getElementById("messageActionBar")
    ?.classList
    .add("hidden");
}

function replyToSelectedMessage(){
  if(!state.selectedMessage) return;

  const message =
    state.selectedMessage.message;

  const sender =
    state.selectedMessage.mine
      ? "You"
      : conversationTitle(state.activeConversation);

  state.replyTo = {
    id:state.selectedMessage.id,
    text:message.text ||
      getPrimaryAttachment(message)?.originalName ||
      "Message",
    sender
  };

  document.getElementById("replyTitle").textContent =
    "Replying to " + sender;

  document.getElementById("replyText").textContent =
    state.replyTo.text;

  document
    .getElementById("replyBar")
    .classList
    .remove("hidden");

  clearSelectedMessage();

  document
    .getElementById("messageInput")
    .focus();
}

function clearReply(){
  state.replyTo = null;

  document
    .getElementById("replyBar")
    .classList
    .add("hidden");

  document.getElementById("replyTitle").textContent =
    "Replying";

  document.getElementById("replyText").textContent =
    "";
}
/* =========================
   SEND MESSAGE
========================= */

async function sendMessage(){
  const input =
    document.getElementById("messageInput");

  const text =
    cleanText(input?.value || "");

  const file =
    state.attachment;

  if(state.isSending){
    return;
  }

  if(!state.activeConversation){
    toast("Select a conversation first");
    return;
  }

  if(!text && !file){
    return;
  }

  const other =
    state.activeOtherUser ||
    getOtherParticipant(state.activeConversation);

  const receiverId =
    getId(other);

  if(!receiverId){
    toast("Unable to find receiver");
    return;
  }

  state.isSending = true;

  const sendBtn =
    document.querySelector(".send-btn");

  if(sendBtn){
    sendBtn.disabled = true;
  }

const tempId =
  "client-" + Date.now() + "-" + Math.random().toString(36).slice(2);

  const tempMessage = {
    _id:tempId,
    sender:{
      _id:state.myId,
      name:"You"
    },
    receiver:{
      _id:receiverId
    },
    text,
    fileUrl:file ? URL.createObjectURL(file) : "",
    fileType:file ? file.type : "",
    fileName:file ? file.name : "",
    fileSize:file ? file.size : 0,
    attachments:file ? [{
      url:URL.createObjectURL(file),
      secureUrl:URL.createObjectURL(file),
      type:normalizeAttachmentType(file.type),
      mimeType:file.type,
      originalName:file.name,
      size:file.size
    }] : [],
    replyTo:state.replyTo ? {
      text:state.replyTo.text,
      sender:{
        name:state.replyTo.sender
      }
    } : null,
    messageType:file
      ? normalizeAttachmentType(file.type)
      : "text",
    status:"sending",
    seen:false,
    createdAt:new Date().toISOString(),
metadata:{
  clientMessageId:tempId
}
  };

  state.messages.push(tempMessage);
  renderMessages();

  const form =
    new FormData();

  form.append("receiverId",receiverId);

  if(text){
    form.append("text",text);
  }

  if(file){
    form.append("file",file);
  }

  if(state.replyTo?.id){
    form.append("replyTo",state.replyTo.id);
  }

  form.append("clientMessageId",tempId);

  input.value = "";
  autoGrowComposer();
  clearAttachment();
  clearReply();

  try{
    const saved =
      await api("/api/messages",{
        method:"POST",
        headers:authHeaders(),
        body:form
      });

const index =
  state.messages.findIndex(
    item =>
      String(item._id) === String(tempId) ||
      String(item?.metadata?.clientMessageId || "") === String(tempId)
  );

    if(index !== -1){
      state.messages[index] =
        saved.message || saved;
    }

    renderMessages();
    await loadConversations();

  }catch(error){
    const failed =
      state.messages.find(
        item => String(item._id) === String(tempId)
      );

    if(failed){
      failed.status = "failed";
      renderMessages();
    }

    toast(error.message || "Message failed to send");

  }finally{
    state.isSending = false;

    if(sendBtn){
      sendBtn.disabled = false;
    }
  }
}

/* =========================
   ATTACHMENTS
========================= */

function toggleAttachmentMenu(){
  document
    .getElementById("attachmentMenu")
    ?.classList
    .toggle("hidden");
}

function chooseAttachment(type){
  const input =
    document.getElementById("fileInput");

  if(!input) return;

  if(type === "image"){
    input.accept = "image/*";
  }

  if(type === "video"){
    input.accept = "video/*";
  }

  if(type === "audio"){
    input.accept = "audio/*";
  }

  if(type === "document"){
    input.accept =
      ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";
  }

  document
    .getElementById("attachmentMenu")
    ?.classList
    .add("hidden");

  input.click();
}

function handleAttachmentSelected(file){
  if(!file) return;

  const maxSize =
    50 * 1024 * 1024;

  if(file.size > maxSize){
    toast("File is too large. Maximum size is 50MB.");
    return;
  }

  state.attachment = file;
  renderAttachmentPreview(file);
}

function renderAttachmentPreview(file){
  const box =
    document.getElementById("attachmentPreview");

  if(!box) return;

  const type =
    normalizeAttachmentType(file.type);

  let preview = "";

  if(type === "image"){
    preview = `
      <img src="${esc(URL.createObjectURL(file))}" alt="">
    `;
  }else if(type === "video"){
    preview = `
      <video src="${esc(URL.createObjectURL(file))}" controls></video>
    `;
  }else{
    preview = `
      <div class="preview-file-icon">
        <svg viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v6h6"></path>
        </svg>
      </div>
    `;
  }

  box.innerHTML = `
    <div class="preview-card">
      ${preview}

      <div class="preview-info">
        <strong>${esc(file.name)}</strong>
        <span>${esc(fileSize(file.size))}</span>
      </div>

      <button onclick="clearAttachment()">Remove</button>
    </div>
  `;

  box.classList.remove("hidden");
}

function clearAttachment(){
  state.attachment = null;

  const input =
    document.getElementById("fileInput");

  if(input){
    input.value = "";
  }

  const box =
    document.getElementById("attachmentPreview");

  if(box){
    box.classList.add("hidden");
    box.innerHTML = "";
  }
}

/* =========================
   REALTIME MESSAGE HANDLING
========================= */

function handleRealtimeMessage(message){
  if(!message) return;

  const activeId =
    state.activeConversation
      ? conversationId(state.activeConversation)
      : "";

  const messageConversationId =
    getId(message.conversationId);

  const sameConversation =
    activeId &&
    messageConversationId &&
    String(activeId) === String(messageConversationId);

  const sender =
    senderId(message);

  const receiver =
    receiverId(message);

  const sameDirectFallback =
    state.activeOtherUser &&
    (
      String(sender) === String(getId(state.activeOtherUser)) ||
      String(receiver) === String(getId(state.activeOtherUser))
    );

  if(sameConversation || sameDirectFallback){

    const incomingClientId =
      message?.metadata?.clientMessageId || "";

    if(incomingClientId){
      const tempIndex =
        state.messages.findIndex(item =>
          String(item?.metadata?.clientMessageId || "") ===
          String(incomingClientId)
        );

      if(tempIndex !== -1){
        state.messages[tempIndex] = message;
        renderMessages();

        if(activeId){
          markConversationRead(activeId);
        }

        loadConversations();
        return;
      }
    }

    const alreadyExists =
      state.messages.some(item =>
        String(messageId(item)) === String(messageId(message))
      );

    if(!alreadyExists){
      state.messages.push(message);
      renderMessages();
    }

    if(activeId){
      markConversationRead(activeId);
    }
  }

  loadConversations();
}

/* =========================
   USER SEARCH / NEW CHAT
========================= */

function openNewChatMode(){
  document
    .getElementById("newChatPanel")
    ?.classList
    .remove("hidden");

  setTimeout(()=>{
    document
      .getElementById("userSearchInput")
      ?.focus();
  },80);
}

function closeNewChatMode(){
  document
    .getElementById("newChatPanel")
    ?.classList
    .add("hidden");

  const input =
    document.getElementById("userSearchInput");

  const results =
    document.getElementById("userSearchResults");

  if(input){
    input.value = "";
  }

  if(results){
    results.innerHTML = "";
  }
}

async function searchUsers(query){
  const q =
    cleanText(query);

  const box =
    document.getElementById("userSearchResults");

  if(!box) return;

  if(q.length < 2){
    box.innerHTML = `
      <div class="empty-list">
        Type at least 2 letters to search.
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="loading-card">
      Searching...
    </div>
  `;

  try{
    const data =
      await api(
        `/api/users/network?search=${encodeURIComponent(q)}&limit=12`,
        {
          headers:authHeaders()
        }
      );

    const users =
      Array.isArray(data)
        ? data
        : data.users || data.results || [];

    renderUserSearchResults(
      users.filter(user =>
        String(getId(user)) !== String(state.myId)
      )
    );

  }catch(error){
    box.innerHTML = `
      <div class="empty-list">
        ${esc(error.message || "Unable to search users")}
      </div>
    `;
  }
}

function renderUserSearchResults(users){
  const box =
    document.getElementById("userSearchResults");

  if(!box) return;

  if(!users.length){
    box.innerHTML = `
      <div class="empty-list">
        No users found.
      </div>
    `;
    return;
  }

  box.innerHTML =
    users.map(user=>`
      <article
        class="conversation-item"
        onclick="createDirectConversation('${esc(getId(user))}')"
      >
        <div class="conversation-avatar-wrap">
          <img
            class="conversation-avatar"
            src="${esc(userAvatar(user))}"
            alt=""
          >
        </div>

        <div class="conversation-main">
          <div class="conversation-top">
            <div class="conversation-name">
              ${esc(userDisplayName(user))}
            </div>
          </div>

          <div class="conversation-preview">
            ${esc(readableRole(user.role))} • ${esc(userSubtitle(user))}
          </div>
        </div>
      </article>
    `).join("");
}

async function createDirectConversation(userId){
  if(!userId) return;

  try{
    const conversation =
      await apiJSON(
        "/api/conversations/direct",
        "POST",
        { userId }
      );

    closeNewChatMode();

    await loadConversations();

    await openConversation(
      conversationId(conversation)
    );

  }catch(error){
    toast(error.message || "Unable to start conversation");
  }
}
/* =========================
   MESSAGE ACTIONS
========================= */

async function copySelectedMessage(){
  if(!state.selectedMessage){
    return;
  }

  const text =
    state.selectedMessage.text ||
    state.selectedMessage.message?.text ||
    "";

  if(!text){
    toast("No text to copy");
    return;
  }

  try{
    await navigator.clipboard.writeText(text);
    toast("Message copied");
    clearSelectedMessage();
  }catch{
    toast("Unable to copy message");
  }
}

async function starSelectedMessage(){
  if(!state.selectedMessage?.id){
    return;
  }

  try{
    await apiJSON(
      `/api/messages/${encodeURIComponent(state.selectedMessage.id)}/star`,
      "PATCH",
      {}
    );

    toast("Message updated");
    clearSelectedMessage();

  }catch(error){
    toast(error.message || "Unable to update message");
  }
}

function deleteSelectedMessageForMe(){
  if(!state.selectedMessage?.id){
    return;
  }

  openConfirmModal({
    title:"Delete message for you",
    text:"This message will be removed from your view only.",
    confirmText:"Delete",
    danger:true,
    onConfirm:async ()=>{
      try{
        await apiJSON(
          `/api/messages/${encodeURIComponent(state.selectedMessage.id)}/delete-for-me`,
          "PATCH",
          {}
        );

        state.messages =
          state.messages.filter(item =>
            String(messageId(item)) !== String(state.selectedMessage.id)
          );

        clearSelectedMessage();
        renderMessages();
        toast("Message deleted");

      }catch(error){
        toast(error.message || "Unable to delete message");
      }
    }
  });
}

function deleteSelectedMessageForEveryone(){
  if(!state.selectedMessage?.id){
    return;
  }

  if(!state.selectedMessage.mine){
    toast("Only the sender can delete this message for everyone");
    return;
  }

  openConfirmModal({
    title:"Delete message for everyone",
    text:"This will remove the message for everyone in this conversation.",
    confirmText:"Delete",
    danger:true,
    onConfirm:async ()=>{
      try{
        await apiJSON(
          `/api/messages/${encodeURIComponent(state.selectedMessage.id)}/delete-for-everyone`,
          "PATCH",
          {}
        );

        const item =
          state.messages.find(msg =>
            String(messageId(msg)) === String(state.selectedMessage.id)
          );

        if(item){
          item.deletedForEveryone = true;
          item.text = "This message was deleted";
          item.fileUrl = "";
          item.fileType = "";
          item.attachments = [];
        }

        clearSelectedMessage();
        renderMessages();
        toast("Message deleted for everyone");

      }catch(error){
        toast(error.message || "Unable to delete message");
      }
    }
  });
}

/* =========================
   CONVERSATION SETTINGS
========================= */

async function toggleActivePin(){
  if(!state.activeConversation){
    toast("Select a conversation first");
    return;
  }

  try{
    const id =
      conversationId(state.activeConversation);

    const setting =
      await apiJSON(
        `/api/conversations/${encodeURIComponent(id)}/pin`,
        "PATCH",
        {}
      );

    state.activeConversation.pinned =
      !!setting.pinned;

    toast(setting.pinned ? "Conversation pinned" : "Conversation unpinned");

    closeChatInfo();
    await loadConversations();

  }catch(error){
    toast(error.message || "Unable to update pin");
  }
}

async function toggleActiveMute(){
  if(!state.activeConversation){
    toast("Select a conversation first");
    return;
  }

  try{
    const id =
      conversationId(state.activeConversation);

    const setting =
      await apiJSON(
        `/api/conversations/${encodeURIComponent(id)}/mute`,
        "PATCH",
        {}
      );

    state.activeConversation.muted =
      !!setting.muted;

    toast(setting.muted ? "Conversation muted" : "Conversation unmuted");

    closeChatInfo();
    await loadConversations();

  }catch(error){
    toast(error.message || "Unable to update mute");
  }
}

function archiveActiveConversation(){
  if(!state.activeConversation){
    toast("Select a conversation first");
    return;
  }

  openConfirmModal({
    title:"Archive conversation",
    text:"This conversation will move to your archived messages.",
    confirmText:"Archive",
    onConfirm:async ()=>{
      try{
        const id =
          conversationId(state.activeConversation);

        await apiJSON(
          `/api/conversations/${encodeURIComponent(id)}/archive`,
          "PATCH",
          {}
        );

        closeChatInfo();
        state.activeConversation = null;
        state.activeOtherUser = null;
        showEmptyState();

        await loadConversations();
        toast("Conversation archived");

      }catch(error){
        toast(error.message || "Unable to archive conversation");
      }
    }
  });
}

function blockActiveConversation(){
  if(!state.activeConversation){
    toast("Select a conversation first");
    return;
  }

  openConfirmModal({
    title:"Block conversation",
    text:"You will stop receiving messages from this conversation. You can unblock later from settings.",
    confirmText:"Block",
    danger:true,
    onConfirm:async ()=>{
      try{
        const id =
          conversationId(state.activeConversation);

        await apiJSON(
          `/api/conversations/${encodeURIComponent(id)}/block`,
          "PATCH",
          {}
        );

        closeChatInfo();
        state.activeConversation = null;
        state.activeOtherUser = null;
        showEmptyState();

        await loadConversations();
        toast("Conversation blocked");

      }catch(error){
        toast(error.message || "Unable to block conversation");
      }
    }
  });
}

/* =========================
   DRAWER / PROFILE
========================= */

function openChatInfo(){
  if(!state.activeConversation){
    toast("Select a conversation first");
    return;
  }

  updateActiveHeader();

  document
    .getElementById("chatInfoDrawer")
    ?.classList
    .remove("hidden");
}

function closeChatInfo(){
  document
    .getElementById("chatInfoDrawer")
    ?.classList
    .add("hidden");
}

function openActiveProfile(){
  if(!state.activeOtherUser){
    toast("No profile available");
    return;
  }

  window.location.href =
    profileUrl(state.activeOtherUser);
}

function openSharedFilesPanel(){
  if(!state.activeConversation){
    toast("Select a conversation first");
    return;
  }

  const files =
    state.messages.filter(message =>
      getPrimaryAttachment(message)
    );

  if(!files.length){
    toast("No shared files in this conversation");
    return;
  }

  const firstFile =
    getPrimaryAttachment(files[files.length - 1]);

  const url =
    firstFile.secureUrl ||
    firstFile.url;

  if(url){
    window.open(url,"_blank");
  }
}

/* =========================
   CALLS AND MEETINGS
========================= */

async function startAudioCall(){
  if(!state.activeConversation || !state.activeOtherUser){
    toast("Select a conversation first");
    return;
  }

  await createCallLog("audio");

  state.socket?.emit("callUser",{
    to:getId(state.activeOtherUser),
    from:state.myId,
    callerName:userDisplayName(state.me),
    callType:"audio",
    conversationId:conversationId(state.activeConversation)
  });

  toast("Audio call request sent");
}

async function startVideoCall(){
  if(!state.activeConversation || !state.activeOtherUser){
    toast("Select a conversation first");
    return;
  }

  await createCallLog("video");

  state.socket?.emit("callUser",{
    to:getId(state.activeOtherUser),
    from:state.myId,
    callerName:userDisplayName(state.me),
    callType:"video",
    conversationId:conversationId(state.activeConversation)
  });

  toast("Video call request sent");
}

async function createCallLog(type){
  try{
    await apiJSON(
      "/api/call-logs",
      "POST",
      {
        receiver:getId(state.activeOtherUser),
        conversationId:conversationId(state.activeConversation),
        callType:type,
        direction:"outgoing",
        status:"ringing"
      }
    );
  }catch(error){
    console.warn("Call log failed:",error.message);
  }
}

async function createInstantMeeting(){
  if(!state.activeConversation){
    toast("Select a conversation first");
    return;
  }

  try{
    const title =
      state.activeOtherUser
        ? `Meeting with ${userDisplayName(state.activeOtherUser)}`
        : conversationTitle(state.activeConversation);

    const invitedUsers = [];

    if(state.activeOtherUser){
      invitedUsers.push(getId(state.activeOtherUser));
    }

    const meeting =
      await apiJSON(
        "/api/meetings",
        "POST",
        {
          title,
          meetingType:"instant",
          conversationId:conversationId(state.activeConversation),
          invitedUsers,
          waitingRoomEnabled:false,
          recordingEnabled:false,
          allowScreenShare:true,
          allowChat:true,
          allowFileSharing:true,
          allowRaiseHand:true,
          allowParticipantVideo:true,
          allowParticipantAudio:true
        }
      );

    if(meeting?.joinUrl){
      toast("Meeting created");
      window.location.href = meeting.joinUrl;
      return;
    }

    if(meeting?.meetingCode){
      window.location.href =
        `meeting.html?code=${encodeURIComponent(meeting.meetingCode)}`;
      return;
    }

    toast("Meeting created");

  }catch(error){
    toast(error.message || "Unable to create meeting");
  }
}

/* =========================
   SEARCH / REFRESH
========================= */

async function refreshEverything(){
  try{
    await loadConversations();

    if(state.activeConversation){
      await openConversation(
        conversationId(state.activeConversation)
      );
    }

    toast("Messages refreshed");

  }catch(error){
    toast(error.message || "Unable to refresh");
  }
}

function handleConversationSearchInput(value){
  state.conversationSearch =
    cleanText(value);

  clearTimeout(state.conversationSearchTimer);

  state.conversationSearchTimer =
    setTimeout(()=>{
      loadConversations();
    },250);
}
/* =========================
   EVENT BINDING
========================= */

function bindEvents(){
  const messageInput =
    document.getElementById("messageInput");

  if(messageInput){
    messageInput.addEventListener("input",()=>{
      autoGrowComposer();

      if(state.activeOtherUser && state.socket){
        state.socket.emit("typing",{
          to:getId(state.activeOtherUser)
        });

        clearTimeout(state.typingTimer);

        state.typingTimer =
          setTimeout(()=>{
            state.socket.emit("stopTyping",{
              to:getId(state.activeOtherUser)
            });
          },900);
      }
    });

    messageInput.addEventListener("keydown",event=>{
      if(event.key === "Enter" && !event.shiftKey){
        event.preventDefault();
        sendMessage();
      }
    });
  }

  const fileInput =
    document.getElementById("fileInput");

  if(fileInput){
    fileInput.addEventListener("change",event=>{
      const file =
        event.target.files?.[0];

      if(file){
        handleAttachmentSelected(file);
      }
    });
  }

  const conversationSearch =
    document.getElementById("conversationSearch");

  if(conversationSearch){
    conversationSearch.addEventListener("input",event=>{
      handleConversationSearchInput(event.target.value);
    });
  }

  const userSearchInput =
    document.getElementById("userSearchInput");

  if(userSearchInput){
    userSearchInput.addEventListener("input",event=>{
      clearTimeout(state.userSearchTimer);

      state.userSearchTimer =
        setTimeout(()=>{
          searchUsers(event.target.value);
        },280);
    });
  }

  const messagesBox =
    document.getElementById("messagesBox");

  if(messagesBox){
    messagesBox.addEventListener("scroll",()=>{
      if(messagesBox.scrollTop < 80){
        loadOlderMessages();
      }
    });
  }

  document.addEventListener("click",event=>{
    const attachmentMenu =
      document.getElementById("attachmentMenu");

    if(
      attachmentMenu &&
      !attachmentMenu.contains(event.target) &&
      !event.target.closest(".composer-icon")
    ){
      attachmentMenu.classList.add("hidden");
    }

    if(
      !event.target.closest(".message-bubble") &&
      !event.target.closest(".message-action-bar")
    ){
      clearSelectedMessage();
    }

    const newChatPanel =
      document.getElementById("newChatPanel");

    if(
      newChatPanel &&
      !newChatPanel.contains(event.target) &&
      !event.target.closest(".primary-soft")
    ){
      newChatPanel.classList.add("hidden");
    }

    const drawer =
      document.getElementById("chatInfoDrawer");

    if(
      drawer &&
      !drawer.classList.contains("hidden") &&
      event.target === drawer
    ){
      closeChatInfo();
    }

    const modal =
      document.getElementById("confirmModal");

    if(
      modal &&
      !modal.classList.contains("hidden") &&
      event.target === modal
    ){
      closeConfirmModal();
    }
  });

  window.addEventListener("resize",()=>{
    if(window.innerWidth > 980){
      showConversationSidebar();
    }
  });
}

/* =========================
   OPEN FROM URL
========================= */

async function openInitialTarget(){

  if(initialConversationId){
    try{
      await openConversation(initialConversationId);
      return;
    }catch(error){
      console.warn("Conversation open failed, trying as user ID:", error.message);
    }
  }

  const targetUserId =
    initialUserId || initialConversationId;

  if(targetUserId){
    try{
      const conversation =
        await apiJSON(
          "/api/conversations/direct",
          "POST",
          { userId:targetUserId }
        );

      await loadConversations();

      await openConversation(
        conversationId(conversation)
      );

      return;

    }catch(error){
      toast(error.message || "Unable to open conversation");
    }
  }

  showEmptyState();
}

/* =========================
   INIT
========================= */

async function initMessagesPage(){
  if(!requireAuth()){
    return;
  }

  bindEvents();

  try{
    await loadMe();

    connectSocket();

    await loadConversations();

    await openInitialTarget();

  }catch(error){
    console.error("MESSAGES INIT ERROR:",error);
    toast(error.message || "Unable to load messages");
    showEmptyState();
  }
}

document.addEventListener("DOMContentLoaded",()=>{
  initMessagesPage();
});
