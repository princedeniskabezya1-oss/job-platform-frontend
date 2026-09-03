const API = "https://backend-1-9b6f.onrender.com";
const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const params = new URLSearchParams(window.location.search);
const initialUserId = params.get("user") || params.get("userId") || "";
const initialConversationId = params.get("conversation") || params.get("conversationId") || "";

const state = {
  token:"", role:"", me:null, myId:"", socket:null,
  conversations:[], filteredConversations:[], activeConversation:null, activeOtherUser:null, messages:[],
  onlineUsers:new Map(), conversationFilter:"all", conversationSearch:"", userSearchTimer:null, conversationSearchTimer:null,
  selectedMessage:null, selectedMessages:new Map(), selectionMode:false, selectionPressTimer:null, selectionPointer:null, reactionTargetId:"", replyTo:null, attachment:null, attachments:[], mediaReviewIndex:0, mediaReviewUrls:[], pickerOpen:false, pickerTab:"emoji", emojiCategory:"recent", pickerSwitchToken:0, composerSelectionStart:0, composerSelectionEnd:0, savedStickers:[], gifSearchTimer:null, drafts:new Map(), draftRenderTimer:null, composerConversationId:"", conversationOpenToken:0, conversationOpenedAt:new Map(),
  isSending:false, isLoadingMessages:false, messagesPageBefore:null, hasMoreMessages:true, confirmCallback:null, remoteTypingTimer:null,
  unreadBelow:false, lastKnownScrollHeight:0,
  currentCall:null, currentCallLogId:null, localStream:null, remoteStream:null, peerConnection:null, peerConnections:new Map(), remoteStreams:new Map(), callParticipants:new Map(), screenStream:null,
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
function setTypingStatus(){const el=document.getElementById("activeConversationStatus");if(el)el.innerHTML='<span class="typing-status">typing<span class="typing-status-dots"><i></i><i></i><i></i></span></span>';}
function autoGrowComposer(){ const input=document.getElementById("messageInput"); if(!input)return; input.style.height="auto"; input.style.height=Math.min(input.scrollHeight,132)+"px"; document.querySelector(".composer")?.classList.toggle("has-content",!!cleanText(input.value||"")||!!state.attachment); }

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
  state.socket.on("typing",payload=>{const from=payload?.from||payload?.sender||"";if(state.activeOtherUser&&String(from)===String(getId(state.activeOtherUser))){clearTimeout(state.remoteTypingTimer);setTypingStatus();state.remoteTypingTimer=setTimeout(updateActiveHeader,2600);}});
  state.socket.on("stopTyping",payload=>{const from=payload?.from||payload?.sender||"";if(state.activeOtherUser&&String(from)===String(getId(state.activeOtherUser))){clearTimeout(state.remoteTypingTimer);state.remoteTypingTimer=null;updateActiveHeader();}});
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

function draftStorageKey(){return "aiftMessageDrafts:"+(state.myId||localStorage.getItem("userId")||"guest");}
function loadConversationDrafts(){try{const stored=JSON.parse(localStorage.getItem(draftStorageKey())||"{}");state.drafts=new Map(Object.entries(stored).filter(([,value])=>typeof value==="string"&&value.length));}catch{state.drafts=new Map();}}
function persistConversationDrafts(){try{localStorage.setItem(draftStorageKey(),JSON.stringify(Object.fromEntries(state.drafts)));}catch(error){console.warn("Unable to save message drafts:",error);}}
function conversationDraft(id){return state.drafts.get(String(id||""))||"";}
function saveActiveConversationDraft({refreshList=true}={}){const id=state.composerConversationId||conversationId(state.activeConversation),input=document.getElementById("messageInput");if(!id||!input)return;const value=input.value||"";if(value.trim())state.drafts.set(String(id),value);else state.drafts.delete(String(id));persistConversationDrafts();if(refreshList){clearTimeout(state.draftRenderTimer);state.draftRenderTimer=setTimeout(renderConversations,120);}}
function clearConversationDraft(id){if(!id)return;state.drafts.delete(String(id));persistConversationDrafts();}
function restoreConversationDraft(id){const input=document.getElementById("messageInput");if(!input)return;state.composerConversationId=String(id||"");input.value=conversationDraft(id);input.selectionStart=input.selectionEnd=input.value.length;autoGrowComposer();}
function isMobileConversationList(){return window.matchMedia("(max-width:760px)").matches;}
function openedConversationStorageKey(){return "aiftOpenedConversations:"+(state.myId||localStorage.getItem("userId")||"guest");}
function loadOpenedConversations(){try{const stored=JSON.parse(localStorage.getItem(openedConversationStorageKey())||"{}");state.conversationOpenedAt=new Map(Object.entries(stored).map(([id,time])=>[id,Number(time)||0]).filter(([,time])=>time>0));}catch{state.conversationOpenedAt=new Map();}}
function rememberConversationOpened(id){if(!id)return;state.conversationOpenedAt.set(String(id),Date.now());try{localStorage.setItem(openedConversationStorageKey(),JSON.stringify(Object.fromEntries(state.conversationOpenedAt)));}catch(error){console.warn("Unable to save conversation order:",error);}}

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
  list.sort((a,b)=>{if(Boolean(a.pinned)!==Boolean(b.pinned))return a.pinned?-1:1;const mobile=isMobileConversationList(),aOpened=mobile?Number(state.conversationOpenedAt.get(String(conversationId(a)))||0):0,bOpened=mobile?Number(state.conversationOpenedAt.get(String(conversationId(b)))||0):0,aOrder=aOpened||new Date(conversationUpdatedAt(a)||0).getTime(),bOrder=bOpened||new Date(conversationUpdatedAt(b)||0).getTime();return bOrder-aOrder;});state.filteredConversations=list;
}
function renderConversations(){
  const box=document.getElementById("conversationList");if(!box)return;applyConversationFilter();if(!state.filteredConversations.length){box.innerHTML='<div class="empty-list">No conversations found.</div>';return;}
  box.innerHTML=state.filteredConversations.map(c=>{const id=conversationId(c),active=!isMobileConversationList()&&state.activeConversation&&String(conversationId(state.activeConversation))===String(id),unread=Number(c.unreadCount||c.unread||0),online=isConversationOnline(c),draft=conversationDraft(id);
    return `<article class="conversation-item ${active?"active":""}" onclick="openConversation('${esc(id)}')"><div class="conversation-avatar-wrap"><img class="conversation-avatar" src="${esc(conversationImage(c))}" alt="">${online?'<span class="online-dot"></span>':''}</div><div class="conversation-main"><div class="conversation-top"><div class="conversation-name">${esc(conversationTitle(c))}</div><div class="conversation-time">${esc(formatTime(conversationUpdatedAt(c)))}</div></div><div class="conversation-preview">${draft?'<span class="draft-label">Draft</span> '+esc(draft):esc(conversationPreview(c))}</div><div class="conversation-meta-row">${c.pinned?'<span class="mini-pill blue">Pinned</span>':''}${c.muted?'<span class="mini-pill">Muted</span>':''}${c.type&&c.type!=="direct"?`<span class="mini-pill">${esc(c.type)}</span>`:''}${unread?`<span class="unread-count">${unread>99?'99+':unread}</span>`:''}</div></div></article>`;
  }).join("");
}
function setConversationFilter(filter,button){state.conversationFilter=filter;document.querySelectorAll(".conversation-tabs button").forEach(x=>x.classList.remove("active"));button?.classList.add("active");loadConversations();}

