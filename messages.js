const API = "https://backend-1-9b6f.onrender.com";
const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const params = new URLSearchParams(window.location.search);
const initialUserId = params.get("user") || params.get("userId") || "";
const initialConversationId = params.get("conversation") || params.get("conversationId") || "";

const state = {
  token:"", role:"", me:null, myId:"", socket:null,
  conversations:[], filteredConversations:[], activeConversation:null, activeOtherUser:null, messages:[],
  onlineUsers:new Map(), conversationFilter:"all", conversationSearch:"", userSearchTimer:null, conversationSearchTimer:null,
  selectedMessage:null, replyTo:null, attachment:null, pickerOpen:false, pickerTab:"emoji", savedStickers:[], gifSearchTimer:null,
  isSending:false, isLoadingMessages:false, messagesPageBefore:null, hasMoreMessages:true, confirmCallback:null,
  unreadBelow:false, lastKnownScrollHeight:0,
  currentCall:null, currentCallLogId:null, localStream:null, remoteStream:null, peerConnection:null, screenStream:null,
  callStartTime:null, callTimer:null, callTimeout:null, isMuted:false, cameraEnabled:true, speakerEnabled:true, pendingIncomingCall:null,
  ringtone:null, outgoingTone:null, callEndTone:null, messageTone:null, messageSentTone:null, busyTone:null, typingTimer:null
};

function getRole(){ return String(localStorage.getItem("role") || "").toLowerCase(); }
function getToken(){
  const role = getRole();
  return localStorage.getItem(role + "Token") || localStorage.getItem("studentToken") || localStorage.getItem("teacherToken") ||
    localStorage.getItem("schoolToken") || localStorage.getItem("employerToken") || localStorage.getItem("talentToken") ||
    localStorage.getItem("agentToken") || localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
}
function requireAuth(){
  state.role = getRole(); state.token = getToken();
  if(state.token) return true;
  window.location.href = "login.html?next=" + encodeURIComponent("messages.html" + window.location.search);
  return false;
}
function authHeaders(extra={}){ return { ...(state.token ? {Authorization:"Bearer " + state.token} : {}), ...extra }; }
function esc(value=""){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function cleanText(value=""){ return String(value ?? "").trim(); }
function getId(value){ if(!value) return ""; return typeof value === "string" ? value : value._id || value.id || ""; }
function userDisplayName(user={}){ return user.companyName || user.schoolName || user.name || "AIFT User"; }
function userAvatar(user={}){ return user.profileImage || user.logo || user.avatar || FALLBACK_AVATAR; }
function userSubtitle(user={}){ return user.headline || user.profession || user.course || user.role || "AIFT member"; }
function readableRole(role=""){
  const map={talent:"Job Seeker",student:"Student",teacher:"Teacher",employer:"Employer",school:"School",agent:"Recruiter",admin:"Admin"};
  return map[String(role).toLowerCase()] || "AIFT Member";
}
function profileUrl(user={}){
  const id=getId(user), role=String(user.role||"").toLowerCase(); if(!id) return "home.html";
  if(role==="student") return `student-public-profile.html?id=${encodeURIComponent(id)}`;
  if(role==="teacher") return `teacher-public-profile.html?id=${encodeURIComponent(id)}`;
  if(role==="school") return `school-public-profile.html?id=${encodeURIComponent(id)}`;
  if(role==="employer") return `employer-public-profile.html?id=${encodeURIComponent(id)}`;
  return `agent-public-profile.html?id=${encodeURIComponent(id)}`;
}
function formatTime(value){
  if(!value) return ""; const date=new Date(value); if(Number.isNaN(date.getTime())) return ""; const now=new Date();
  return date.toDateString()===now.toDateString() ? date.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}) : date.toLocaleDateString([],{month:"short",day:"numeric"});
}
function formatMessageTime(value){ if(!value) return ""; const d=new Date(value); return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}); }
function formatDay(value){
  const d=new Date(value||Date.now()), today=new Date(), yesterday=new Date(); yesterday.setDate(today.getDate()-1);
  if(d.toDateString()===today.toDateString()) return "Today"; if(d.toDateString()===yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([],{month:"long",day:"numeric",year:"numeric"});
}
function fileSize(bytes=0){ const n=Number(bytes||0); if(n<1024) return n+" B"; if(n<1048576) return Math.round(n/1024)+" KB"; return (n/1048576).toFixed(1)+" MB"; }

async function api(path,options={}){
  const response=await fetch(API+path,{...options,headers:{...(options.headers||{})}}); const text=await response.text(); let data={};
  try{ data=text?JSON.parse(text):{}; }catch{ data={message:text}; }
  if(!response.ok) throw new Error(data.message||"Request failed"); return data;
}
async function apiJSON(path,method="GET",body=null){ return api(path,{method,headers:authHeaders({"Content-Type":"application/json"}),body:body?JSON.stringify(body):undefined}); }

function toast(message){ const el=document.getElementById("toast"); if(!el) return; el.textContent=message; el.classList.add("show"); clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>el.classList.remove("show"),2400); }
function openConfirmModal({title="Confirm action",text="Are you sure?",confirmText="Confirm",danger=false,onConfirm}={}){
  state.confirmCallback=typeof onConfirm==="function"?onConfirm:null; document.getElementById("confirmTitle").textContent=title; document.getElementById("confirmText").textContent=text;
  const btn=document.getElementById("confirmActionBtn"); btn.textContent=confirmText; btn.classList.toggle("danger",danger); btn.onclick=async()=>{const cb=state.confirmCallback;closeConfirmModal();if(cb)await cb();};
  document.getElementById("confirmModal").classList.remove("hidden");
}
function closeConfirmModal(){ state.confirmCallback=null; document.getElementById("confirmModal")?.classList.add("hidden"); }
function showConversationSidebar(){ document.getElementById("conversationSidebar")?.classList.remove("hidden-mobile"); }
function hideConversationSidebarOnMobile(){ if(window.innerWidth<=760) document.getElementById("conversationSidebar")?.classList.add("hidden-mobile"); }
function showEmptyState(){ document.getElementById("emptyState")?.classList.remove("hidden"); document.getElementById("messagesBox")?.classList.add("hidden"); hideJumpButton(); }
function showMessagesState(){ document.getElementById("emptyState")?.classList.add("hidden"); document.getElementById("messagesBox")?.classList.remove("hidden"); }
function setStatus(text){ const el=document.getElementById("activeConversationStatus"); if(el)el.textContent=text; }
function autoGrowComposer(){ const input=document.getElementById("messageInput"); if(!input)return; input.style.height="auto"; input.style.height=Math.min(input.scrollHeight,132)+"px"; }

function getMessagesBox(){ return document.getElementById("messagesBox"); }
function isNearBottom(threshold=120){ const box=getMessagesBox(); if(!box)return true; return box.scrollHeight-box.scrollTop-box.clientHeight<=threshold; }
function showJumpButton(label="New messages"){
  state.unreadBelow=true; const btn=document.getElementById("jumpToBottomBtn"); if(!btn)return; const span=btn.querySelector("span"); if(span)span.textContent=label; btn.classList.remove("hidden");
}
function hideJumpButton(){ state.unreadBelow=false; document.getElementById("jumpToBottomBtn")?.classList.add("hidden"); }
function scrollMessagesToBottom(behavior="smooth"){
  const box=getMessagesBox(); if(!box)return; requestAnimationFrame(()=>{ box.scrollTo({top:box.scrollHeight,behavior}); hideJumpButton(); });
}
function updateJumpButtonFromScroll(){ if(isNearBottom(80)) hideJumpButton(); }