async function openConversation(id){
  if(!id)return;
  if(typeof window.discardVoiceRecordingForConversationSwitch==="function")window.discardVoiceRecordingForConversationSwitch();
  saveActiveConversationDraft({refreshList:false});
  const targetId=String(id),openToken=++state.conversationOpenToken;rememberConversationOpened(targetId);const cached=state.conversations.find(item=>String(conversationId(item))===targetId)||null;
  showMessagesState();hideConversationSidebarOnMobile();state.isLoadingMessages=true;state.messages=[];state.messagesPageBefore=null;state.hasMoreMessages=true;hideJumpButton();restoreConversationDraft(targetId);renderMessagesSkeleton();
  if(cached){state.activeConversation=cached;state.activeOtherUser=cached.user||getOtherParticipant(cached)||null;updateActiveHeader();renderConversations();}
  try{
    const c=await api(`/api/conversations/${encodeURIComponent(targetId)}`,{headers:authHeaders()});if(openToken!==state.conversationOpenToken)return;
    state.activeConversation=c;state.activeOtherUser=c.user||getOtherParticipant(c)||null;updateActiveHeader();
    const messages=await api(`/api/conversations/${encodeURIComponent(targetId)}/messages?limit=60`,{headers:authHeaders()});if(openToken!==state.conversationOpenToken)return;
    state.messages=Array.isArray(messages)?messages:messages.messages||[];state.messagesPageBefore=state.messages[0]?.createdAt||null;state.hasMoreMessages=state.messages.length>=60;renderMessages({stickToBottom:true});
    await markConversationRead(targetId);if(openToken===state.conversationOpenToken)await loadConversations();
  }catch(error){if(openToken!==state.conversationOpenToken)return;console.error(error);toast(error.message||"Unable to open conversation");showEmptyState();}finally{if(openToken===state.conversationOpenToken)state.isLoadingMessages=false;}
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
  const row=document.createElement("div");row.className="message-row "+(mine?"me":"other");const storyReply=isGenuineStoryReply(message);if(storyReply)row.classList.add("story-reply-row");const bubble=document.createElement("article");bubble.className="message-bubble "+(mine?"me":"other")+(storyReply?" story-reply-bubble":"");bubble.dataset.messageId=messageId(message);bindMessageSelectionGesture(bubble,message);if(state.selectedMessages.has(String(messageId(message)))){bubble.classList.add("selected");row.classList.add("selected");}bubble.innerHTML=replyPreviewHtml(message)+messageContentHtml(message)+messageReactionsHtml(message)+messageMetaHtml(message,mine);row.appendChild(bubble);return row;
}
function messageReactionsHtml(message){const reactions=Array.isArray(message?.reactions)?message.reactions:[],values=reactions.map(item=>String(item?.reaction||item?.emoji||"").trim()).filter(Boolean);if(!values.length)return "";const visible=[...new Set(values)].slice(0,3).map(esc).join(""),count=values.length>1?` <small>${values.length}</small>`:"";return `<button type="button" class="message-reactions" onclick="event.stopPropagation();openMessageReactionDetails(\'${esc(messageId(message))}\')" aria-label="View ${values.length} message reaction${values.length===1?"":"s"}">${visible}${count}</button>`;}
function openMessageReactionDetails(id,filter="all"){const message=state.messages.find(item=>String(messageId(item))===String(id)),list=document.getElementById("reactionDetailsList"),tabs=document.getElementById("reactionSummaryTabs"),title=document.getElementById("reactionDetailsTitle");if(!message||!list||!tabs)return;const reactions=Array.isArray(message.reactions)?message.reactions:[],groups=new Map();reactions.forEach(item=>{const emoji=String(item.reaction||item.emoji||"");groups.set(emoji,(groups.get(emoji)||0)+1);});if(title)title.textContent=reactions.length+" reaction"+(reactions.length===1?"":"s");tabs.innerHTML=`<button class="reaction-summary-chip ${filter==="all"?"active":""}" onclick="openMessageReactionDetails('${esc(id)}','all')">All&nbsp; ${reactions.length}</button>`+[...groups.entries()].map(([emoji,count])=>`<button class="reaction-summary-chip ${filter===emoji?"active":""}" onclick="openMessageReactionDetails('${esc(id)}','${esc(emoji)}')">${esc(emoji)}&nbsp; ${count}</button>`).join("");const visible=filter==="all"?reactions:reactions.filter(item=>String(item.reaction||item.emoji||"")===filter);list.innerHTML=visible.length?visible.map(item=>{const userId=getId(item.user),mine=String(userId)===String(state.myId),name=mine?"You":item.user?.name||"Participant",avatar=mine?(state.me?.profileImage||FALLBACK_AVATAR):(item.user?.profileImage||FALLBACK_AVATAR),emoji=String(item.reaction||item.emoji||"");return `<button type="button" class="reaction-detail-row" ${mine?`onclick="removeMessageReaction('${esc(id)}')"`:""}><img class="reaction-detail-avatar" src="${esc(avatar)}" alt=""><span class="reaction-detail-copy"><strong>${esc(name)}</strong><small>${mine?"Tap to remove":"Reacted to this message"}</small></span><span class="reaction-detail-emoji">${esc(emoji)}</span></button>`;}).join(""):'<div class="empty-list">No reactions</div>';document.getElementById("reactionDetailsModal")?.classList.remove("hidden");}
function closeReactionDetails(){document.getElementById("reactionDetailsModal")?.classList.add("hidden");}
async function removeMessageReaction(id){try{const updated=await apiJSON(`/api/messages/react/${encodeURIComponent(id)}`,"DELETE",{});replaceMessage(updated,true);closeReactionDetails();toast("Reaction removed");}catch(error){toast(error.message||"Unable to remove reaction");}}
function replyPreviewHtml(message){const r=message.replyTo;if(!r)return"";const name=r.sender?.name||r.sender?.companyName||r.sender?.schoolName||"Reply",targetId=getId(r)||r.messageId||"";return `<button type="button" class="reply-preview" ${targetId?`onclick="event.stopPropagation();jumpToOriginalMessage('${esc(targetId)}')"`:""}><strong>${esc(name)}</strong><span>${esc(r.text||r.messageType||"Message")}</span></button>`;}
function isGenuineStoryReply(message){const metadata=message?.metadata||{},story=metadata.storyReply;return metadata.source==="story_reply"&&!!story?.storyId;}
function storyReplyAttachmentHtml(message){
  if(!isGenuineStoryReply(message))return"";
  const story=message.metadata.storyReply,mine=isMyMessage(message),available=story.available!==false,label=mine?"You replied to their story":"Replied to your story";
  if(!available)return `<div class="story-reply-context unavailable"><div class="story-reply-direction">${label}</div><div class="story-reply-unavailable"><span>Story unavailable</span></div></div>`;
  const url=story.mediaUrl||"",type=story.mediaType||"text",media=url?(type==="video"?`<video src="${esc(url)}" muted playsinline preload="metadata"></video>`:`<img src="${esc(url)}" alt="Story preview" loading="lazy">`):'<div class="story-reply-placeholder"></div>';
  return `<button type="button" class="story-reply-context" onclick="event.stopPropagation();openStoryReplyFromMessage('${esc(story.storyId)}')" aria-label="View original story"><span class="story-reply-direction">${label}</span><span class="story-reply-attachment">${media}<span class="story-reply-preview-shade"></span>${story.previewText?`<strong class="story-reply-caption">${esc(story.previewText)}</strong>`:""}</span></button>`;
}
function highlightOriginalMessage(id){
  const selector=`.message-bubble[data-message-id="${CSS.escape(String(id))}"]`,bubble=document.querySelector(selector);if(!bubble)return false;bubble.scrollIntoView({behavior:"smooth",block:"center"});bubble.classList.remove("message-jump-highlight");requestAnimationFrame(()=>{bubble.classList.add("message-jump-highlight");setTimeout(()=>bubble.classList.remove("message-jump-highlight"),1700);});return true;
}
async function jumpToOriginalMessage(id){
  if(!id||!state.activeConversation)return;if(highlightOriginalMessage(id))return;
  const box=getMessagesBox(),cid=conversationId(state.activeConversation),originalConversation=String(cid);box?.classList.add("locating-message");
  try{
    let before=state.messages[0]?.createdAt||new Date().toISOString(),found=false,pages=0;
    while(!found&&pages<30){
      const result=await api(`/api/conversations/${encodeURIComponent(cid)}/messages?limit=100&before=${encodeURIComponent(before)}`,{headers:authHeaders()}),list=Array.isArray(result)?result:result.messages||[];if(String(conversationId(state.activeConversation))!==originalConversation)return;if(!list.length)break;
      const merged=new Map([...list,...state.messages].map(item=>[String(messageId(item)),item]));state.messages=[...merged.values()].sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0));found=state.messages.some(item=>String(messageId(item))===String(id));before=list[0]?.createdAt||"";pages++;if(list.length<100||!before)break;
    }
    state.messagesPageBefore=state.messages[0]?.createdAt||null;renderMessages();requestAnimationFrame(()=>{if(!highlightOriginalMessage(id))toast("Original message is no longer available");});
  }catch(error){toast(error.message||"Unable to open the original message");}finally{box?.classList.remove("locating-message");}
}
async function openStoryReplyFromMessage(storyId){
  if(!storyId)return;const locate=()=>{const groups=window.storyState?.groups||[];for(let groupIndex=0;groupIndex<groups.length;groupIndex++){const storyIndex=(groups[groupIndex].stories||[]).findIndex(story=>String(getId(story))===String(storyId));if(storyIndex>=0)return{groupIndex,storyIndex};}return null;};
  let target=locate();if(!target&&typeof window.loadStories==="function"){try{await window.loadStories();target=locate();}catch{}}
  if(!target||typeof window.openStoryViewer!=="function")return toast("This story is no longer available");window.openStoryViewer(target.groupIndex,target.storyIndex);
}
function messageContentHtml(message){
  if(message.messageType==="meeting"&&message.meetingInvite)return meetingInviteHtml(message);
  if(message.deletedForEveryone)return '<div class="message-deleted">This message was deleted</div>';
  const storyCard=storyReplyAttachmentHtml(message);
  if(storyCard)return storyCard+(message.text?`<div class="message-text story-reply-text">${esc(message.text)}</div>`:"");
  const parts=[];if(message.text)parts.push(`<div class="message-text">${esc(message.text)}</div>`);const attachment=getPrimaryAttachment(message);if(attachment)parts.push(attachmentHtml(attachment,message));if(!parts.length)parts.push('<div class="message-text">Message</div>');return parts.join("");
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

function selectedMessageEntries(){return [...state.selectedMessages.values()];}
function syncMessageSelection(){
  const entries=selectedMessageEntries(),count=entries.length;state.selectionMode=count>0;state.selectedMessage=count===1?entries[0]:null;
  document.querySelectorAll(".message-bubble[data-message-id]").forEach(bubble=>{const selected=state.selectedMessages.has(String(bubble.dataset.messageId));bubble.classList.toggle("selected",selected);bubble.closest(".message-row")?.classList.toggle("selected",selected);});
  const bar=document.getElementById("messageActionBar");bar?.classList.toggle("hidden",!count);document.querySelector(".chat-panel")?.classList.toggle("message-selection-mode",!!count);
  const counter=document.getElementById("messageSelectionCount");if(counter)counter.textContent=String(count);
  document.getElementById("selectionReplyBtn")?.classList.toggle("hidden",count!==1);
  document.getElementById("selectionInfoBtn")?.classList.toggle("hidden",count!==1);
  document.getElementById("selectionStarBtn")?.classList.toggle("hidden",count<2);
  document.getElementById("selectionCopyBtn")?.classList.toggle("hidden",count<2||!entries.some(entry=>String(entry.message?.text||"").trim()));
  const reactions=document.getElementById("messageReactionBar");reactions?.classList.toggle("hidden",count!==1);if(count===1)requestAnimationFrame(positionMessageReactionBar);else reactions?.classList.remove("expanded");
  if(!count){document.getElementById("selectionMoreMenu")?.classList.add("hidden");reactions?.classList.add("hidden");reactions?.classList.remove("expanded");}
}
function positionMessageReactionBar(){const bar=document.getElementById("messageReactionBar"),bubble=document.querySelector(".message-bubble.selected");if(!bar||!bubble||bar.classList.contains("hidden"))return;const rect=bubble.getBoundingClientRect(),width=bar.offsetWidth||340,height=bar.offsetHeight||54,left=Math.max(8,Math.min(window.innerWidth-width-8,rect.left+(rect.width-width)/2)),above=rect.top-height-10,top=above>64?above:Math.min(window.innerHeight-height-72,rect.bottom+10);bar.style.left=Math.round(left)+"px";bar.style.top=Math.round(Math.max(64,top))+"px";}
function openReactionEmojiPicker(event){event?.stopPropagation();const entries=selectedMessageEntries();if(entries.length!==1)return;state.reactionTargetId=entries[0].id;state.pickerTab="emoji";document.querySelectorAll(".picker-tabs button").forEach((button,index)=>button.classList.toggle("active",index===0));["emojiPanel","gifPanel","stickerPanel"].forEach(id=>document.getElementById(id)?.classList.toggle("hidden",id!=="emojiPanel"));document.getElementById("emojiBackspaceBtn")?.classList.remove("hidden");openChatPicker();}
async function reactToMessageById(messageIdValue,emoji){try{const updated=await apiJSON("/api/messages/react","POST",{messageId:messageIdValue,emoji});replaceMessage(updated,true);closeChatPicker();clearSelectedMessage();toast("Reaction added");}catch(error){state.reactionTargetId="";toast(error.message||"Unable to add reaction");}}
async function reactToSelectedMessage(emoji){const entries=selectedMessageEntries(),entry=entries[0];if(entries.length!==1||!entry)return;await reactToMessageById(entry.id,emoji);}
function toggleMessageSelection(message,bubble){
  const id=String(messageId(message));if(!id)return;
  if(state.selectedMessages.has(id))state.selectedMessages.delete(id);else state.selectedMessages.set(id,{id,text:message.text||"",mine:isMyMessage(message),message});
  syncMessageSelection();
}
function beginMessageSelection(message,bubble){if(navigator.vibrate)navigator.vibrate(24);toggleMessageSelection(message,bubble);}
function bindMessageSelectionGesture(bubble,message){
  const cancel=()=>{clearTimeout(state.selectionPressTimer);state.selectionPressTimer=null;state.selectionPointer=null;};
  bubble.addEventListener("pointerdown",event=>{if(event.button!==undefined&&event.button!==0)return;event.stopPropagation();if(state.selectionMode){toggleMessageSelection(message,bubble);return;}state.selectionPointer={id:event.pointerId,x:event.clientX,y:event.clientY};clearTimeout(state.selectionPressTimer);state.selectionPressTimer=setTimeout(()=>{state.selectionPressTimer=null;beginMessageSelection(message,bubble);},420);});
  bubble.addEventListener("pointermove",event=>{const press=state.selectionPointer;if(!press||press.id!==event.pointerId)return;if(Math.hypot(event.clientX-press.x,event.clientY-press.y)>10)cancel();});
  bubble.addEventListener("pointerup",event=>{event.stopPropagation();cancel();});
  bubble.addEventListener("pointercancel",cancel);
  bubble.addEventListener("contextmenu",event=>{event.preventDefault();cancel();if(!state.selectionMode)beginMessageSelection(message,bubble);});
  bubble.addEventListener("click",event=>{event.stopPropagation();});
}
function selectMessage(message,bubble){beginMessageSelection(message,bubble);}
function clearSelectedMessage(){clearTimeout(state.selectionPressTimer);state.selectionPressTimer=null;state.selectionPointer=null;state.selectedMessages.clear();state.selectedMessage=null;state.selectionMode=false;syncMessageSelection();}
function replyToSelectedMessage(){const entries=selectedMessageEntries();if(entries.length!==1)return;const selected=entries[0],m=selected.message,sender=selected.mine?"You":conversationTitle(state.activeConversation);state.replyTo={id:selected.id,text:m.text||getPrimaryAttachment(m)?.originalName||"Message",sender};document.getElementById("replyTitle").textContent="Replying to "+sender;document.getElementById("replyText").textContent=state.replyTo.text;document.getElementById("replyBar")?.classList.remove("hidden");clearSelectedMessage();document.getElementById("messageInput")?.focus();}
function clearReply(){state.replyTo=null;document.getElementById("replyBar")?.classList.add("hidden");document.getElementById("replyTitle").textContent="Replying";document.getElementById("replyText").textContent="";}

function makeTempMessage({text,file,receiverId,tempId,replyTo,url,mimeType,title}){const objectUrl=file?URL.createObjectURL(file):(url||"");return{_id:tempId,sender:{_id:state.myId,name:"You"},receiver:{_id:receiverId},text:text||"",fileUrl:objectUrl,fileType:file?.type||mimeType||"",fileName:file?.name||title||"",fileSize:file?.size||0,attachments:objectUrl?[{url:objectUrl,secureUrl:objectUrl,type:normalizeAttachmentType(file?.type||mimeType||""),mimeType:file?.type||mimeType||"",originalName:file?.name||title||"Attachment",size:file?.size||0}]:[],replyTo:replyTo?{text:replyTo.text,sender:{name:replyTo.sender}}:null,messageType:objectUrl?normalizeAttachmentType(file?.type||mimeType||""):"text",status:"sending",seen:false,createdAt:new Date().toISOString(),metadata:{clientMessageId:tempId},_retry:{text:text||"",file:file||null,receiverId,replyTo:replyTo||null,url:url||"",mimeType:mimeType||"",title:title||""}};}
async function sendMessage(){
  const input=document.getElementById("messageInput"),text=cleanText(input?.value||""),files=state.attachments.length?state.attachments:(state.attachment?[state.attachment]:[]),file=files[0]||null;if(state.isSending||(!text&&!files.length))return;if(!state.activeConversation)return toast("Select a conversation first");const other=state.activeOtherUser||getOtherParticipant(state.activeConversation),rid=getId(other);if(!rid)return toast("Unable to find receiver");
  state.isSending=true;const btn=document.querySelector(".send-btn");if(btn)btn.disabled=true;const tempId="client-"+Date.now()+"-"+Math.random().toString(36).slice(2),reply=state.replyTo;const temp=makeTempMessage({text,file,receiverId:rid,tempId,replyTo:reply});state.messages.push(temp);renderMessages({stickToBottom:true});
  const form=new FormData();form.append("receiverId",rid);if(text)form.append("text",text);if(files.length===1)form.append("file",files[0]);else files.forEach(item=>form.append("files",item,item.name));if(reply?.id)form.append("replyTo",reply.id);form.append("clientMessageId",tempId);if(input)input.value="";clearConversationDraft(conversationId(state.activeConversation));autoGrowComposer();clearAttachment();clearReply();
  try{const saved=await api("/api/messages",{method:"POST",headers:authHeaders(),body:form});replaceTempMessage(tempId,saved.message||saved);safePlay(state.messageSentTone);await loadConversations();}catch(e){const failed=state.messages.find(x=>String(messageId(x))===String(tempId));if(failed){failed.status="failed";renderMessages({preserveViewport:true});}toast(e.message||"Message failed to send");}finally{state.isSending=false;if(btn)btn.disabled=false;}
}
function replaceTempMessage(tempId,saved){const i=state.messages.findIndex(x=>String(messageId(x))===String(tempId)||String(x?.metadata?.clientMessageId||"")===String(tempId));if(i!==-1)state.messages[i]=saved;renderMessages({stickToBottom:true});}
async function retryFailedMessage(id){const failed=state.messages.find(x=>String(messageId(x))===String(id));if(!failed?._retry)return toast("This message can no longer be retried");if(state.isSending)return;const r=failed._retry;state.messages=state.messages.filter(x=>x!==failed);if(r.file){state.attachment=r.file;renderAttachmentPreview(r.file);}if(r.replyTo)state.replyTo=r.replyTo;const input=document.getElementById("messageInput");if(input)input.value=r.text||"";await sendMessage();}

function toggleAttachmentMenu(){document.getElementById("attachmentMenu")?.classList.toggle("hidden");}
function chooseAttachment(type){const input=document.getElementById("fileInput");if(!input)return;const accepts={image:"image/*",video:"video/*",audio:"audio/*",document:".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"};input.accept=accepts[type]||"*/*";document.getElementById("attachmentMenu")?.classList.add("hidden");input.click();}
function normalizeSelectedFiles(input){return input instanceof File? [input]:Array.from(input||[]).filter(file=>file instanceof File);}
function revokeMediaReviewUrls(){state.mediaReviewUrls.forEach(url=>URL.revokeObjectURL(url));state.mediaReviewUrls=[];}
function addMediaReviewFiles(input){const files=normalizeSelectedFiles(input);for(const file of files){if(file.size>50*1024*1024){toast(file.name+" is larger than 50MB");continue;}if(state.attachments.length>=10){toast("You can send up to 10 files at once");break;}state.attachments.push(file);}state.attachment=state.attachments[0]||null;state.mediaReviewIndex=Math.min(state.mediaReviewIndex,Math.max(0,state.attachments.length-1));renderMediaReview();}
function handleAttachmentSelected(input){const files=normalizeSelectedFiles(input);if(!files.length)return;const mediaOnly=files.every(file=>/^(image|video)\//.test(file.type));if(mediaOnly){addMediaReviewFiles(files);openMediaReview();return;}const file=files[0];if(file.size>50*1024*1024)return toast("File is too large. Maximum size is 50MB.");state.attachments=[file];state.attachment=file;renderAttachmentPreview(file);autoGrowComposer();}
function openMediaReview(){if(!state.attachments.length)return;document.getElementById("mediaReviewModal")?.classList.remove("hidden");renderMediaReview();}
function closeMediaReview(options={}){document.getElementById("mediaReviewModal")?.classList.add("hidden");if(options.discard!==false)clearAttachment();}
function selectMediaReview(index){state.mediaReviewIndex=Math.max(0,Math.min(index,state.attachments.length-1));renderMediaReview();}
function removeMediaReviewFile(index){state.attachments.splice(index,1);state.attachment=state.attachments[0]||null;if(!state.attachments.length){closeMediaReview();return;}state.mediaReviewIndex=Math.min(state.mediaReviewIndex,state.attachments.length-1);renderMediaReview();}
function renderMediaReview(){const main=document.getElementById("mediaReviewMain"),thumbs=document.getElementById("mediaReviewThumbs");if(!main||!thumbs)return;revokeMediaReviewUrls();state.mediaReviewUrls=state.attachments.map(file=>URL.createObjectURL(file));const active=state.attachments[state.mediaReviewIndex],url=state.mediaReviewUrls[state.mediaReviewIndex];if(!active||!url)return;main.innerHTML=active.type.startsWith("video/")?`<video src="${esc(url)}" controls autoplay playsinline></video>`:`<img src="${esc(url)}" alt="${esc(active.name)}">`;thumbs.innerHTML=state.attachments.map((file,index)=>{const source=state.mediaReviewUrls[index],media=file.type.startsWith("video/")?`<video src="${esc(source)}" muted></video>`:`<img src="${esc(source)}" alt="">`;return `<div class="media-review-thumb ${index===state.mediaReviewIndex?"active":""}" onclick="selectMediaReview(${index})">${media}<button type="button" onclick="event.stopPropagation();removeMediaReviewFile(${index})">×</button></div>`;}).join("")+`<button class="media-review-add" type="button" onclick="document.getElementById('mediaReviewInput').click()" aria-label="Add another photo or video">+</button>`;}
async function sendMediaReview(){const caption=document.getElementById("mediaReviewCaption"),input=document.getElementById("messageInput");if(input&&caption?.value.trim())input.value=caption.value.trim();document.getElementById("mediaReviewModal")?.classList.add("hidden");await sendMessage();if(caption)caption.value="";}
function renderAttachmentPreview(file){const box=document.getElementById("attachmentPreview");if(!box)return;const type=normalizeAttachmentType(file.type),url=URL.createObjectURL(file),preview=type==="image"?`<img src="${esc(url)}" alt="">`:type==="video"?`<video src="${esc(url)}" controls></video>`:'<div class="preview-file-icon">▤</div>';box.innerHTML=`<div class="preview-card">${preview}<div class="preview-info"><strong>${esc(file.name)}</strong><span>${esc(fileSize(file.size))}</span></div><button onclick="clearAttachment()">Remove</button></div>`;box.classList.remove("hidden");}
function clearAttachment(){revokeMediaReviewUrls();state.attachments=[];state.attachment=null;state.mediaReviewIndex=0;["fileInput","cameraInput","mediaReviewInput"].forEach(id=>{const input=document.getElementById(id);if(input)input.value="";});const box=document.getElementById("attachmentPreview");if(box){box.classList.add("hidden");box.innerHTML="";}autoGrowComposer();}

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

async function copySelectedMessage(){
  const text=selectedMessageEntries().map(entry=>String(entry.message?.text||"").trim()).filter(Boolean).join("\n");
  if(!text)return toast("No text to copy");try{await navigator.clipboard.writeText(text);toast(selectedMessageEntries().length>1?"Messages copied":"Message copied");clearSelectedMessage();}catch{toast("Unable to copy message");}
}
async function starSelectedMessage(){
  const entries=selectedMessageEntries();if(!entries.length)return;
  try{await Promise.all(entries.map(entry=>apiJSON(`/api/messages/${encodeURIComponent(entry.id)}/star`,"PATCH",{})));toast(entries.length>1?"Messages updated":"Message updated");clearSelectedMessage();}catch(error){toast(error.message||"Unable to update messages");}
}
function deleteSelectedMessages(){
  const entries=selectedMessageEntries();if(!entries.length)return;const everyone=document.getElementById("deleteEveryoneChoice");if(everyone)everyone.classList.toggle("hidden",!entries.every(entry=>entry.mine));document.getElementById("messageDeleteModal")?.classList.remove("hidden");
}
function closeMessageDeleteModal(){document.getElementById("messageDeleteModal")?.classList.add("hidden");}
async function confirmDeleteSelectedMessages(scope){
  const entries=selectedMessageEntries();if(!entries.length)return closeMessageDeleteModal();
  if(scope==="everyone"&&!entries.every(entry=>entry.mine))return toast("Only your messages can be deleted for everyone");
  closeMessageDeleteModal();
  try{
    await Promise.all(entries.map(entry=>apiJSON(`/api/messages/${encodeURIComponent(entry.id)}/${scope==="everyone"?"delete-for-everyone":"delete-for-me"}`,"PATCH",{})));
    const ids=new Set(entries.map(entry=>String(entry.id)));
    if(scope==="me")state.messages=state.messages.filter(message=>!ids.has(String(messageId(message))));
    else state.messages.forEach(message=>{if(ids.has(String(messageId(message)))){message.deletedForEveryone=true;message.text="This message was deleted";message.attachments=[];message.fileUrl="";}});
    clearSelectedMessage();renderMessages({preserveViewport:true});toast(entries.length>1?"Messages deleted":scope==="everyone"?"Message deleted for everyone":"Message deleted");
  }catch(error){toast(error.message||"Unable to delete messages");}
}
function deleteSelectedMessageForMe(){confirmDeleteSelectedMessages("me");}
function deleteSelectedMessageForEveryone(){confirmDeleteSelectedMessages("everyone");}
function showSelectedMessageInfo(){
  const entries=selectedMessageEntries();if(entries.length!==1)return;const message=entries[0].message,created=new Date(message.createdAt||Date.now()),seen=!!(message.seen||message.readAt||message.seenAt),content=document.getElementById("messageInfoContent");
  if(content)content.innerHTML=`<div class="message-info-preview">${message.text?`<p>${esc(message.text)}</p>`:'<p>Attachment</p>'}</div><div class="message-info-row"><span>Sent</span><strong>${esc(created.toLocaleString())}</strong></div><div class="message-info-row"><span>Status</span><strong>${seen?"Read":"Delivered"}</strong></div>`;
  document.getElementById("messageInfoModal")?.classList.remove("hidden");
}
function closeSelectedMessageInfo(){document.getElementById("messageInfoModal")?.classList.add("hidden");}
function toggleSelectionMoreMenu(event){event?.stopPropagation();document.getElementById("selectionMoreMenu")?.classList.toggle("hidden");}
function closeSelectionMoreMenu(){document.getElementById("selectionMoreMenu")?.classList.add("hidden");}
function openForwardSelectedMessages(){
  const entries=selectedMessageEntries();if(!entries.length)return;const list=document.getElementById("forwardConversationList"),conversations=state.conversations.filter(conversation=>String(conversationId(conversation))!==String(conversationId(state.activeConversation)));
  if(list)list.innerHTML=conversations.length?conversations.map(conversation=>{const user=getOtherParticipant(conversation),id=getId(user);return `<button type="button" onclick="forwardSelectedMessagesTo('${esc(id)}')"><img src="${esc(userAvatar(user))}" alt=""><span><strong>${esc(userDisplayName(user))}</strong><small>${esc(readableRole(user.role))}</small></span></button>`;}).join(""):'<div class="asset-empty">No other conversations available.</div>';
  document.getElementById("forwardMessagesModal")?.classList.remove("hidden");
}
function closeForwardSelectedMessages(){document.getElementById("forwardMessagesModal")?.classList.add("hidden");}
async function forwardSelectedMessagesTo(receiverId){
  const entries=selectedMessageEntries();if(!receiverId||!entries.length)return;
  try{
    for(const entry of entries){const message=entry.message,attachment=getPrimaryAttachment(message),form=new FormData();form.append("receiverId",receiverId);if(message.text)form.append("text",message.text);if(attachment){form.append("fileUrl",attachment.secureUrl||attachment.url||"");form.append("fileType",attachment.mimeType||message.fileType||"application/octet-stream");form.append("fileName",attachment.originalName||message.fileName||"Forwarded attachment");}await api("/api/messages",{method:"POST",headers:authHeaders(),body:form});}
    closeForwardSelectedMessages();clearSelectedMessage();await loadConversations();toast(entries.length>1?"Messages forwarded":"Message forwarded");
  }catch(error){toast(error.message||"Unable to forward messages");}
}
function toggleChatMoreMenu(event){event?.stopPropagation();if(!state.activeConversation)return toast("Select a conversation first");document.getElementById("chatMoreMenu")?.classList.toggle("hidden");}
function closeChatMoreMenu(){document.getElementById("chatMoreMenu")?.classList.add("hidden");}
function applyChatTheme(theme){
  const value=theme==="dark"?"dark":"light",panel=document.querySelector(".chat-panel"),button=document.getElementById("chatThemeToggle");
  if(panel)panel.dataset.chatTheme=value;
  if(button)button.textContent=value==="dark"?"Use light theme":"Use dark theme";
  document.documentElement.style.colorScheme=value;
}
function toggleChatTheme(){
  const panel=document.querySelector(".chat-panel"),next=panel?.dataset.chatTheme==="dark"?"light":"dark";
  localStorage.setItem("aiftChatTheme",next);applyChatTheme(next);closeChatMoreMenu();
}
function initializeChatTheme(){applyChatTheme(localStorage.getItem("aiftChatTheme")==="dark"?"dark":"light");}
async function patchConversationSetting(action){if(!state.activeConversation)return toast("Select a conversation first");const id=conversationId(state.activeConversation);return apiJSON(`/api/conversations/${encodeURIComponent(id)}/${action}`,"PATCH",{});}
async function toggleActivePin(){try{const s=await patchConversationSetting("pin");state.activeConversation.pinned=!!s.pinned;toast(s.pinned?"Conversation pinned":"Conversation unpinned");closeChatInfo();await loadConversations();}catch(e){toast(e.message||"Unable to update pin");}}
async function toggleActiveMute(){try{const s=await patchConversationSetting("mute");state.activeConversation.muted=!!s.muted;toast(s.muted?"Conversation muted":"Conversation unmuted");closeChatInfo();await loadConversations();}catch(e){toast(e.message||"Unable to update mute");}}
function archiveActiveConversation(){if(!state.activeConversation)return toast("Select a conversation first");openConfirmModal({title:"Archive conversation",text:"This conversation will move to your archived messages.",confirmText:"Archive",onConfirm:async()=>{try{await patchConversationSetting("archive");closeChatInfo();state.activeConversation=null;state.activeOtherUser=null;showEmptyState();await loadConversations();toast("Conversation archived");}catch(e){toast(e.message||"Unable to archive conversation");}}});}
function blockActiveConversation(){if(!state.activeConversation)return toast("Select a conversation first");openConfirmModal({title:"Block conversation",text:"You will stop receiving messages from this conversation.",confirmText:"Block",danger:true,onConfirm:async()=>{try{await patchConversationSetting("block");closeChatInfo();state.activeConversation=null;state.activeOtherUser=null;showEmptyState();await loadConversations();toast("Conversation blocked");}catch(e){toast(e.message||"Unable to block conversation");}}});}
function openChatInfo(){if(!state.activeConversation)return toast("Select a conversation first");updateActiveHeader();document.getElementById("chatInfoDrawer")?.classList.remove("hidden");}function closeChatInfo(){document.getElementById("chatInfoDrawer")?.classList.add("hidden");}function openActiveProfile(){if(!state.activeOtherUser)return toast("No profile available");window.location.href=profileUrl(state.activeOtherUser);}
function openSharedFilesPanel(){const files=state.messages.filter(m=>getPrimaryAttachment(m));if(!files.length)return toast("No shared files in this conversation");const a=getPrimaryAttachment(files.at(-1)),url=a?.secureUrl||a?.url;if(url)window.open(url,"_blank");}

const EMOJI_CATEGORIES={
recent:{label:"Recent",icon:"◷",items:[]},
people:{label:"Smileys & People",icon:"☺",items:["😀","😃","😄","😁","😆","🥹","😅","😂","🤣","😊","😇","🙂","🙃","😉","😍","🥰","😘","😋","😜","🤪","🤓","😎","🥳","🥺","😢","😭","😡","😱","🤗","🤔","🫡","😴","🤢","😷","👋","✌️","🤞","🤟","👍","👎","👏","🙌","🫶","🤝","🙏","💪"]},
nature:{label:"Animals & Nature",icon:"❀",items:["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🦆","🦅","🦉","🦋","🐢","🐍","🐙","🐠","🐬","🐳","🌵","🌴","🌱","🌿","🍀","🌺","🌸","🌻","🌞","🌙","⭐","✨","⚡","🔥","🌈"]},
food:{label:"Food & Drink",icon:"♨",items:["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🌽","🥕","🧄","🥔","🥐","🥯","🍞","🧀","🥚","🥞","🥓","🍔","🍟","🍕","🌮","🥗","🍝","🍜","🍣","🍚","🍦","🎂","🍫","🍿","🍩","☕","🧋","🍺","🍷"]},
activity:{label:"Activity",icon:"⚽",items:["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🏑","🥍","🏏","⛳","🏹","🎣","🥊","🥋","🛹","🛼","⛸️","🎿","🏂","🏋️","🤸","🏄","🏊","🚴","🏆","🥇","🎭","🎨","🎬","🎤","🎧","🎹","🥁","🎷","🎺","🎸","🎻","🎲","🎯","🎳","🎮","🧩"]},
travel:{label:"Travel & Places",icon:"🚕",items:["🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🦽","🛴","🚲","🛵","🏍️","🛺","🚨","🚔","🚡","🚃","🚋","🚄","🚅","🚇","✈️","🛫","🛬","🚀","🚁","🛶","⛵","🚤","🛳️","🚢","⚓","⛽","🚦","🗺️","🗽","🗼","🏰","🏟️","🎡","🏖️","🏝️","⛰️","🏕️","🏠","🏢","🏥","🏫","🏨"]},
objects:{label:"Objects",icon:"💡",items:["⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","🕹️","💽","💾","💿","📷","📸","📹","🎥","☎️","📞","📺","📻","🎙️","⏰","🔋","🔌","💡","🔦","🕯️","🧯","💵","💳","💎","⚖️","🧰","🔧","🔨","⚙️","🧲","🔪","🛡️","🔮","📿","🧿","🔭","🔬","🩹","🩺","💊","💉","🧬","🧹","🧺","🧻","🚿","🛁","🔑","🚪","🪑","🛋️","🛏️"]},
symbols:{label:"Symbols",icon:"&%!",items:["❤️","🩷","🧡","💛","💚","🩵","💙","💜","🤎","🖤","🩶","🤍","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","✡️","☯️","☦️","🆔","⚛️","☢️","☣️","❌","⭕","🛑","⛔","🚫","💯","💢","⚠️","❗","❓","‼️","⁉️","✅","☑️","✔️","➕","➖","➗","✖️","♾️"]},
flags:{label:"Flags",icon:"⚑",items:["🏳️","🏴","🏴‍☠️","🏁","🚩","🏳️‍🌈","🏳️‍⚧️","🇺🇳","🇦🇺","🇧🇪","🇧🇷","🇨🇦","🇨🇳","🇨🇩","🇩🇪","🇪🇬","🇪🇸","🇪🇹","🇫🇷","🇬🇧","🇬🇭","🇬🇷","🇮🇳","🇮🇩","🇮🇪","🇮🇹","🇯🇵","🇰🇪","🇲🇽","🇳🇬","🇳🇱","🇳🇿","🇵🇭","🇵🇹","🇷🇼","🇸🇦","🇸🇬","🇿🇦","🇰🇷","🇹🇭","🇹🇷","🇺🇦","🇦🇪","🇺🇸","🇻🇳","🇿🇲","🇿🇼"]}
};
const DEFAULT_EMOJIS=EMOJI_CATEGORIES.people.items;
const DEFAULT_GIFS=[{title:"Good job",url:"https://media.giphy.com/media/ely3apij36BJhoZ234/giphy.gif"},{title:"Congratulations",url:"https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif"},{title:"Thank you",url:"https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif"},{title:"Welcome",url:"https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif"}];
function getRecentEmojis(){try{return JSON.parse(localStorage.getItem("aiftRecentEmojis")||"[]").filter(Boolean).slice(0,32);}catch{return [];}}
function rememberEmoji(emoji){localStorage.setItem("aiftRecentEmojis",JSON.stringify([emoji,...getRecentEmojis().filter(item=>item!==emoji)].slice(0,32)));}
function setPickerToggleIcon(open){const button=document.getElementById("pickerToggleBtn");if(!button)return;button.classList.toggle("keyboard-mode",open);button.setAttribute("aria-label",open?"Show keyboard":"Open emoji, GIF and stickers");button.innerHTML=open?'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M7 9h.01M10 9h.01M13 9h.01M16 9h.01M7 12h.01M10 12h.01M13 12h.01M16 12h.01M7 15h10"></path></svg>':'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><circle cx="9" cy="10" r="1"></circle><circle cx="15" cy="10" r="1"></circle><path d="M8 15s1.5 2 4 2 4-2 4-2"></path></svg>';}
function openChatPicker(){const panel=document.getElementById("chatPicker"),input=document.getElementById("messageInput");if(!panel)return;state.pickerOpen=true;state.pickerSwitchToken=(state.pickerSwitchToken||0)+1;const token=state.pickerSwitchToken;if(input){state.composerSelectionStart=input.selectionStart??input.value.length;state.composerSelectionEnd=input.selectionEnd??input.value.length;input.blur();}document.querySelector(".chat-panel")?.classList.add("picker-open");setPickerToggleIcon(true);window.setTimeout(()=>{if(state.pickerOpen&&token===state.pickerSwitchToken){panel.classList.remove("hidden");renderActivePicker();scrollMessagesToBottom("auto");}},90);}
function closeChatPicker(options={}){state.pickerOpen=false;state.reactionTargetId="";state.pickerSwitchToken=(state.pickerSwitchToken||0)+1;document.getElementById("chatPicker")?.classList.add("hidden");document.querySelector(".chat-panel")?.classList.remove("picker-open");setPickerToggleIcon(false);if(options.focusInput&&!state.reactionTargetId){const input=document.getElementById("messageInput");requestAnimationFrame(()=>{if(!input)return;input.focus({preventScroll:true});const fallback=input.value.length;const point=Math.min(input.value.length,state.composerSelectionStart??fallback);input.setSelectionRange(point,point);});}}
function toggleChatPicker(){if(state.pickerOpen){closeChatPicker({focusInput:true});return;}openChatPicker();}
function renderActivePicker(){if(state.pickerTab==="emoji")renderEmojiPanel(state.emojiCategory||"recent");if(state.pickerTab==="gif")renderGifGrid(DEFAULT_GIFS);if(state.pickerTab==="sticker")loadSavedStickers();}
function switchPickerTab(tab,button){state.pickerTab=tab;document.querySelectorAll(".picker-tabs button").forEach(item=>item.classList.toggle("active",item===button));["emojiPanel","gifPanel","stickerPanel"].forEach(id=>document.getElementById(id)?.classList.add("hidden"));document.getElementById(tab+"Panel")?.classList.remove("hidden");document.getElementById("emojiBackspaceBtn")?.classList.toggle("hidden",tab!=="emoji");renderActivePicker();}
function selectEmojiCategory(category){if(!EMOJI_CATEGORIES[category])return;state.emojiCategory=category;renderEmojiPanel(category);}
function renderEmojiPanel(category=state.emojiCategory||"recent"){const panel=document.getElementById("emojiPanel");if(!panel)return;const recent=getRecentEmojis();EMOJI_CATEGORIES.recent.items=recent;if(category==="recent"&&!recent.length)category="people";state.emojiCategory=category;const selected=EMOJI_CATEGORIES[category]||EMOJI_CATEGORIES.people;panel.innerHTML='<div class="emoji-scroll"><h3>'+selected.label+'</h3><div class="emoji-grid">'+selected.items.map(emoji=>'<button class="emoji-btn" onclick="insertEmoji(\''+emoji+'\')" type="button" aria-label="'+emoji+'">'+emoji+'</button>').join("")+'</div></div><nav class="emoji-categories" aria-label="Emoji categories">'+Object.entries(EMOJI_CATEGORIES).map(([key,value])=>'<button type="button" class="'+(key===category?"active":"")+'" onclick="selectEmojiCategory(\''+key+'\')" title="'+value.label+'" aria-label="'+value.label+'"><span>'+value.icon+'</span></button>').join("")+'</nav>';}
function insertEmoji(emoji){if(state.reactionTargetId){const target=state.reactionTargetId;state.reactionTargetId="";rememberEmoji(emoji);reactToMessageById(target,emoji);return;}const input=document.getElementById("messageInput");if(!input)return;const start=Math.min(state.composerSelectionStart??input.value.length,input.value.length),end=Math.min(state.composerSelectionEnd??start,input.value.length);input.value=input.value.slice(0,start)+emoji+input.value.slice(end);const next=start+emoji.length;state.composerSelectionStart=next;state.composerSelectionEnd=next;rememberEmoji(emoji);autoGrowComposer();input.dispatchEvent(new Event("input",{bubbles:true}));}
function deleteLastComposerCharacter(){const input=document.getElementById("messageInput");if(!input?.value)return;const end=Math.min(state.composerSelectionStart??input.value.length,input.value.length),before=input.value.slice(0,end);const segments=typeof Intl.Segmenter==="function"?Array.from(new Intl.Segmenter(undefined,{granularity:"grapheme"}).segment(before),item=>item.segment):Array.from(before);const removed=segments.pop()||"";const start=end-removed.length;input.value=input.value.slice(0,start)+input.value.slice(end);state.composerSelectionStart=start;state.composerSelectionEnd=start;autoGrowComposer();input.dispatchEvent(new Event("input",{bubbles:true}));}
function renderGifGrid(gifs=[]){const g=document.getElementById("gifGrid");if(g)g.innerHTML=(gifs.length?gifs:DEFAULT_GIFS).map(a=>`<article class="asset-card" onclick="sendRemoteAsset('${esc(a.url)}','gif','${esc(a.title||'GIF')}')"><img src="${esc(a.url)}" alt=""><span class="asset-label">${esc(a.title||'GIF')}</span></article>`).join("");}
function searchGifLocal(q){q=cleanText(q).toLowerCase();renderGifGrid(q?DEFAULT_GIFS.filter(x=>x.title.toLowerCase().includes(q)):DEFAULT_GIFS);}
async function loadSavedStickers(){const g=document.getElementById("stickerGrid");if(!g)return;g.innerHTML='<div class="asset-empty">Loading your stickers...</div>';try{const d=await api("/api/chat-assets?type=sticker",{headers:authHeaders()});state.savedStickers=Array.isArray(d)?d:[];g.innerHTML=state.savedStickers.length?state.savedStickers.map(a=>`<article class="asset-card" onclick="sendRemoteAsset('${esc(a.url)}','sticker','${esc(a.title||'Sticker')}')"><img src="${esc(a.url)}" alt=""><span class="asset-label">${esc(a.title||'Sticker')}</span></article>`).join(""):'<div class="asset-empty">No stickers yet.</div>';}catch(e){g.innerHTML=`<div class="asset-empty">${esc(e.message)}</div>`;}}
function importSticker(){document.getElementById("stickerImportInput")?.click();}
async function handleStickerImport(file){if(!file)return;const form=new FormData();form.append("file",file);form.append("type","sticker");form.append("title",file.name||"Sticker");form.append("source","uploaded");try{await api("/api/chat-assets",{method:"POST",headers:authHeaders(),body:form});await loadSavedStickers();toast("Sticker imported");}catch(e){toast(e.message||"Unable to import sticker");}}
async function sendRemoteAsset(url,type,title){if(!state.activeConversation)return toast("Select a conversation first");const rid=getId(state.activeOtherUser||getOtherParticipant(state.activeConversation));if(!rid)return;const tempId="client-"+Date.now(),mime=type==="gif"?"image/gif":"image/webp",temp=makeTempMessage({text:"",receiverId:rid,tempId,url,mimeType:mime,title});state.messages.push(temp);renderMessages({stickToBottom:true});try{const form=new FormData();form.append("receiverId",rid);form.append("fileUrl",url);form.append("fileType",mime);form.append("fileName",title||type);form.append("clientMessageId",tempId);const saved=await api("/api/messages",{method:"POST",headers:authHeaders(),body:form});replaceTempMessage(tempId,saved.message||saved);closeChatPicker();await loadConversations();}catch(e){temp.status="failed";renderMessages({preserveViewport:true});toast(e.message||"Unable to send asset");}}
async function saveReceivedAssetById(id){const m=state.messages.find(x=>String(messageId(x))===String(id));if(!m)return toast("Message not found");const a=getPrimaryAttachment(m),url=a?.secureUrl||a?.url;if(!url)return;try{await apiJSON("/api/chat-assets","POST",{type:"sticker",title:a.originalName||"Saved sticker",url,mimeType:a.mimeType||m.fileType||"",source:"saved_from_chat",originalMessageId:messageId(m)});toast("Saved to your stickers");}catch(e){toast(e.message||"Unable to save sticker");}}
function saveReceivedAsset(message){saveReceivedAssetById(messageId(message));}

let cameraStream=null,cameraFacingMode="environment",cameraEnhanced=false,cameraFlashEnabled=false;
async function openCameraCapture(){try{document.getElementById("cameraModal")?.classList.remove("hidden");cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:cameraFacingMode},audio:false});document.getElementById("cameraVideo").srcObject=cameraStream;}catch{document.getElementById("cameraInput")?.click();}}
function closeCameraModal(){cameraStream?.getTracks().forEach(t=>t.stop());cameraStream=null;cameraFlashEnabled=false;document.getElementById("cameraModal")?.classList.add("hidden");}
function openCameraGallery(){document.getElementById("cameraInput")?.click();}
function toggleCameraEnhancement(){cameraEnhanced=!cameraEnhanced;document.getElementById("cameraVideo")?.style.setProperty("filter",cameraEnhanced?"contrast(1.06) saturate(1.08)":"none");document.querySelector(".camera-enhance")?.classList.toggle("active",cameraEnhanced);}
async function toggleCameraFlash(){const track=cameraStream?.getVideoTracks?.()[0],capabilities=track?.getCapabilities?.()||{};if(!track||!capabilities.torch)return toast("Flash is not available on this camera");try{cameraFlashEnabled=!cameraFlashEnabled;await track.applyConstraints({advanced:[{torch:cameraFlashEnabled}]});document.getElementById("cameraFlashBtn")?.classList.toggle("active",cameraFlashEnabled);}catch{cameraFlashEnabled=false;toast("Unable to control the flash");}}
async function switchCamera(){cameraFacingMode=cameraFacingMode==="environment"?"user":"environment";closeCameraModal();await openCameraCapture();}
function captureCameraPhoto(){const v=document.getElementById("cameraVideo"),c=document.getElementById("cameraCanvas");if(!v||!c)return;c.width=v.videoWidth;c.height=v.videoHeight;const context=c.getContext("2d");if(cameraEnhanced)context.filter="contrast(1.06) saturate(1.08)";context.drawImage(v,0,0,c.width,c.height);c.toBlob(blob=>{if(!blob)return;const f=new File([blob],"camera-photo-"+Date.now()+".jpg",{type:"image/jpeg"});closeCameraModal();state.attachments=[];state.attachment=null;addMediaReviewFiles([f]);openMediaReview();},"image/jpeg",.92);}
function handleCameraCapture(files){closeCameraModal();state.attachments=[];state.attachment=null;addMediaReviewFiles(files);openMediaReview();}

const RTC_CONFIG={iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]};
function setupAiftSounds(){state.ringtone=new Audio("audio/ringtone.mp3");state.outgoingTone=new Audio("audio/calling.mp3");state.callEndTone=new Audio("audio/call-end.mp3");state.messageTone=new Audio("audio/message.mp3");state.messageSentTone=new Audio("audio/message-sent.mp3");state.busyTone=new Audio("audio/busy.mp3");state.ringtone.loop=true;state.outgoingTone.loop=true;[state.ringtone,state.outgoingTone,state.callEndTone,state.messageTone,state.messageSentTone,state.busyTone].forEach(a=>{if(a)a.volume=.55;});}
function safePlay(audio,loop=false){if(!audio)return;try{audio.loop=loop;audio.currentTime=0;audio.play()?.catch(()=>{});}catch{}}
function stopSound(audio){if(!audio)return;try{audio.pause();audio.currentTime=0;audio.loop=false;}catch{}}
function getCallTarget(){if(!state.activeConversation||!state.activeOtherUser){toast("Select a conversation first");return null;}const userId=getId(state.activeOtherUser);return userId?{userId,name:userDisplayName(state.activeOtherUser),avatar:userAvatar(state.activeOtherUser),conversationId:conversationId(state.activeConversation)}:null;}
function updateCallUI({name,avatar,status,type="audio",waiting=true}={}){const callName=document.getElementById("callName"),callStatus=document.getElementById("callStatus"),headerAvatar=document.getElementById("callAvatar"),waitingAvatar=document.getElementById("callWaitingAvatar"),stageStatus=document.querySelector(".call-stage-status");if(callName)callName.textContent=name||"AIFT Call";if(callStatus)callStatus.textContent=status||"Connecting...";if(headerAvatar)headerAvatar.src=avatar||FALLBACK_AVATAR;if(waitingAvatar)waitingAvatar.src=avatar||FALLBACK_AVATAR;if(stageStatus)stageStatus.textContent=waiting?(status||"Waiting for answer"):"Connected";document.getElementById("callWaitingState")?.classList.toggle("hidden",!waiting);const modal=document.getElementById("callModal");modal?.classList.toggle("audio-call",type==="audio");modal?.classList.toggle("video-call",type==="video");modal?.classList.toggle("call-connected",!waiting);modal?.classList.remove("compact");}
function openCallModal(){document.getElementById("callModal")?.classList.remove("hidden");}function closeCallModal(){const modal=document.getElementById("callModal");modal?.classList.add("hidden");modal?.classList.remove("compact");document.getElementById("callMoreMenu")?.classList.add("hidden");}
function toggleCallCompactMode(){const modal=document.getElementById("callModal");if(!modal)return;modal.classList.toggle("compact");document.getElementById("callMoreMenu")?.classList.add("hidden");}
function toggleCallMoreMenu(){document.getElementById("callMoreMenu")?.classList.toggle("hidden");}
function toggleCallStartMenu(event){event?.stopPropagation();if(!getCallTarget())return;document.getElementById("callStartMenu")?.classList.toggle("hidden");}
function closeCallStartMenu(){document.getElementById("callStartMenu")?.classList.add("hidden");}
async function chooseCallType(type){closeCallStartMenu();await startOutgoingCall(type);}
function openIncomingCallModal(p){document.getElementById("incomingAvatar").src=p.callerAvatar||p.avatar||FALLBACK_AVATAR;document.getElementById("incomingCaller").textContent=p.callerName||"Incoming call";document.getElementById("incomingType").textContent=p.callType==="video"?"Video call":"Audio call";document.getElementById("incomingCallModal")?.classList.remove("hidden");safePlay(state.ringtone,true);}function closeIncomingCallModal(){stopSound(state.ringtone);document.getElementById("incomingCallModal")?.classList.add("hidden");}
async function getLocalMedia(type){state.localStream=await navigator.mediaDevices.getUserMedia({audio:true,video:type==="video"?{facingMode:"user"}:false});const v=document.getElementById("localVideo");if(v)v.srcObject=state.localStream;state.isMuted=false;state.cameraEnabled=type==="video";return state.localStream;}
function renderCallParticipants(){const grid=document.getElementById("remoteVideosGrid");if(!grid)return;grid.innerHTML="";state.remoteStreams.forEach((stream,userId)=>{const person=state.callParticipants.get(userId)||{};const tile=document.createElement("div");tile.className="remote-video-tile";tile.innerHTML=`<video autoplay playsinline></video><span>${esc(person.name||"Participant")}</span>`;tile.querySelector("video").srcObject=stream;tile.querySelector("video").muted=!state.speakerEnabled;grid.appendChild(tile);});grid.classList.toggle("group-call",state.remoteStreams.size>1);}
function createPeerConnection(remoteUserId){remoteUserId=String(remoteUserId);state.peerConnections.get(remoteUserId)?.close();const pc=new RTCPeerConnection(RTC_CONFIG),remoteStream=new MediaStream();state.peerConnections.set(remoteUserId,pc);state.remoteStreams.set(remoteUserId,remoteStream);state.peerConnection=pc;state.remoteStream=remoteStream;state.localStream?.getAudioTracks().forEach(t=>pc.addTrack(t,state.localStream));const localVideo=state.localStream?.getVideoTracks()[0];if(localVideo)pc.addTrack(localVideo,state.localStream);else pc.addTransceiver("video",{direction:"sendrecv"});pc.ontrack=e=>{e.streams[0]?.getTracks().forEach(t=>{if(!remoteStream.getTracks().some(x=>x.id===t.id))remoteStream.addTrack(t);});renderCallParticipants();document.getElementById("callWaitingState")?.classList.add("hidden");const status=document.getElementById("callStatus"),stageStatus=document.querySelector(".call-stage-status");if(status)status.textContent=state.peerConnections.size>1?`${state.peerConnections.size+1} participants`:"Connected";if(stageStatus)stageStatus.textContent="Connected";document.getElementById("callModal")?.classList.add("call-connected");startCallTimer();};pc.onicecandidate=e=>{if(e.candidate)state.socket?.emit("webrtcIceCandidate",{to:remoteUserId,candidate:e.candidate,callId:state.currentCall?.callId});};pc.onconnectionstatechange=()=>{if(["failed","closed","disconnected"].includes(pc.connectionState)){state.peerConnections.delete(remoteUserId);state.remoteStreams.delete(remoteUserId);renderCallParticipants();}};renderCallParticipants();return pc;}
async function createCallLog(type){try{const log=await apiJSON("/api/call-logs","POST",{receiver:getId(state.activeOtherUser),conversationId:conversationId(state.activeConversation),callType:type,direction:"outgoing",status:"ringing"});state.currentCallLogId=log._id||log.id||null;}catch{}}
async function updateCallLogEnd(status="ended"){if(!state.currentCallLogId)return;try{await apiJSON(`/api/call-logs/${encodeURIComponent(state.currentCallLogId)}/end`,"PATCH",{status});}catch{}state.currentCallLogId=null;}
async function startAudioCall(){await startOutgoingCall("audio");}async function startVideoCall(){await startOutgoingCall("video");}
async function inviteCallUser(target){if(!target?.userId||state.peerConnections.has(String(target.userId)))return;state.callParticipants.set(String(target.userId),target);const pc=createPeerConnection(target.userId),offer=await pc.createOffer();await pc.setLocalDescription(offer);state.socket?.emit("callUser",{to:target.userId,from:state.myId,callerName:userDisplayName(state.me),callerAvatar:userAvatar(state.me),callType:state.currentCall?.type||"audio",conversationId:target.conversationId||"",callId:state.currentCall?.callId,offer,isGroupInvite:state.peerConnections.size>1});}
async function startOutgoingCall(type){const target=getCallTarget();if(!target)return;try{closeCallStartMenu();openCallModal();state.currentCall={callId:"call-"+Date.now(),type,direction:"outgoing",targetUserId:target.userId,targetName:target.name,targetAvatar:target.avatar,conversationId:target.conversationId,status:"ringing"};state.callParticipants.set(String(target.userId),target);updateCallUI({name:target.name,avatar:target.avatar,status:"Ringing...",type,waiting:true});safePlay(state.outgoingTone,true);await createCallLog(type);await getLocalMedia(type);await inviteCallUser(target);}catch(e){toast(e.message||"Unable to start call");cleanupCall();}}
function registerCallSocketEvents(){if(!state.socket)return;["incomingCall","callAccepted","callDeclined","callEnded","webrtcOffer","webrtcAnswer","webrtcIceCandidate"].forEach(e=>state.socket.off(e));state.socket.on("incomingCall",p=>{if(state.currentCall){state.socket.emit("declineCall",{to:p.from,callId:p.callId,reason:"busy"});return;}state.pendingIncomingCall={from:p.from,callerName:p.callerName||"AIFT User",callerAvatar:p.callerAvatar||FALLBACK_AVATAR,callType:p.callType||"audio",conversationId:p.conversationId||"",callId:p.callId||"call-"+Date.now(),offer:p.offer||null};openIncomingCallModal(state.pendingIncomingCall);});state.socket.on("callAccepted",async p=>{stopSound(state.outgoingTone);if(state.currentCall)state.currentCall.status="accepted";const pc=state.peerConnections.get(String(p?.from));if(p?.answer&&pc)await pc.setRemoteDescription(new RTCSessionDescription(p.answer));startCallTimer();});state.socket.on("callDeclined",p=>{const id=String(p?.from||"");state.peerConnections.get(id)?.close();state.peerConnections.delete(id);state.remoteStreams.delete(id);renderCallParticipants();if(state.peerConnections.size===0){toast(p?.reason==="busy"?"User is currently busy":"Call declined");cleanupCall(true);}});state.socket.on("callEnded",p=>{const id=String(p?.from||"");state.peerConnections.get(id)?.close();state.peerConnections.delete(id);state.remoteStreams.delete(id);renderCallParticipants();if(state.peerConnections.size===0)cleanupCall(true);});state.socket.on("webrtcAnswer",async p=>{const pc=state.peerConnections.get(String(p?.from));if(p?.answer&&pc)await pc.setRemoteDescription(new RTCSessionDescription(p.answer));});state.socket.on("webrtcIceCandidate",async p=>{const pc=state.peerConnections.get(String(p?.from));if(p?.candidate&&pc)try{await pc.addIceCandidate(new RTCIceCandidate(p.candidate));}catch{}});}
async function acceptIncomingCall(){const i=state.pendingIncomingCall;if(!i)return;try{closeIncomingCallModal();openCallModal();state.currentCall={callId:i.callId,type:i.callType,direction:"incoming",targetUserId:i.from,targetName:i.callerName,targetAvatar:i.callerAvatar,conversationId:i.conversationId,status:"accepted"};state.callParticipants.set(String(i.from),{userId:i.from,name:i.callerName,avatar:i.callerAvatar});updateCallUI({name:i.callerName,avatar:i.callerAvatar,status:"Connecting...",type:i.callType,waiting:true});await getLocalMedia(i.callType);const pc=createPeerConnection(i.from);if(i.offer)await pc.setRemoteDescription(new RTCSessionDescription(i.offer));const answer=await pc.createAnswer();await pc.setLocalDescription(answer);state.socket?.emit("acceptCall",{to:i.from,callId:i.callId,answer});state.pendingIncomingCall=null;startCallTimer();}catch(e){toast(e.message||"Unable to accept call");cleanupCall(true);}}
function declineIncomingCall(){const i=state.pendingIncomingCall;if(i)state.socket?.emit("declineCall",{to:i.from,callId:i.callId,reason:"declined"});state.pendingIncomingCall=null;closeIncomingCallModal();}
function endCurrentCall(){state.peerConnections.forEach((_,to)=>state.socket?.emit("endCall",{to,callId:state.currentCall?.callId}));cleanupCall(true);}
function cleanupCall(playEnd=false){stopSound(state.ringtone);stopSound(state.outgoingTone);if(playEnd)safePlay(state.callEndTone);if(state.callTimer)clearInterval(state.callTimer);state.localStream?.getTracks().forEach(t=>t.stop());state.remoteStreams.forEach(stream=>stream.getTracks().forEach(t=>t.stop()));state.screenStream?.getTracks().forEach(t=>t.stop());state.peerConnections.forEach(pc=>{try{pc.close();}catch{}});state.peerConnections.clear();state.remoteStreams.clear();state.callParticipants.clear();state.localStream=state.remoteStream=state.peerConnection=state.screenStream=null;updateCallLogEnd("ended");state.currentCall=null;state.pendingIncomingCall=null;state.callStartTime=null;renderCallParticipants();closeIncomingCallModal();closeCallModal();updateCallButtons();}
function startCallTimer(){if(state.callTimer)clearInterval(state.callTimer);if(!state.callStartTime)state.callStartTime=Date.now();state.callTimer=setInterval(()=>{const s=Math.floor((Date.now()-state.callStartTime)/1000),m=String(Math.floor(s/60)).padStart(2,"0"),ss=String(s%60).padStart(2,"0");const el=document.getElementById("callDuration");if(el)el.textContent=`${m}:${ss}`;},1000);}
function updateCallButtons(){const m=document.getElementById("muteBtn"),c=document.getElementById("cameraBtn"),s=document.getElementById("speakerBtn"),sh=document.getElementById("screenBtn");m?.classList.toggle("active",state.isMuted);c?.classList.toggle("active",!state.cameraEnabled);s?.classList.toggle("active",!state.speakerEnabled);sh?.classList.toggle("active",!!state.screenStream);}
function toggleMute(){state.isMuted=!state.isMuted;state.localStream?.getAudioTracks().forEach(t=>t.enabled=!state.isMuted);updateCallButtons();}
async function toggleCamera(){try{let track=state.localStream?.getVideoTracks()[0];if(!track){const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:false});track=stream.getVideoTracks()[0];state.localStream.addTrack(track);for(const pc of state.peerConnections.values()){const sender=pc.getSenders().find(s=>s.track?.kind==="video"||s.track===null&&pc.getTransceivers().find(t=>t.sender===s&&t.receiver.track.kind==="video"));if(sender)await sender.replaceTrack(track);}const local=document.getElementById("localVideo");if(local)local.srcObject=state.localStream;state.currentCall.type="video";updateCallUI({name:state.currentCall.targetName,avatar:state.currentCall.targetAvatar,status:"Connected",type:"video",waiting:false});}else{track.enabled=!track.enabled;}state.cameraEnabled=track.enabled;updateCallButtons();}catch(e){toast(e?.name==="NotAllowedError"?"Camera permission is required":"Unable to turn on video");}}
async function switchCallCamera(){const current=state.localStream?.getVideoTracks()[0];if(!current)return toggleCamera();const facing=current.getSettings?.().facingMode==="environment"?"user":"environment";try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing}},audio:false}),next=stream.getVideoTracks()[0];await replaceOutgoingVideo(next);state.localStream.removeTrack(current);state.localStream.addTrack(next);current.stop();const local=document.getElementById("localVideo");if(local)local.srcObject=state.localStream;}catch(e){toast(e?.message||"Unable to switch camera");}}
function toggleCallEffect(){const modal=document.getElementById("callModal"),enabled=modal?.classList.toggle("video-enhanced");document.getElementById("callEffectBtn")?.classList.toggle("active",!!enabled);}
function toggleSpeaker(){state.speakerEnabled=!state.speakerEnabled;document.querySelectorAll(".remote-video-tile video").forEach(v=>v.muted=!state.speakerEnabled);updateCallButtons();}
async function replaceOutgoingVideo(track){for(const pc of state.peerConnections.values()){const transceiver=pc.getTransceivers().find(t=>t.receiver.track.kind==="video");if(transceiver)await transceiver.sender.replaceTrack(track||null);}}
async function toggleScreenShare(){if(!state.peerConnections.size)return toast("Screen sharing is available after the call connects");if(state.screenStream)return stopScreenShare();if(!navigator.mediaDevices?.getDisplayMedia)return toast("Screen sharing is not supported on this device");try{state.screenStream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});const track=state.screenStream.getVideoTracks()[0];await replaceOutgoingVideo(track);const local=document.getElementById("localVideo");if(local)local.srcObject=state.screenStream;track.onended=stopScreenShare;updateCallButtons();}catch(e){if(e?.name!=="NotAllowedError")toast("Unable to share screen");}}
async function stopScreenShare(){if(!state.screenStream)return;state.screenStream.getTracks().forEach(t=>t.stop());state.screenStream=null;const track=state.localStream?.getVideoTracks()[0]||null;await replaceOutgoingVideo(track);const local=document.getElementById("localVideo");if(local)local.srcObject=state.localStream;updateCallButtons();}
function openAddParticipant(){if(!state.currentCall)return;const sheet=document.getElementById("callParticipantSheet"),list=document.getElementById("callParticipantList");if(!sheet||!list)return;const choices=state.conversations.map(c=>{const u=getOtherParticipant(c);return{userId:getId(u),name:userDisplayName(u),avatar:userAvatar(u),conversationId:conversationId(c)};}).filter((p,i,a)=>p.userId&&p.userId!==state.myId&&!state.peerConnections.has(String(p.userId))&&a.findIndex(x=>x.userId===p.userId)===i);list.innerHTML=choices.length?choices.map(p=>`<button type="button" data-call-user="${esc(p.userId)}"><img src="${esc(p.avatar||FALLBACK_AVATAR)}" alt=""><span>${esc(p.name)}</span><b>Add</b></button>`).join(""):'<p>Everyone in your chats is already in this call.</p>';list.querySelectorAll("button").forEach((button,index)=>button.onclick=async()=>{button.disabled=true;button.querySelector("b").textContent="Calling";try{await inviteCallUser(choices[index]);sheet.classList.add("hidden");}catch(e){button.disabled=false;button.querySelector("b").textContent="Add";toast(e.message||"Unable to add participant");}});sheet.classList.remove("hidden");}
function closeAddParticipant(){document.getElementById("callParticipantSheet")?.classList.add("hidden");}