function connectSocket(){
  if(state.socket) state.socket.disconnect();
  state.socket=io(API,{auth:{token:state.token},transports:["websocket","polling"]});
  state.socket.on("connect",()=>{ if(state.myId) state.socket.emit("join",{userId:state.myId,token:state.token}); registerCallSocketEvents(); });
  state.socket.on("connect_error",e=>console.warn("Socket connection error:",e.message));
  state.socket.on("userOnline",payload=>{
    if(!payload?.userId)return; state.onlineUsers.set(String(payload.userId),{online:!!payload.online,lastSeen:payload.lastSeen||null}); renderConversations();
    if(state.activeOtherUser&&String(getId(state.activeOtherUser))===String(payload.userId))updateActiveHeader();
  });
  state.socket.on("typing",payload=>{ const from=payload?.from||payload?.sender||""; if(state.activeOtherUser&&String(from)===String(getId(state.activeOtherUser)))setStatus("Typing..."); });
  state.socket.on("stopTyping",payload=>{ const from=payload?.from||payload?.sender||""; if(state.activeOtherUser&&String(from)===String(getId(state.activeOtherUser)))updateActiveHeader(); });
  state.socket.on("newMessage",handleRealtimeMessage);
  state.socket.on("messagesSeen",payload=>{
    const by=String(payload?.by||""); if(!by)return; let changed=false;
    state.messages.forEach(message=>{ if(isMyMessage(message)&&String(receiverId(message))===by&&message.status!=="seen"){ message.seen=true; message.seenAt=payload.seenAt||new Date().toISOString(); message.status="seen"; changed=true; } });
    if(changed) renderMessages({preserveViewport:true});
  });
  state.socket.on("messageSeen",payload=>updateSingleReceipt(payload,"seen"));
  state.socket.on("messageDelivered",payload=>updateSingleReceipt(payload,"delivered"));
  state.socket.on("messageDeleted",payload=>{
    if(!payload?.messageId)return; const item=state.messages.find(m=>String(messageId(m))===String(payload.messageId));
    if(item){ item.deletedForEveryone=true; item.text="This message was deleted"; item.fileUrl=""; item.fileType=""; item.attachments=[]; renderMessages({preserveViewport:true}); }
    loadConversations();
  });
  state.socket.on("messageEdited",message=>replaceMessage(message,true));
  state.socket.on("reactionUpdate",message=>replaceMessage(message,true));
  state.socket.on("conversationCreated",loadConversations); state.socket.on("conversationUpdated",loadConversations); state.socket.on("conversationRead",loadConversations);
  state.socket.on("meetingInvited",payload=>toast(payload?.title?`Meeting invitation: ${payload.title}`:"You have a new meeting invitation"));
}
function updateSingleReceipt(payload,status){
  const id=String(payload?.messageId||""); if(!id)return; const item=state.messages.find(m=>String(messageId(m))===id); if(!item||!isMyMessage(item))return;
  if(status==="seen"){item.seen=true;item.seenAt=payload.seenAt||new Date().toISOString();item.status="seen";}
  else if(item.status!=="seen"){item.deliveredAt=payload.deliveredAt||new Date().toISOString();item.status="delivered";}
  renderMessages({preserveViewport:true});
}
function replaceMessage(message,preserveViewport=false){ const i=state.messages.findIndex(m=>String(messageId(m))===String(messageId(message))); if(i!==-1){state.messages[i]=message;renderMessages({preserveViewport});} loadConversations(); }

async function loadMe(){ const data=await api("/api/users/me",{headers:authHeaders()}); state.me=data.user||data; state.myId=getId(state.me); if(state.myId)localStorage.setItem("userId",state.myId); if(state.me?.role)localStorage.setItem("role",state.me.role); }

let currentMediaUrl="", currentMediaType="image";
function openMediaViewer(url,type="image"){
  currentMediaUrl=url;currentMediaType=type;const modal=document.getElementById("mediaViewer"),image=document.getElementById("mediaViewerImage"),video=document.getElementById("mediaViewerVideo");
  image?.classList.add("hidden");video?.classList.add("hidden"); if(type==="video"){video.src=url;video.classList.remove("hidden");}else{image.src=url;image.classList.remove("hidden");}modal?.classList.remove("hidden");
}
function closeMediaViewer(){ document.getElementById("mediaViewer")?.classList.add("hidden"); const video=document.getElementById("mediaViewerVideo"); if(video){video.pause();video.src="";} }
async function downloadCurrentMedia(){ if(!currentMediaUrl)return toast("No media selected"); try{const r=await fetch(currentMediaUrl);if(!r.ok)throw new Error();const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="aift-media-"+Date.now();document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}catch{window.open(currentMediaUrl,"_blank");} }

function conversationId(c){return getId(c);} function getOtherParticipant(c){const p=(c?.participants||[]).find(item=>String(getId(item.user||item))!==String(state.myId));return p?.user||p||c?.user||null;}
function conversationTitle(c){if(!c)return"Conversation";if(c.displayName)return c.displayName;if(c.type!=="direct"&&c.title)return c.title;return userDisplayName(c.user||getOtherParticipant(c)||{});}
function conversationImage(c){if(!c)return FALLBACK_AVATAR;if(c.displayImage)return c.displayImage;if(c.type!=="direct"&&c.photo)return c.photo;return userAvatar(c.user||getOtherParticipant(c)||{});}
function conversationPreview(c){const last=c?.lastMessage;if(typeof last==="string")return last||"Start a conversation";if(last?.text)return last.text;const map={image:"Photo",video:"Video",audio:"Voice message",document:"Document",meeting:"Meeting"};return map[last?.messageType]||"Start a conversation";}
function conversationUpdatedAt(c){return c.lastMessageDate||c.lastMessage?.createdAt||c.updatedAt||c.createdAt;} function isConversationOnline(c){const id=getId(c.user||getOtherParticipant(c));return !!id&&state.onlineUsers.get(String(id))?.online===true;}
async function loadConversations(){
  const q=new URLSearchParams();if(state.conversationFilter==="archived")q.set("archived","true");if(state.conversationFilter==="unread")q.set("unread","true");if(state.conversationFilter==="pinned")q.set("pinned","true");if(state.conversationSearch)q.set("search",state.conversationSearch);
  const data=await api("/api/conversations"+(q.toString()?"?"+q:""),{headers:authHeaders()});state.conversations=Array.isArray(data)?data:data.conversations||[];applyConversationFilter();renderConversations();
}
function applyConversationFilter(){
  let list=[...state.conversations];if(state.conversationFilter==="all")list=list.filter(x=>!x.archived);if(state.conversationFilter==="archived")list=list.filter(x=>x.archived);if(state.conversationFilter==="pinned")list=list.filter(x=>x.pinned&&!x.archived);if(state.conversationFilter==="unread")list=list.filter(x=>Number(x.unreadCount||x.unread||0)>0);
  if(state.conversationSearch){const q=state.conversationSearch.toLowerCase();list=list.filter(x=>[conversationTitle(x),conversationPreview(x),userSubtitle(x.user||{})].join(" ").toLowerCase().includes(q));}
  list.sort((a,b)=>Boolean(a.pinned)!==Boolean(b.pinned)?(a.pinned?-1:1):new Date(conversationUpdatedAt(b)||0)-new Date(conversationUpdatedAt(a)||0));state.filteredConversations=list;
}
function renderConversations(){
  const box=document.getElementById("conversationList");if(!box)return;applyConversationFilter();if(!state.filteredConversations.length){box.innerHTML='<div class="empty-list">No conversations found.</div>';return;}
  box.innerHTML=state.filteredConversations.map(c=>{const id=conversationId(c),active=state.activeConversation&&String(conversationId(state.activeConversation))===String(id),unread=Number(c.unreadCount||c.unread||0),online=isConversationOnline(c);
    return `<article class="conversation-item ${active?"active":""}" onclick="openConversation('${esc(id)}')"><div class="conversation-avatar-wrap"><img class="conversation-avatar" src="${esc(conversationImage(c))}" alt="">${online?'<span class="online-dot"></span>':''}</div><div class="conversation-main"><div class="conversation-top"><div class="conversation-name">${esc(conversationTitle(c))}</div><div class="conversation-time">${esc(formatTime(conversationUpdatedAt(c)))}</div></div><div class="conversation-preview">${esc(conversationPreview(c))}</div><div class="conversation-meta-row">${c.pinned?'<span class="mini-pill blue">Pinned</span>':''}${c.muted?'<span class="mini-pill">Muted</span>':''}${c.type&&c.type!=="direct"?`<span class="mini-pill">${esc(c.type)}</span>`:''}${unread?`<span class="unread-count">${unread>99?'99+':unread}</span>`:''}</div></div></article>`;
  }).join("");
}
function setConversationFilter(filter,button){state.conversationFilter=filter;document.querySelectorAll(".conversation-tabs button").forEach(x=>x.classList.remove("active"));button?.classList.add("active");loadConversations();}