async function refreshEverything(){try{await loadConversations();if(state.activeConversation)await openConversation(conversationId(state.activeConversation));if(typeof loadStories==="function")loadStories();toast("Messages refreshed");}catch(e){toast(e.message||"Unable to refresh");}}
function handleConversationSearchInput(value){state.conversationSearch=cleanText(value);clearTimeout(state.conversationSearchTimer);state.conversationSearchTimer=setTimeout(loadConversations,250);}

const voiceCapture={recorder:null,stream:null,chunks:[],phase:"idle",action:"",conversationId:"",startedAt:0,pausedAt:0,pausedTotal:0,timer:null,pointer:null,pendingGesture:null};
function voiceMimeType(){return["audio/webm;codecs=opus","audio/webm","audio/mp4"].find(type=>window.MediaRecorder?.isTypeSupported?.(type))||"";}
function formatVoiceDuration(ms){const total=Math.max(0,Math.floor(ms/1000));return Math.floor(total/60)+":"+String(total%60).padStart(2,"0");}
function voiceElapsed(){const end=voiceCapture.pausedAt||Date.now();return Math.max(0,end-voiceCapture.startedAt-voiceCapture.pausedTotal);}
function updateVoiceTimer(){const value=formatVoiceDuration(voiceElapsed());const live=document.getElementById("voiceRecordingTime"),locked=document.getElementById("voiceLockedTime");if(live)live.textContent=value;if(locked)locked.textContent=value;}
function setVoiceUi(phase="idle"){
  voiceCapture.phase=phase;const active=phase!=="idle"&&phase!=="stopping",locked=phase==="locked"||phase==="paused",composer=document.querySelector(".composer"),status=document.getElementById("voiceRecordingStatus"),hint=document.getElementById("voiceLockHint"),mic=document.getElementById("micBtn"),pause=document.getElementById("voicePauseBtn");
  composer?.classList.toggle("is-recording",active);composer?.classList.toggle("voice-is-locked",locked);composer?.classList.toggle("voice-is-paused",phase==="paused");status?.classList.toggle("hidden",!active);hint?.classList.toggle("hidden",!active||locked);mic?.classList.toggle("recording",active&&!locked);
  if(pause){pause.querySelector("span").textContent=phase==="paused"?"Resume":"Pause";pause.setAttribute("aria-label",phase==="paused"?"Resume recording":"Pause recording");}
  if(!active){clearInterval(voiceCapture.timer);voiceCapture.timer=null;if(document.getElementById("voiceRecordingTime"))document.getElementById("voiceRecordingTime").textContent="0:00";if(document.getElementById("voiceLockedTime"))document.getElementById("voiceLockedTime").textContent="0:00";}
}
function stopVoiceTracks(){voiceCapture.stream?.getTracks().forEach(track=>track.stop());voiceCapture.stream=null;}
function resetVoiceCapture(){clearInterval(voiceCapture.timer);stopVoiceTracks();voiceCapture.recorder=null;voiceCapture.chunks=[];voiceCapture.phase="idle";voiceCapture.action="";voiceCapture.conversationId="";voiceCapture.startedAt=0;voiceCapture.pausedAt=0;voiceCapture.pausedTotal=0;voiceCapture.pointer=null;voiceCapture.pendingGesture=null;setVoiceUi("idle");}
async function beginVoiceRecording({pointerId=null,x=0,y=0,started=Date.now(),tap=false}={}){
  if(voiceCapture.phase!=="idle")return;
  if(!state.activeConversation)return toast("Select a conversation first");
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined"){toast("Voice recording is not supported by this browser");return chooseAttachment("audio");}
  clearAttachment();closeChatPicker();voiceCapture.phase="acquiring";voiceCapture.conversationId=String(conversationId(state.activeConversation));voiceCapture.pointer=pointerId===null?null:{id:pointerId,x,y,started,released:false,cancel:false,lock:tap};
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
    if(voiceCapture.phase!=="acquiring"){stream.getTracks().forEach(track=>track.stop());return;}
    voiceCapture.stream=stream;voiceCapture.chunks=[];voiceCapture.action="";const mime=voiceMimeType(),recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);voiceCapture.recorder=recorder;
    recorder.addEventListener("dataavailable",event=>{if(event.data?.size)voiceCapture.chunks.push(event.data);});
    recorder.addEventListener("stop",finalizeVoiceRecording);
    recorder.start(200);voiceCapture.startedAt=Date.now();voiceCapture.pausedAt=0;voiceCapture.pausedTotal=0;voiceCapture.timer=setInterval(updateVoiceTimer,200);updateVoiceTimer();
    const gesture=voiceCapture.pointer;if(gesture?.cancel)return finishVoiceRecording("discard");if(gesture?.lock||gesture?.released&&gesture.releasedAt-gesture.started<450)return lockVoiceRecording();setVoiceUi("holding");if(gesture?.released)finishVoiceRecording("send");
  }catch(error){resetVoiceCapture();toast(error?.name==="NotAllowedError"?"Microphone permission is required":error.message||"Unable to start voice recording");}
}
async function finalizeVoiceRecording(){
  const action=voiceCapture.action,mime=voiceCapture.recorder?.mimeType||voiceMimeType()||"audio/webm",chunks=voiceCapture.chunks.slice(),target=voiceCapture.conversationId;stopVoiceTracks();clearInterval(voiceCapture.timer);voiceCapture.timer=null;
  if(action!=="send"){resetVoiceCapture();return;}
  if(!chunks.length){resetVoiceCapture();return toast("No audio was captured");}
  if(!state.activeConversation||String(conversationId(state.activeConversation))!==target){resetVoiceCapture();return toast("Recording cancelled because the conversation changed");}
  const blob=new Blob(chunks,{type:mime});if(!blob.size){resetVoiceCapture();return toast("No audio was captured");}
  const extension=mime.includes("mp4")?"m4a":"webm",file=new File([blob],"aift-voice-"+Date.now()+"."+extension,{type:mime,lastModified:Date.now()});resetVoiceCapture();state.attachment=file;state.attachments=[file];await sendMessage();
}
function finishVoiceRecording(action="send"){if(!voiceCapture.recorder)return resetVoiceCapture();voiceCapture.action=action;setVoiceUi("stopping");try{if(voiceCapture.recorder.state!=="inactive"){voiceCapture.recorder.requestData?.();voiceCapture.recorder.stop();}else finalizeVoiceRecording();}catch{resetVoiceCapture();}}
function lockVoiceRecording(){if(!["acquiring","holding"].includes(voiceCapture.phase))return;if(voiceCapture.pointer)voiceCapture.pointer.lock=true;if(voiceCapture.recorder)setVoiceUi("locked");}
function cancelVoiceRecording(){if(voiceCapture.phase==="idle")return;finishVoiceRecording("discard");}
function sendVoiceRecording(){if(["locked","paused","holding"].includes(voiceCapture.phase))finishVoiceRecording("send");}
function toggleVoiceRecordingPause(){const recorder=voiceCapture.recorder;if(!recorder)return;if(voiceCapture.phase==="locked"&&recorder.state==="recording"){recorder.pause();voiceCapture.pausedAt=Date.now();setVoiceUi("paused");updateVoiceTimer();}else if(voiceCapture.phase==="paused"&&recorder.state==="paused"){voiceCapture.pausedTotal+=Date.now()-voiceCapture.pausedAt;voiceCapture.pausedAt=0;recorder.resume();setVoiceUi("locked");}}
window.discardVoiceRecordingForConversationSwitch=function(){if(voiceCapture.phase!=="idle")cancelVoiceRecording();};
function bindVoiceRecorderEvents(){
  const mic=document.getElementById("micBtn");if(!mic)return;mic.style.touchAction="none";
  mic.addEventListener("pointerdown",event=>{if(event.button!==undefined&&event.button!==0)return;event.preventDefault();mic.setPointerCapture?.(event.pointerId);beginVoiceRecording({pointerId:event.pointerId,x:event.clientX,y:event.clientY,started:Date.now()});});
  mic.addEventListener("pointermove",event=>{const gesture=voiceCapture.pointer;if(!gesture||gesture.id!==event.pointerId||gesture.released)return;const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;if(dx<=-72&&Math.abs(dx)>Math.abs(dy)){gesture.cancel=true;cancelVoiceRecording();return;}if(dy<=-64&&Math.abs(dy)>Math.abs(dx)*.72)lockVoiceRecording();});
  const release=event=>{const gesture=voiceCapture.pointer;if(!gesture||gesture.id!==event.pointerId||gesture.released)return;gesture.released=true;gesture.releasedAt=Date.now();mic.releasePointerCapture?.(event.pointerId);if(gesture.cancel)return;if(gesture.lock||voiceCapture.phase==="locked"||voiceCapture.phase==="paused")return;if(voiceCapture.phase==="acquiring")return;if(gesture.releasedAt-gesture.started<450)lockVoiceRecording();else finishVoiceRecording("send");};
  mic.addEventListener("pointerup",release);mic.addEventListener("pointercancel",event=>{const gesture=voiceCapture.pointer;if(gesture?.id===event.pointerId&&!gesture.lock)cancelVoiceRecording();});
  mic.addEventListener("click",event=>{if(event.detail===0)beginVoiceRecording({tap:true});});
}