async function openConversation(id){
  if(!id)return;try{showMessagesState();hideConversationSidebarOnMobile();state.isLoadingMessages=true;state.messages=[];state.messagesPageBefore=null;state.hasMoreMessages=true;hideJumpButton();
    const c=await api(`/api/conversations/${encodeURIComponent(id)}`,{headers:authHeaders()});state.activeConversation=c;state.activeOtherUser=c.user||getOtherParticipant(c)||null;updateActiveHeader();renderMessagesSkeleton();
    const messages=await api(`/api/conversations/${encodeURIComponent(id)}/messages?limit=60`,{headers:authHeaders()});state.messages=Array.isArray(messages)?messages:messages.messages||[];state.messagesPageBefore=state.messages[0]?.createdAt||null;state.hasMoreMessages=state.messages.length>=60;renderMessages({stickToBottom:true});
    await markConversationRead(id);await loadConversations();
  }catch(error){console.error(error);toast(error.message||"Unable to open conversation");showEmptyState();}finally{state.isLoadingMessages=false;}
}
function updateActiveHeader(){
  const c=state.activeConversation,o=state.activeOtherUser||{},title=c?conversationTitle(c):"Messages",avatar=c?conversationImage(c):FALLBACK_AVATAR;document.getElementById("activeConversationTitle").textContent=title;document.getElementById("activeUserImage").src=avatar;
  if(!c){setStatus("Select a conversation");return;}const online=getId(o)&&state.onlineUsers.get(String(getId(o)))?.online;setStatus(online?"Online":(c.type==="direct"?userSubtitle(o):`${c.participants?.length||0} participants`));
  document.getElementById("drawerUserImage").src=avatar;document.getElementById("drawerUserName").textContent=title;document.getElementById("drawerUserMeta").textContent=c.type==="direct"?`${readableRole(o.role)} • ${userSubtitle(o)}`:`${c.type||"Group"} conversation`;
}
async function markConversationRead(id){
  try{await apiJSON(`/api/conversations/${encodeURIComponent(id)}/read`,"PATCH",{});}catch(e){console.warn("Conversation read failed:",e.message);}
  const otherId=getId(state.activeOtherUser);if(otherId){try{await apiJSON(`/api/messages/seen/${encodeURIComponent(otherId)}`,"PATCH",{});}catch(e){console.warn("Message seen update failed:",e.message);}}
}

function senderId(m){return getId(m.sender);}function receiverId(m){return getId(m.receiver);}function isMyMessage(m){return String(senderId(m))===String(state.myId);}function messageId(m){return getId(m)||m._id||"";}
function renderMessagesSkeleton(){const box=getMessagesBox();if(box)box.innerHTML='<div class="day-divider">Loading messages</div>';}
function renderMessages({stickToBottom=false,preserveViewport=false}={}){
  const box=getMessagesBox();if(!box)return;const oldHeight=box.scrollHeight,oldTop=box.scrollTop,wasNearBottom=isNearBottom();
  if(!state.messages.length){box.innerHTML='<div class="day-divider">No messages yet</div>';hideJumpButton();return;}
  let lastDay="";const frag=document.createDocumentFragment();state.messages.forEach((message,index)=>{const day=formatDay(message.createdAt||Date.now());if(day!==lastDay){const d=document.createElement("div");d.className="day-divider";d.textContent=day;frag.appendChild(d);lastDay=day;}const node=createMessageNode(message);const prev=state.messages[index-1],next=state.messages[index+1];if(prev&&formatDay(prev.createdAt)===day&&senderId(prev)===senderId(message))node.classList.add("grouped-prev");if(next&&formatDay(next.createdAt)===day&&senderId(next)===senderId(message))node.classList.add("grouped-next");frag.appendChild(node);});box.replaceChildren(frag);
  requestAnimationFrame(()=>{if(stickToBottom){box.scrollTop=box.scrollHeight;hideJumpButton();}else if(preserveViewport){box.scrollTop=Math.max(0,oldTop+(box.scrollHeight-oldHeight));}else if(wasNearBottom){box.scrollTop=box.scrollHeight;hideJumpButton();}});
}
function createMessageNode(message){
  const mine=isMyMessage(message);if(message.messageType==="system"){const s=document.createElement("div");s.className="system-message";s.textContent=message.text||"System update";return s;}
  const row=document.createElement("div");row.className="message-row "+(mine?"me":"other");const bubble=document.createElement("article");bubble.className="message-bubble "+(mine?"me":"other");bubble.dataset.messageId=messageId(message);bubble.onclick=e=>{e.stopPropagation();selectMessage(message,bubble);};bubble.innerHTML=replyPreviewHtml(message)+messageContentHtml(message)+messageMetaHtml(message,mine);row.appendChild(bubble);return row;
}
function replyPreviewHtml(message){const r=message.replyTo;if(!r)return"";const name=r.sender?.name||r.sender?.companyName||r.sender?.schoolName||"Reply";return `<div class="reply-preview"><strong>${esc(name)}</strong><span>${esc(r.text||r.messageType||"Message")}</span></div>`;}
function storyReplyAttachmentHtml(message){
  const story=message?.metadata?.storyReply;if(!story)return"";const url=story.mediaUrl||"",type=story.mediaType||"text",media=url?(type==="video"?`<video src="${esc(url)}" muted playsinline preload="metadata"></video>`:`<img src="${esc(url)}" alt="Story preview" loading="lazy">`):'<div class="story-reply-placeholder"></div>';return `<div class="story-reply-attachment" aria-label="Story reply preview">${media}<div class="story-reply-preview-blur"></div><div class="story-reply-preview-label"><span>Replied to your story</span><strong>${esc(story.previewText||"Story")}</strong></div></div>`;
}
function messageContentHtml(message){
  if(message.messageType==="meeting"&&message.meetingInvite)return meetingInviteHtml(message);if(message.deletedForEveryone)return '<div class="message-deleted">This message was deleted</div>';const parts=[],storyCard=storyReplyAttachmentHtml(message);if(storyCard)parts.push(storyCard);if(message.text)parts.push(`<div class="message-text">${esc(message.text)}</div>`);const a=getPrimaryAttachment(message);if(a)parts.push(attachmentHtml(a,message));if(!parts.length)parts.push('<div class="message-text">Message</div>');return parts.join("");
}
function meetingInviteHtml(message){const i=message.meetingInvite||{};return `<div class="meeting-invite-card"><div class="meeting-invite-header"><img src="${esc(i.logoUrl||'images/aift-logo.png')}" class="meeting-invite-logo" alt=""><div><strong>${esc(i.title||"AIFT Meeting")}</strong><div class="meeting-invite-host">Hosted by ${esc(i.hostName||"AIFT")}</div></div></div><div class="meeting-code-box">Meeting Code: <strong>${esc(i.meetingCode||"")}</strong></div><button class="meeting-join-btn" onclick="event.stopPropagation();showMeetingComingSoon()">Join Meeting</button></div>`;}
function joinMeetingInvite(){showMeetingComingSoon();}function showMeetingComingSoon(){document.getElementById("meetingComingSoonModal")?.classList.remove("hidden");}function closeMeetingComingSoon(){document.getElementById("meetingComingSoonModal")?.classList.add("hidden");}function showMeetingComingSoonModal(){showMeetingComingSoon();}
function getPrimaryAttachment(message){if(Array.isArray(message.attachments)&&message.attachments.length)return message.attachments[0];if(message.fileUrl||message.mediaUrl)return{url:message.fileUrl||message.mediaUrl,secureUrl:message.fileUrl||message.mediaUrl,type:normalizeAttachmentType(message.fileType||message.mediaType||""),mimeType:message.fileType||message.mediaType||"",originalName:message.fileName||"Attachment",size:message.fileSize||0};return null;}
function normalizeAttachmentType(type=""){const t=String(type).toLowerCase();if(t.includes("image"))return"image";if(t.includes("video"))return"video";if(t.includes("audio"))return"audio";if(t.includes("pdf")||t.includes("document"))return"document";return t||"file";}
function attachmentHtml(a,message){const url=a.secureUrl||a.url||"";if(!url)return"";const type=normalizeAttachmentType(a.type||a.mimeType||message.fileType||""),name=a.originalName||message.fileName||"Attachment";
  if(type==="image")return `<div style="position:relative"><img class="message-file-image" src="${esc(url)}" alt="${esc(name)}" loading="lazy" onclick="event.stopPropagation();openMediaViewer('${esc(url)}','image')">${!isMyMessage(message)?`<button class="asset-save-btn" onclick="event.stopPropagation();saveReceivedAssetById('${esc(messageId(message))}')">+</button>`:""}</div>`;
  if(type==="video")return `<video class="message-file-video" src="${esc(url)}" controls onclick="event.stopPropagation();openMediaViewer('${esc(url)}','video')"></video>`;
  if(type==="audio")return `<audio class="message-file-audio" src="${esc(url)}" controls></audio>`;
  return `<a class="file-card" href="${esc(url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path></svg><div><strong>${esc(name)}</strong><span>${esc(fileSize(a.size||message.fileSize||0))}</span></div></a>`;
}
function messageMetaHtml(message,mine){
  const edited=message.isEdited||message.editedAt;let status="";if(mine){if(message.status==="failed")status='<button class="status-failed" type="button" onclick="event.stopPropagation();retryFailedMessage(this.closest(\'.message-bubble\')?.dataset.messageId)">Failed · Retry</button>';else if(message.seen||message.status==="seen")status='<span class="status-read">Read</span>';else if(message.status==="delivered"||message.deliveredAt||(Array.isArray(message.deliveredTo)&&message.deliveredTo.length))status='<span>Delivered</span>';else if(message.status==="sending")status='<span>Sending…</span>';else status='<span>Sent</span>';}
  return `<div class="message-meta">${edited?'<span>Edited</span>':''}<span>${esc(formatMessageTime(message.createdAt))}</span>${status}</div>`;
}
async function loadOlderMessages(){
  if(state.isLoadingMessages||!state.hasMoreMessages||!state.activeConversation||!state.messagesPageBefore)return;const box=getMessagesBox();if(!box)return;const oldHeight=box.scrollHeight,oldTop=box.scrollTop;
  try{state.isLoadingMessages=true;const id=conversationId(state.activeConversation),older=await api(`/api/conversations/${encodeURIComponent(id)}/messages?limit=40&before=${encodeURIComponent(state.messagesPageBefore)}`,{headers:authHeaders()}),list=Array.isArray(older)?older:older.messages||[];if(!list.length){state.hasMoreMessages=false;return;}const ids=new Set(state.messages.map(x=>String(messageId(x)))),unique=list.filter(x=>!ids.has(String(messageId(x))));state.messages=[...unique,...state.messages];state.messagesPageBefore=state.messages[0]?.createdAt||null;if(list.length<40)state.hasMoreMessages=false;renderMessages();requestAnimationFrame(()=>{box.scrollTop=oldTop+(box.scrollHeight-oldHeight);});}catch(e){console.warn("Load older messages failed:",e.message);}finally{state.isLoadingMessages=false;}
}

function selectMessage(message,bubble){clearSelectedMessage();state.selectedMessage={id:messageId(message),text:message.text||"",mine:isMyMessage(message),message};bubble.classList.add("selected");document.getElementById("messageActionBar")?.classList.remove("hidden");}
function clearSelectedMessage(){state.selectedMessage=null;document.querySelectorAll(".message-bubble.selected").forEach(x=>x.classList.remove("selected"));document.getElementById("messageActionBar")?.classList.add("hidden");}
function replyToSelectedMessage(){if(!state.selectedMessage)return;const m=state.selectedMessage.message,sender=state.selectedMessage.mine?"You":conversationTitle(state.activeConversation);state.replyTo={id:state.selectedMessage.id,text:m.text||getPrimaryAttachment(m)?.originalName||"Message",sender};document.getElementById("replyTitle").textContent="Replying to "+sender;document.getElementById("replyText").textContent=state.replyTo.text;document.getElementById("replyBar")?.classList.remove("hidden");clearSelectedMessage();document.getElementById("messageInput")?.focus();}
function clearReply(){state.replyTo=null;document.getElementById("replyBar")?.classList.add("hidden");document.getElementById("replyTitle").textContent="Replying";document.getElementById("replyText").textContent="";}

function makeTempMessage({text,file,receiverId,tempId,replyTo,url,mimeType,title}){const objectUrl=file?URL.createObjectURL(file):(url||"");return{_id:tempId,sender:{_id:state.myId,name:"You"},receiver:{_id:receiverId},text:text||"",fileUrl:objectUrl,fileType:file?.type||mimeType||"",fileName:file?.name||title||"",fileSize:file?.size||0,attachments:objectUrl?[{url:objectUrl,secureUrl:objectUrl,type:normalizeAttachmentType(file?.type||mimeType||""),mimeType:file?.type||mimeType||"",originalName:file?.name||title||"Attachment",size:file?.size||0}]:[],replyTo:replyTo?{text:replyTo.text,sender:{name:replyTo.sender}}:null,messageType:objectUrl?normalizeAttachmentType(file?.type||mimeType||""):"text",status:"sending",seen:false,createdAt:new Date().toISOString(),metadata:{clientMessageId:tempId},_retry:{text:text||"",file:file||null,receiverId,replyTo:replyTo||null,url:url||"",mimeType:mimeType||"",title:title||""}};}
async function sendMessage(){
  const input=document.getElementById("messageInput"),text=cleanText(input?.value||""),file=state.attachment;if(state.isSending||(!text&&!file))return;if(!state.activeConversation)return toast("Select a conversation first");const other=state.activeOtherUser||getOtherParticipant(state.activeConversation),rid=getId(other);if(!rid)return toast("Unable to find receiver");
  state.isSending=true;const btn=document.querySelector(".send-btn");if(btn)btn.disabled=true;const tempId="client-"+Date.now()+"-"+Math.random().toString(36).slice(2),reply=state.replyTo;const temp=makeTempMessage({text,file,receiverId:rid,tempId,replyTo:reply});state.messages.push(temp);renderMessages({stickToBottom:true});
  const form=new FormData();form.append("receiverId",rid);if(text)form.append("text",text);if(file)form.append("file",file);if(reply?.id)form.append("replyTo",reply.id);form.append("clientMessageId",tempId);if(input)input.value="";autoGrowComposer();clearAttachment();clearReply();
  try{const saved=await api("/api/messages",{method:"POST",headers:authHeaders(),body:form});replaceTempMessage(tempId,saved.message||saved);safePlay(state.messageSentTone);await loadConversations();}catch(e){const failed=state.messages.find(x=>String(messageId(x))===String(tempId));if(failed){failed.status="failed";renderMessages({preserveViewport:true});}toast(e.message||"Message failed to send");}finally{state.isSending=false;if(btn)btn.disabled=false;}
}
function replaceTempMessage(tempId,saved){const i=state.messages.findIndex(x=>String(messageId(x))===String(tempId)||String(x?.metadata?.clientMessageId||"")===String(tempId));if(i!==-1)state.messages[i]=saved;renderMessages({stickToBottom:true});}
async function retryFailedMessage(id){const failed=state.messages.find(x=>String(messageId(x))===String(id));if(!failed?._retry)return toast("This message can no longer be retried");if(state.isSending)return;const r=failed._retry;state.messages=state.messages.filter(x=>x!==failed);if(r.file){state.attachment=r.file;renderAttachmentPreview(r.file);}if(r.replyTo)state.replyTo=r.replyTo;const input=document.getElementById("messageInput");if(input)input.value=r.text||"";await sendMessage();}