function bindEvents(){
  initializeChatTheme();
  bindVoiceRecorderEvents();
  const input=document.getElementById("messageInput");if(input){input.addEventListener("input",()=>{autoGrowComposer();saveActiveConversationDraft();if(state.activeOtherUser&&state.socket){state.socket.emit("typing",{to:getId(state.activeOtherUser)});clearTimeout(state.typingTimer);state.typingTimer=setTimeout(()=>state.socket.emit("stopTyping",{to:getId(state.activeOtherUser)}),900);}});input.addEventListener("keydown",e=>{if(e.key!=="Enter")return;const isMobileComposer=window.matchMedia("(max-width:760px)").matches||navigator.maxTouchPoints>0;if(isMobileComposer)return;if(!e.shiftKey){e.preventDefault();sendMessage();}});input.addEventListener("select",()=>{state.composerSelectionStart=input.selectionStart??input.value.length;state.composerSelectionEnd=input.selectionEnd??input.value.length;});input.addEventListener("focus",()=>{if(state.pickerOpen)closeChatPicker();});}
  document.getElementById("fileInput")?.addEventListener("change",e=>{if(e.target.files?.length)handleAttachmentSelected(e.target.files);});document.getElementById("cameraInput")?.addEventListener("change",e=>{if(e.target.files?.length)handleCameraCapture(e.target.files);});document.getElementById("mediaReviewInput")?.addEventListener("change",e=>{if(e.target.files?.length)addMediaReviewFiles(e.target.files);e.target.value="";});document.getElementById("stickerImportInput")?.addEventListener("change",e=>{const f=e.target.files?.[0];if(f)handleStickerImport(f);e.target.value="";});document.getElementById("gifSearchInput")?.addEventListener("input",e=>{clearTimeout(state.gifSearchTimer);state.gifSearchTimer=setTimeout(()=>searchGifLocal(e.target.value),250);});
  document.getElementById("conversationSearch")?.addEventListener("input",e=>handleConversationSearchInput(e.target.value));document.getElementById("userSearchInput")?.addEventListener("input",e=>{clearTimeout(state.userSearchTimer);state.userSearchTimer=setTimeout(()=>searchUsers(e.target.value),280);});
  const box=getMessagesBox();if(box)box.addEventListener("scroll",()=>{updateJumpButtonFromScroll();if(box.scrollTop<80)loadOlderMessages();positionMessageReactionBar();});
  document.addEventListener("click",e=>{const menu=document.getElementById("attachmentMenu");if(menu&&!menu.contains(e.target)&&!e.target.closest(".composer-icon"))menu.classList.add("hidden");if(!e.target.closest(".call-start-wrap"))closeCallStartMenu();if(!e.target.closest("#selectionMoreMenu")&&!e.target.closest(".message-action-bar"))closeSelectionMoreMenu();if(!e.target.closest("#chatMoreMenu")&&!e.target.closest("#chatMoreBtn"))closeChatMoreMenu();const drawer=document.getElementById("chatInfoDrawer");if(drawer&&!drawer.classList.contains("hidden")&&e.target===drawer)closeChatInfo();const modal=document.getElementById("confirmModal");if(modal&&!modal.classList.contains("hidden")&&e.target===modal)closeConfirmModal();});
  window.addEventListener("resize",()=>{if(window.innerWidth>760)showConversationSidebar();});
}
async function openInitialTarget(){if(initialConversationId){try{await openConversation(initialConversationId);return;}catch{}}const uid=initialUserId||initialConversationId;if(uid){try{const c=await apiJSON("/api/conversations/direct","POST",{userId:uid});await loadConversations();await openConversation(conversationId(c));return;}catch(e){toast(e.message||"Unable to open conversation");}}showEmptyState();}
async function initMessagesPage(){if(!requireAuth())return;bindEvents();try{await loadMe();loadConversationDrafts();loadOpenedConversations();connectSocket();await loadConversations();await openInitialTarget();}catch(e){console.error("MESSAGES INIT ERROR:",e);toast(e.message||"Unable to load messages");showEmptyState();}}

document.addEventListener("DOMContentLoaded",()=>{setupAiftSounds();initMessagesPage();});