function toggleAttachmentMenu(){document.getElementById("attachmentMenu")?.classList.toggle("hidden");}
function chooseAttachment(type){const input=document.getElementById("fileInput");if(!input)return;const accepts={image:"image/*",video:"video/*",audio:"audio/*",document:".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"};input.accept=accepts[type]||"*/*";document.getElementById("attachmentMenu")?.classList.add("hidden");input.click();}
function handleAttachmentSelected(file){if(!file)return;if(file.size>50*1024*1024)return toast("File is too large. Maximum size is 50MB.");state.attachment=file;renderAttachmentPreview(file);}
function renderAttachmentPreview(file){const box=document.getElementById("attachmentPreview");if(!box)return;const type=normalizeAttachmentType(file.type),url=URL.createObjectURL(file),preview=type==="image"?`<img src="${esc(url)}" alt="">`:type==="video"?`<video src="${esc(url)}" controls></video>`:'<div class="preview-file-icon">▤</div>';box.innerHTML=`<div class="preview-card">${preview}<div class="preview-info"><strong>${esc(file.name)}</strong><span>${esc(fileSize(file.size))}</span></div><button onclick="clearAttachment()">Remove</button></div>`;box.classList.remove("hidden");}
function clearAttachment(){state.attachment=null;const input=document.getElementById("fileInput");if(input)input.value="";const box=document.getElementById("attachmentPreview");if(box){box.classList.add("hidden");box.innerHTML="";}}

function handleRealtimeMessage(message){
  if(!message)return;const mine=String(senderId(message))===String(state.myId);if(!mine)safePlay(state.messageTone);const activeId=state.activeConversation?conversationId(state.activeConversation):"",msgCid=getId(message.conversationId),sameConversation=activeId&&msgCid&&String(activeId)===String(msgCid),otherId=getId(state.activeOtherUser),sameDirect=otherId&&(String(senderId(message))===String(otherId)||String(receiverId(message))===String(otherId));
  if(sameConversation||sameDirect){const clientId=message?.metadata?.clientMessageId||"",tempIndex=clientId?state.messages.findIndex(x=>String(x?.metadata?.clientMessageId||"")===String(clientId)):-1;if(tempIndex!==-1){state.messages[tempIndex]=message;renderMessages({stickToBottom:mine||isNearBottom()});}else if(!state.messages.some(x=>String(messageId(x))===String(messageId(message)))){const shouldStick=mine||isNearBottom();state.messages.push(message);renderMessages({stickToBottom:shouldStick});if(!shouldStick)showJumpButton("New message");}
    if(!mine&&state.socket&&messageId(message))state.socket.emit("messageDelivered",{messageId:messageId(message),to:senderId(message)});if(activeId){markConversationRead(activeId);if(!mine&&messageId(message))state.socket?.emit("messageSeen",{messageId:messageId(message),to:senderId(message)});} }
  loadConversations();
}

function openNewChatMode(){document.getElementById("newChatPanel")?.classList.remove("hidden");setTimeout(()=>document.getElementById("userSearchInput")?.focus(),80);}function closeNewChatMode(){document.getElementById("newChatPanel")?.classList.add("hidden");const i=document.getElementById("userSearchInput"),r=document.getElementById("userSearchResults");if(i)i.value="";if(r)r.innerHTML="";}
async function searchUsers(query){const q=cleanText(query),box=document.getElementById("userSearchResults");if(!box)return;if(q.length<2){box.innerHTML='<div class="empty-list">Type at least 2 letters to search.</div>';return;}box.innerHTML='<div class="loading-card">Searching...</div>';try{const data=await api(`/api/users/network?search=${encodeURIComponent(q)}&limit=12`,{headers:authHeaders()}),users=(Array.isArray(data)?data:data.users||data.results||[]).filter(u=>String(getId(u))!==String(state.myId));renderUserSearchResults(users);}catch(e){box.innerHTML=`<div class="empty-list">${esc(e.message||"Unable to search users")}</div>`;}}
function renderUserSearchResults(users){const box=document.getElementById("userSearchResults");if(!box)return;if(!users.length){box.innerHTML='<div class="empty-list">No users found.</div>';return;}box.innerHTML=users.map(u=>`<article class="conversation-item" onclick="createDirectConversation('${esc(getId(u))}')"><div class="conversation-avatar-wrap"><img class="conversation-avatar" src="${esc(userAvatar(u))}" alt=""></div><div class="conversation-main"><div class="conversation-top"><div class="conversation-name">${esc(userDisplayName(u))}</div></div><div class="conversation-preview">${esc(readableRole(u.role))} • ${esc(userSubtitle(u))}</div></div></article>`).join("");}
async function createDirectConversation(userId){try{const c=await apiJSON("/api/conversations/direct","POST",{userId});closeNewChatMode();await loadConversations();await openConversation(conversationId(c));}catch(e){toast(e.message||"Unable to start conversation");}}

async function copySelectedMessage(){if(!state.selectedMessage)return;const text=state.selectedMessage.text||state.selectedMessage.message?.text||"";if(!text)return toast("No text to copy");try{await navigator.clipboard.writeText(text);toast("Message copied");clearSelectedMessage();}catch{toast("Unable to copy message");}}
async function starSelectedMessage(){if(!state.selectedMessage?.id)return;try{await apiJSON(`/api/messages/${encodeURIComponent(state.selectedMessage.id)}/star`,"PATCH",{});toast("Message updated");clearSelectedMessage();}catch(e){toast(e.message||"Unable to update message");}}
function deleteSelectedMessageForMe(){const id=state.selectedMessage?.id;if(!id)return;openConfirmModal({title:"Delete message for you",text:"This message will be removed from your view only.",confirmText:"Delete",danger:true,onConfirm:async()=>{try{await apiJSON(`/api/messages/${encodeURIComponent(id)}/delete-for-me`,"PATCH",{});state.messages=state.messages.filter(x=>String(messageId(x))!==String(id));clearSelectedMessage();renderMessages({preserveViewport:true});toast("Message deleted");}catch(e){toast(e.message||"Unable to delete message");}}});}
function deleteSelectedMessageForEveryone(){const id=state.selectedMessage?.id;if(!id)return;if(!state.selectedMessage.mine)return toast("Only the sender can delete this message for everyone");openConfirmModal({title:"Delete message for everyone",text:"This will remove the message for everyone in this conversation.",confirmText:"Delete",danger:true,onConfirm:async()=>{try{await apiJSON(`/api/messages/${encodeURIComponent(id)}/delete-for-everyone`,"PATCH",{});const m=state.messages.find(x=>String(messageId(x))===String(id));if(m){m.deletedForEveryone=true;m.text="This message was deleted";m.attachments=[];m.fileUrl="";}clearSelectedMessage();renderMessages({preserveViewport:true});toast("Message deleted for everyone");}catch(e){toast(e.message||"Unable to delete message");}}});}

async function patchConversationSetting(action){if(!state.activeConversation)return toast("Select a conversation first");const id=conversationId(state.activeConversation);return apiJSON(`/api/conversations/${encodeURIComponent(id)}/${action}`,"PATCH",{});}
async function toggleActivePin(){try{const s=await patchConversationSetting("pin");state.activeConversation.pinned=!!s.pinned;toast(s.pinned?"Conversation pinned":"Conversation unpinned");closeChatInfo();await loadConversations();}catch(e){toast(e.message||"Unable to update pin");}}
async function toggleActiveMute(){try{const s=await patchConversationSetting("mute");state.activeConversation.muted=!!s.muted;toast(s.muted?"Conversation muted":"Conversation unmuted");closeChatInfo();await loadConversations();}catch(e){toast(e.message||"Unable to update mute");}}
function archiveActiveConversation(){if(!state.activeConversation)return toast("Select a conversation first");openConfirmModal({title:"Archive conversation",text:"This conversation will move to your archived messages.",confirmText:"Archive",onConfirm:async()=>{try{await patchConversationSetting("archive");closeChatInfo();state.activeConversation=null;state.activeOtherUser=null;showEmptyState();await loadConversations();toast("Conversation archived");}catch(e){toast(e.message||"Unable to archive conversation");}}});}
function blockActiveConversation(){if(!state.activeConversation)return toast("Select a conversation first");openConfirmModal({title:"Block conversation",text:"You will stop receiving messages from this conversation.",confirmText:"Block",danger:true,onConfirm:async()=>{try{await patchConversationSetting("block");closeChatInfo();state.activeConversation=null;state.activeOtherUser=null;showEmptyState();await loadConversations();toast("Conversation blocked");}catch(e){toast(e.message||"Unable to block conversation");}}});}
function openChatInfo(){if(!state.activeConversation)return toast("Select a conversation first");updateActiveHeader();document.getElementById("chatInfoDrawer")?.classList.remove("hidden");}function closeChatInfo(){document.getElementById("chatInfoDrawer")?.classList.add("hidden");}function openActiveProfile(){if(!state.activeOtherUser)return toast("No profile available");window.location.href=profileUrl(state.activeOtherUser);}
function openSharedFilesPanel(){const files=state.messages.filter(m=>getPrimaryAttachment(m));if(!files.length)return toast("No shared files in this conversation");const a=getPrimaryAttachment(files.at(-1)),url=a?.secureUrl||a?.url;if(url)window.open(url,"_blank");}

const DEFAULT_EMOJIS=["😀","😁","😄","😊","🙂","😉","😎","😅","😂","🤣","😍","🥰","😘","😇","🤝","👏","👍","👎","🙏","💪","🔥","⭐","💙","💚","❤️","💼","📚","🎓","🏫","📝","📌","✅","📞","🎥","📎","📄","📷","💡","🚀","🎯"];
const DEFAULT_GIFS=[{title:"Good job",url:"https://media.giphy.com/media/ely3apij36BJhoZ234/giphy.gif"},{title:"Congratulations",url:"https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif"},{title:"Thank you",url:"https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif"},{title:"Welcome",url:"https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif"}];
function toggleChatPicker(){const p=document.getElementById("chatPicker");if(!p)return;state.pickerOpen=p.classList.contains("hidden");p.classList.toggle("hidden",!state.pickerOpen);if(state.pickerOpen){renderEmojiPanel();if(state.pickerTab==="gif")renderGifGrid(DEFAULT_GIFS);if(state.pickerTab==="sticker")loadSavedStickers();}}
function closeChatPicker(){state.pickerOpen=false;document.getElementById("chatPicker")?.classList.add("hidden");}
function switchPickerTab(tab,button){state.pickerTab=tab;document.querySelectorAll(".picker-tabs button").forEach(x=>x.classList.remove("active"));button?.classList.add("active");["emojiPanel","gifPanel","stickerPanel"].forEach(id=>document.getElementById(id)?.classList.add("hidden"));document.getElementById(tab+"Panel")?.classList.remove("hidden");if(tab==="emoji")renderEmojiPanel();if(tab==="gif")renderGifGrid(DEFAULT_GIFS);if(tab==="sticker")loadSavedStickers();}
function renderEmojiPanel(){const p=document.getElementById("emojiPanel");if(p)p.innerHTML=`<div class="emoji-grid">${DEFAULT_EMOJIS.map(e=>`<button class="emoji-btn" onclick="insertEmoji('${e}')" type="button">${e}</button>`).join("")}</div>`;}
function insertEmoji(emoji){const i=document.getElementById("messageInput");if(!i)return;const s=i.selectionStart||0,e=i.selectionEnd||0;i.value=i.value.slice(0,s)+emoji+i.value.slice(e);i.focus();i.setSelectionRange(s+emoji.length,s+emoji.length);autoGrowComposer();}
function renderGifGrid(gifs=[]){const g=document.getElementById("gifGrid");if(g)g.innerHTML=(gifs.length?gifs:DEFAULT_GIFS).map(a=>`<article class="asset-card" onclick="sendRemoteAsset('${esc(a.url)}','gif','${esc(a.title||'GIF')}')"><img src="${esc(a.url)}" alt=""><span class="asset-label">${esc(a.title||'GIF')}</span></article>`).join("");}
function searchGifLocal(q){q=cleanText(q).toLowerCase();renderGifGrid(q?DEFAULT_GIFS.filter(x=>x.title.toLowerCase().includes(q)):DEFAULT_GIFS);}
async function loadSavedStickers(){const g=document.getElementById("stickerGrid");if(!g)return;g.innerHTML='<div class="asset-empty">Loading your stickers...</div>';try{const d=await api("/api/chat-assets?type=sticker",{headers:authHeaders()});state.savedStickers=Array.isArray(d)?d:[];g.innerHTML=state.savedStickers.length?state.savedStickers.map(a=>`<article class="asset-card" onclick="sendRemoteAsset('${esc(a.url)}','sticker','${esc(a.title||'Sticker')}')"><img src="${esc(a.url)}" alt=""><span class="asset-label">${esc(a.title||'Sticker')}</span></article>`).join(""):'<div class="asset-empty">No stickers yet.</div>';}catch(e){g.innerHTML=`<div class="asset-empty">${esc(e.message)}</div>`;}}
function importSticker(){document.getElementById("stickerImportInput")?.click();}
async function handleStickerImport(file){if(!file)return;const form=new FormData();form.append("file",file);form.append("type","sticker");form.append("title",file.name||"Sticker");form.append("source","uploaded");try{await api("/api/chat-assets",{method:"POST",headers:authHeaders(),body:form});await loadSavedStickers();toast("Sticker imported");}catch(e){toast(e.message||"Unable to import sticker");}}
async function sendRemoteAsset(url,type,title){if(!state.activeConversation)return toast("Select a conversation first");const rid=getId(state.activeOtherUser||getOtherParticipant(state.activeConversation));if(!rid)return;const tempId="client-"+Date.now(),mime=type==="gif"?"image/gif":"image/webp",temp=makeTempMessage({text:"",receiverId:rid,tempId,url,mimeType:mime,title});state.messages.push(temp);renderMessages({stickToBottom:true});try{const form=new FormData();form.append("receiverId",rid);form.append("fileUrl",url);form.append("fileType",mime);form.append("fileName",title||type);form.append("clientMessageId",tempId);const saved=await api("/api/messages",{method:"POST",headers:authHeaders(),body:form});replaceTempMessage(tempId,saved.message||saved);closeChatPicker();await loadConversations();}catch(e){temp.status="failed";renderMessages({preserveViewport:true});toast(e.message||"Unable to send asset");}}
async function saveReceivedAssetById(id){const m=state.messages.find(x=>String(messageId(x))===String(id));if(!m)return toast("Message not found");const a=getPrimaryAttachment(m),url=a?.secureUrl||a?.url;if(!url)return;try{await apiJSON("/api/chat-assets","POST",{type:"sticker",title:a.originalName||"Saved sticker",url,mimeType:a.mimeType||m.fileType||"",source:"saved_from_chat",originalMessageId:messageId(m)});toast("Saved to your stickers");}catch(e){toast(e.message||"Unable to save sticker");}}
function saveReceivedAsset(message){saveReceivedAssetById(messageId(message));}

let cameraStream=null,cameraFacingMode="environment";
async function openCameraCapture(){try{document.getElementById("cameraModal")?.classList.remove("hidden");cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:cameraFacingMode},audio:false});document.getElementById("cameraVideo").srcObject=cameraStream;}catch{document.getElementById("cameraInput")?.click();}}
function closeCameraModal(){cameraStream?.getTracks().forEach(t=>t.stop());cameraStream=null;document.getElementById("cameraModal")?.classList.add("hidden");}
async function switchCamera(){cameraFacingMode=cameraFacingMode==="environment"?"user":"environment";closeCameraModal();await openCameraCapture();}
function captureCameraPhoto(){const v=document.getElementById("cameraVideo"),c=document.getElementById("cameraCanvas");if(!v||!c)return;c.width=v.videoWidth;c.height=v.videoHeight;c.getContext("2d").drawImage(v,0,0,c.width,c.height);c.toBlob(blob=>{if(!blob)return;const f=new File([blob],"camera-photo-"+Date.now()+".jpg",{type:"image/jpeg"});state.attachment=f;renderAttachmentPreview(f);closeCameraModal();},"image/jpeg",.92);}
function handleCameraCapture(file){if(file){state.attachment=file;renderAttachmentPreview(file);}}

const RTC_CONFIG={iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]};
function setupAiftSounds(){state.ringtone=new Audio("audio/ringtone.mp3");state.outgoingTone=new Audio("audio/calling.mp3");state.callEndTone=new Audio("audio/call-end.mp3");state.messageTone=new Audio("audio/message.mp3");state.messageSentTone=new Audio("audio/message-sent.mp3");state.busyTone=new Audio("audio/busy.mp3");state.ringtone.loop=true;state.outgoingTone.loop=true;[state.ringtone,state.outgoingTone,state.callEndTone,state.messageTone,state.messageSentTone,state.busyTone].forEach(a=>{if(a)a.volume=.55;});}
function safePlay(audio,loop=false){if(!audio)return;try{audio.loop=loop;audio.currentTime=0;audio.play()?.catch(()=>{});}catch{}}
function stopSound(audio){if(!audio)return;try{audio.pause();audio.currentTime=0;audio.loop=false;}catch{}}
function getCallTarget(){if(!state.activeConversation||!state.activeOtherUser){toast("Select a conversation first");return null;}const userId=getId(state.activeOtherUser);return userId?{userId,name:userDisplayName(state.activeOtherUser),avatar:userAvatar(state.activeOtherUser),conversationId:conversationId(state.activeConversation)}:null;}
function updateCallUI({name,avatar,status,type="audio",waiting=true}={}){document.getElementById("callName").textContent=name||"AIFT Call";document.getElementById("callStatus").textContent=status||"Connecting...";document.getElementById("callAvatar").src=avatar||FALLBACK_AVATAR;document.getElementById("callWaitingAvatar").src=avatar||FALLBACK_AVATAR;document.getElementById("callWaitingName").textContent=name||"Calling...";document.getElementById("callWaitingState")?.classList.toggle("hidden",!waiting);document.getElementById("cameraBtn")?.classList.toggle("hidden",type==="audio");}
function openCallModal(){document.getElementById("callModal")?.classList.remove("hidden");}function closeCallModal(){document.getElementById("callModal")?.classList.add("hidden");}
function openIncomingCallModal(p){document.getElementById("incomingAvatar").src=p.callerAvatar||p.avatar||FALLBACK_AVATAR;document.getElementById("incomingCaller").textContent=p.callerName||"Incoming call";document.getElementById("incomingType").textContent=p.callType==="video"?"Video call":"Audio call";document.getElementById("incomingCallModal")?.classList.remove("hidden");safePlay(state.ringtone,true);}function closeIncomingCallModal(){stopSound(state.ringtone);document.getElementById("incomingCallModal")?.classList.add("hidden");}
async function getLocalMedia(type){state.localStream=await navigator.mediaDevices.getUserMedia({audio:true,video:type==="video"?{facingMode:"user"}:false});const v=document.getElementById("localVideo");if(v)v.srcObject=state.localStream;state.isMuted=false;state.cameraEnabled=type==="video";return state.localStream;}
function createPeerConnection(remoteUserId){const pc=new RTCPeerConnection(RTC_CONFIG);state.peerConnection=pc;state.remoteStream=new MediaStream();const rv=document.getElementById("remoteVideo");if(rv)rv.srcObject=state.remoteStream;state.localStream?.getTracks().forEach(t=>pc.addTrack(t,state.localStream));pc.ontrack=e=>{e.streams[0].getTracks().forEach(t=>state.remoteStream.addTrack(t));document.getElementById("callWaitingState")?.classList.add("hidden");document.getElementById("callStatus").textContent="Connected";startCallTimer();};pc.onicecandidate=e=>{if(e.candidate)state.socket?.emit("webrtcIceCandidate",{to:remoteUserId,candidate:e.candidate,callId:state.currentCall?.callId});};return pc;}
async function createCallLog(type){try{const log=await apiJSON("/api/call-logs","POST",{receiver:getId(state.activeOtherUser),conversationId:conversationId(state.activeConversation),callType:type,direction:"outgoing",status:"ringing"});state.currentCallLogId=log._id||log.id||null;}catch{}}
async function updateCallLogEnd(status="ended"){if(!state.currentCallLogId)return;try{await apiJSON(`/api/call-logs/${encodeURIComponent(state.currentCallLogId)}/end`,"PATCH",{status});}catch{}state.currentCallLogId=null;}
async function startAudioCall(){await startOutgoingCall("audio");}async function startVideoCall(){await startOutgoingCall("video");}
async function startOutgoingCall(type){const target=getCallTarget();if(!target)return;try{openCallModal();state.currentCall={callId:"call-"+Date.now(),type,direction:"outgoing",targetUserId:target.userId,targetName:target.name,targetAvatar:target.avatar,conversationId:target.conversationId,status:"ringing"};updateCallUI({name:target.name,avatar:target.avatar,status:"Ringing...",type,waiting:true});safePlay(state.outgoingTone,true);await createCallLog(type);await getLocalMedia(type);const pc=createPeerConnection(target.userId),offer=await pc.createOffer();await pc.setLocalDescription(offer);state.socket?.emit("callUser",{to:target.userId,from:state.myId,callerName:userDisplayName(state.me),callerAvatar:userAvatar(state.me),callType:type,conversationId:target.conversationId,callId:state.currentCall.callId,offer});}catch(e){toast(e.message||"Unable to start call");cleanupCall();}}
function registerCallSocketEvents(){if(!state.socket)return;["incomingCall","callAccepted","callDeclined","callEnded","webrtcOffer","webrtcAnswer","webrtcIceCandidate"].forEach(e=>state.socket.off(e));state.socket.on("incomingCall",p=>{if(state.currentCall){state.socket.emit("declineCall",{to:p.from,callId:p.callId,reason:"busy"});return;}state.pendingIncomingCall={from:p.from,callerName:p.callerName||"AIFT User",callerAvatar:p.callerAvatar||FALLBACK_AVATAR,callType:p.callType||"audio",conversationId:p.conversationId||"",callId:p.callId||"call-"+Date.now(),offer:p.offer||null};openIncomingCallModal(state.pendingIncomingCall);});state.socket.on("callAccepted",async p=>{stopSound(state.outgoingTone);if(state.currentCall)state.currentCall.status="accepted";if(p?.answer&&state.peerConnection)await state.peerConnection.setRemoteDescription(new RTCSessionDescription(p.answer));startCallTimer();});state.socket.on("callDeclined",p=>{toast(p?.reason==="busy"?"User is currently busy":"Call declined");cleanupCall(true);});state.socket.on("callEnded",()=>cleanupCall(true));state.socket.on("webrtcAnswer",async p=>{if(p?.answer&&state.peerConnection)await state.peerConnection.setRemoteDescription(new RTCSessionDescription(p.answer));});state.socket.on("webrtcIceCandidate",async p=>{if(p?.candidate&&state.peerConnection)try{await state.peerConnection.addIceCandidate(new RTCIceCandidate(p.candidate));}catch{}});}
async function acceptIncomingCall(){const i=state.pendingIncomingCall;if(!i)return;try{closeIncomingCallModal();openCallModal();state.currentCall={callId:i.callId,type:i.callType,direction:"incoming",targetUserId:i.from,targetName:i.callerName,targetAvatar:i.callerAvatar,conversationId:i.conversationId,status:"accepted"};updateCallUI({name:i.callerName,avatar:i.callerAvatar,status:"Connecting...",type:i.callType,waiting:true});await getLocalMedia(i.callType);const pc=createPeerConnection(i.from);if(i.offer)await pc.setRemoteDescription(new RTCSessionDescription(i.offer));const answer=await pc.createAnswer();await pc.setLocalDescription(answer);state.socket?.emit("acceptCall",{to:i.from,callId:i.callId,answer});state.pendingIncomingCall=null;startCallTimer();}catch(e){toast(e.message||"Unable to accept call");cleanupCall(true);}}
function declineIncomingCall(){const i=state.pendingIncomingCall;if(i)state.socket?.emit("declineCall",{to:i.from,callId:i.callId,reason:"declined"});state.pendingIncomingCall=null;closeIncomingCallModal();}
function endCurrentCall(){if(state.currentCall?.targetUserId)state.socket?.emit("endCall",{to:state.currentCall.targetUserId,callId:state.currentCall.callId});cleanupCall(true);}
function cleanupCall(playEnd=false){stopSound(state.ringtone);stopSound(state.outgoingTone);if(playEnd)safePlay(state.callEndTone);if(state.callTimer)clearInterval(state.callTimer);state.localStream?.getTracks().forEach(t=>t.stop());state.remoteStream?.getTracks().forEach(t=>t.stop());state.screenStream?.getTracks().forEach(t=>t.stop());try{state.peerConnection?.close();}catch{}state.localStream=state.remoteStream=state.peerConnection=state.screenStream=null;updateCallLogEnd("ended");state.currentCall=null;state.pendingIncomingCall=null;state.callStartTime=null;closeIncomingCallModal();closeCallModal();updateCallButtons();}
function startCallTimer(){if(state.callTimer)clearInterval(state.callTimer);if(!state.callStartTime)state.callStartTime=Date.now();state.callTimer=setInterval(()=>{const s=Math.floor((Date.now()-state.callStartTime)/1000),m=String(Math.floor(s/60)).padStart(2,"0"),ss=String(s%60).padStart(2,"0");const el=document.getElementById("callDuration");if(el)el.textContent=`${m}:${ss}`;},1000);}
function updateCallButtons(){const m=document.getElementById("muteBtn"),c=document.getElementById("cameraBtn"),s=document.getElementById("speakerBtn"),sh=document.getElementById("screenBtn");m?.classList.toggle("active",state.isMuted);c?.classList.toggle("active",!state.cameraEnabled);s?.classList.toggle("active",!state.speakerEnabled);sh?.classList.toggle("active",!!state.screenStream);}
function toggleMute(){state.isMuted=!state.isMuted;state.localStream?.getAudioTracks().forEach(t=>t.enabled=!state.isMuted);updateCallButtons();}
function toggleCamera(){state.cameraEnabled=!state.cameraEnabled;state.localStream?.getVideoTracks().forEach(t=>t.enabled=state.cameraEnabled);updateCallButtons();}
function toggleSpeaker(){state.speakerEnabled=!state.speakerEnabled;const v=document.getElementById("remoteVideo");if(v)v.muted=!state.speakerEnabled;updateCallButtons();}
async function toggleScreenShare(){if(!state.peerConnection)return toast("Screen sharing is available after the call connects");if(state.screenStream)return stopScreenShare();try{state.screenStream=await navigator.mediaDevices.getDisplayMedia({video:true});const track=state.screenStream.getVideoTracks()[0],sender=state.peerConnection.getSenders().find(s=>s.track?.kind==="video");if(sender)await sender.replaceTrack(track);track.onended=stopScreenShare;updateCallButtons();}catch{toast("Unable to share screen");}}
async function stopScreenShare(){if(!state.screenStream)return;state.screenStream.getTracks().forEach(t=>t.stop());state.screenStream=null;const track=state.localStream?.getVideoTracks()[0],sender=state.peerConnection?.getSenders().find(s=>s.track?.kind==="video");if(sender&&track)await sender.replaceTrack(track);updateCallButtons();}
async function upgradeToMeeting(){showMeetingComingSoon();}async function createInstantMeeting(){showMeetingComingSoon();}

async function refreshEverything(){try{await loadConversations();if(state.activeConversation)await openConversation(conversationId(state.activeConversation));if(typeof loadStories==="function")loadStories();toast("Messages refreshed");}catch(e){toast(e.message||"Unable to refresh");}}
function handleConversationSearchInput(value){state.conversationSearch=cleanText(value);clearTimeout(state.conversationSearchTimer);state.conversationSearchTimer=setTimeout(loadConversations,250);}

function bindEvents(){
  const input=document.getElementById("messageInput");if(input){input.addEventListener("input",()=>{autoGrowComposer();if(state.activeOtherUser&&state.socket){state.socket.emit("typing",{to:getId(state.activeOtherUser)});clearTimeout(state.typingTimer);state.typingTimer=setTimeout(()=>state.socket.emit("stopTyping",{to:getId(state.activeOtherUser)}),900);}});input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}});}
  document.getElementById("fileInput")?.addEventListener("change",e=>{const f=e.target.files?.[0];if(f)handleAttachmentSelected(f);});document.getElementById("cameraInput")?.addEventListener("change",e=>{const f=e.target.files?.[0];if(f)handleCameraCapture(f);});document.getElementById("stickerImportInput")?.addEventListener("change",e=>{const f=e.target.files?.[0];if(f)handleStickerImport(f);e.target.value="";});document.getElementById("gifSearchInput")?.addEventListener("input",e=>{clearTimeout(state.gifSearchTimer);state.gifSearchTimer=setTimeout(()=>searchGifLocal(e.target.value),250);});
  document.getElementById("conversationSearch")?.addEventListener("input",e=>handleConversationSearchInput(e.target.value));document.getElementById("userSearchInput")?.addEventListener("input",e=>{clearTimeout(state.userSearchTimer);state.userSearchTimer=setTimeout(()=>searchUsers(e.target.value),280);});
  const box=getMessagesBox();if(box)box.addEventListener("scroll",()=>{updateJumpButtonFromScroll();if(box.scrollTop<80)loadOlderMessages();});
  document.addEventListener("click",e=>{const menu=document.getElementById("attachmentMenu");if(menu&&!menu.contains(e.target)&&!e.target.closest(".composer-icon"))menu.classList.add("hidden");if(!e.target.closest(".message-bubble")&&!e.target.closest(".message-action-bar"))clearSelectedMessage();const drawer=document.getElementById("chatInfoDrawer");if(drawer&&!drawer.classList.contains("hidden")&&e.target===drawer)closeChatInfo();const modal=document.getElementById("confirmModal");if(modal&&!modal.classList.contains("hidden")&&e.target===modal)closeConfirmModal();});
  window.addEventListener("resize",()=>{if(window.innerWidth>760)showConversationSidebar();});
}
async function openInitialTarget(){if(initialConversationId){try{await openConversation(initialConversationId);return;}catch{}}const uid=initialUserId||initialConversationId;if(uid){try{const c=await apiJSON("/api/conversations/direct","POST",{userId:uid});await loadConversations();await openConversation(conversationId(c));return;}catch(e){toast(e.message||"Unable to open conversation");}}showEmptyState();}
async function initMessagesPage(){if(!requireAuth())return;bindEvents();try{await loadMe();connectSocket();await loadConversations();await openInitialTarget();}catch(e){console.error("MESSAGES INIT ERROR:",e);toast(e.message||"Unable to load messages");showEmptyState();}}

document.addEventListener("DOMContentLoaded",()=>{setupAiftSounds();initMessagesPage();});