const API = "https://backend-1-9b6f.onrender.com";
const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const params = new URLSearchParams(window.location.search);
const meetingCodeParam = params.get("code") || "";
const meetingIdParam = params.get("id") || "";

const meetingState = {
  token:"",
  role:"",
  me:null,
  myId:"",
  socket:null,

  meeting:null,
  meetingId:"",
  meetingCode:"",
  isHost:false,
  accessMode:"restricted",
rawLocalStream:null,
processedStream:null,
backgroundMode:"none",
backgroundImage:null,
backgroundCanvas:null,
backgroundVideo:null,
backgroundProcessor:null,
backgroundProcessing:false,
backgroundAnimation:null,
  localStream:null,
screenStream:null,
peerConnections:{},
remoteStreams:{},
makingOffer:{},
ignoreOffer:{},

  micMuted:false,
  cameraOff:false,
  handRaised:false,
  sharingScreen:false,

  startedAt:null,
  timer:null,

  participants:[],
  chatMessages:[],
  waitingUsers:[],

  lobbyStream:null
};

const RTC_CONFIG = {
  iceServers:[
    { urls:"stun:stun.l.google.com:19302" },
    { urls:"stun:stun1.l.google.com:19302" },
    { urls:"stun:stun2.l.google.com:19302" }
  ]
};

/* AUTH */

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

function authHeaders(extra = {}){
  return {
    ...(meetingState.token ? { Authorization:"Bearer " + meetingState.token } : {}),
    ...extra
  };
}

async function api(path, options = {}){
  const res = await fetch(API + path,{
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

async function apiJSON(path, method="GET", body=null){
  return api(path,{
    method,
    headers:authHeaders({ "Content-Type":"application/json" }),
    body:body ? JSON.stringify(body) : undefined
  });
}

function toast(message){
  const el = document.getElementById("toast");
  if(!el) return;

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(window.__meetingToast);
  window.__meetingToast = setTimeout(()=>el.classList.remove("show"),2400);
}

function esc(value=""){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getId(value){
  if(!value) return "";
  if(typeof value === "string") return value;
  return value._id || value.id || "";
}

function displayName(user={}){
  return user.companyName || user.schoolName || user.name || "AIFT User";
}

function avatar(user={}){
  return user.profileImage || user.logo || user.avatar || FALLBACK_AVATAR;
}

/* INIT */

async function initMeeting(){
  meetingState.role = getRole();
  meetingState.token = getToken();

  if(!meetingState.token){
    window.location.href =
      "login.html?next=" + encodeURIComponent(location.pathname + location.search);
    return;
  }

  await loadMe();
  connectSocket();
  await loadMeeting();
  await openLobby();
}

async function loadMe(){
  const data = await api("/api/users/me",{ headers:authHeaders() });

  meetingState.me = data.user || data;
  meetingState.myId = getId(meetingState.me);
}

async function loadMeeting(){
  if(meetingCodeParam){
    meetingState.meeting =
      await api(`/api/meetings/code/${encodeURIComponent(meetingCodeParam)}`,{
        headers:authHeaders()
      });
  }else if(meetingIdParam){
    meetingState.meeting =
      await api(`/api/meetings/${encodeURIComponent(meetingIdParam)}`,{
        headers:authHeaders()
      });
  }else{
    throw new Error("Meeting code is missing");
  }

  meetingState.meetingId = getId(meetingState.meeting);
  meetingState.meetingCode = meetingState.meeting.meetingCode || meetingCodeParam;
  meetingState.isHost =
    getId(meetingState.meeting.host) === meetingState.myId;

meetingState.accessMode =
  meetingState.meeting.accessMode ||
  (meetingState.meeting.waitingRoomEnabled ? "waiting_room" : "restricted");

  document.getElementById("meetingTitle").textContent =
    meetingState.meeting.title || "AIFT Meeting";

  document.getElementById("meetingStatus").textContent =
    meetingState.isHost
      ? "You are the host"
      : "Ready to join";

  document.getElementById("meetingCode").textContent =
    meetingState.meetingCode;

  document.getElementById("infoMeetingCode").textContent =
    meetingState.meetingCode;

  document.getElementById("infoHost").textContent =
    displayName(meetingState.meeting.host || {});

  const accessSelect =
  document.getElementById("meetingAccessMode");

if(accessSelect){
  accessSelect.value =
    meetingState.meeting.accessMode || "restricted";

  accessSelect.onchange =
    saveAccessMode;
}

renderParticipants();
renderWaitingRoom();
renderMeetingAnalytics();
}

/* SOCKET */

function connectSocket(){
  meetingState.socket = io(API,{
    auth:{ token:meetingState.token },
    transports:["websocket","polling"]
  });

  meetingState.socket.on("connect",()=>{
    meetingState.socket.emit("join",meetingState.myId);
  });

meetingState.socket.on("meetingParticipantJoined", async payload => {
  toast("Participant joined");
  hideWaitingOverlay();

  await reloadMeetingSoft();

  const userId = payload?.userId || payload?.participantId;

  if(userId && userId !== meetingState.myId){
    await createOfferForSingleParticipant(userId);
  }else{
    await createOfferForParticipants();
  }
});

meetingState.socket.on("meetingParticipantLeft",payload=>{
  toast("Participant left");

  if(payload?.userId){
    removeParticipantVideoTile(payload.userId);
  }

  reloadMeetingSoft();
});

  meetingState.socket.on("meetingWaitingRoomRequest",payload=>{
    if(meetingState.isHost){
      toast("Someone is waiting to join");
      reloadMeetingSoft();
    }
  });

  meetingState.socket.on("meetingWaitingRoomApproved",()=>{
    toast("Host approved your access");
    joinMeetingNow();
  });

  meetingState.socket.on("meetingWaitingRoomRejected",()=>{
    toast("Host rejected your access");
    setTimeout(()=>location.href="home.html",1200);
  });

  meetingState.socket.on("meetingEnded",()=>{
    toast("Meeting ended by host");
    cleanupMeeting();
    setTimeout(()=>location.href="home.html",1000);
  });

meetingState.socket.on("webrtcOffer", async payload => {
  if(!payload.offer || !payload.from) return;

  const pc = await ensurePeerConnection(payload.from);
  if(!pc) return;

  const offerCollision =
    pc.signalingState !== "stable";

  meetingState.ignoreOffer[payload.from] =
    !meetingState.isHost && offerCollision;

  if(meetingState.ignoreOffer[payload.from]){
    console.warn("Ignored offer collision from", payload.from);
    return;
  }

  try{
    await pc.setRemoteDescription(
      new RTCSessionDescription(payload.offer)
    );

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    meetingState.socket.emit("webrtcAnswer", {
      to: payload.from,
      answer: pc.localDescription,
      meetingId: meetingState.meetingId
    });

  }catch(error){
    console.warn("Offer handling failed:", error.message);
  }
});

meetingState.socket.on("webrtcAnswer", async payload => {
  if(!payload.answer || !payload.from) return;

  const pc = meetingState.peerConnections[payload.from];
  if(!pc) return;

  if(pc.signalingState !== "have-local-offer"){
    console.warn(
      "Skipped answer because signalingState is",
      pc.signalingState
    );
    return;
  }

  try{
    await pc.setRemoteDescription(
      new RTCSessionDescription(payload.answer)
    );
  }catch(error){
    console.warn("Answer handling failed:", error.message);
  }
});

meetingState.socket.on("webrtcIceCandidate", async payload => {
  if(!payload.candidate || !payload.from) return;

  const pc = meetingState.peerConnections[payload.from];
  if(!pc) return;

  try{
    await pc.addIceCandidate(
      new RTCIceCandidate(payload.candidate)
    );
  }catch(error){
    console.warn("ICE failed:", error.message);
  }
});

  meetingState.socket.on("participantHandRaised",payload=>{
    toast("A participant raised their hand");
    reloadMeetingSoft();
  });

meetingState.socket.on("screenShareStatus",payload=>{
  toast(payload.sharing ? "Screen sharing started" : "Screen sharing stopped");

  if(payload.sharing){
    document.querySelector(".stage")?.classList.add("screen-sharing-mode");
    document.getElementById("screenShareLabel").textContent =
      payload.name ? `${payload.name} is presenting` : "Someone is presenting";
  }else{
    document.querySelector(".stage")?.classList.remove("screen-sharing-mode");
    document.getElementById("screenShareVideo").srcObject = null;
  }
});
}

/* LOBBY */

async function openLobby(){
  const lobby = document.createElement("div");
  lobby.id = "meetingLobby";
  lobby.className = "lobby";

  lobby.innerHTML = `
    <div class="lobby-card">
      <h2>Join ${esc(meetingState.meeting.title || "AIFT Meeting")}</h2>
      <p>Check your camera and microphone before joining.</p>

      <div class="lobby-preview">
        <video id="lobbyVideo" autoplay muted playsinline></video>
      </div>

      <div class="lobby-actions">
        <button class="secondary-btn" onclick="toggleLobbyCamera()">Camera</button>
        <button class="secondary-btn" onclick="toggleLobbyMic()">Microphone</button>
        <button class="join-btn" onclick="joinMeetingNow()">Join now</button>
      </div>
    </div>
  `;

  document.body.appendChild(lobby);

  try{
    meetingState.lobbyStream =
      await navigator.mediaDevices.getUserMedia({
        audio:true,
        video:{
          width:{ ideal:1280 },
          height:{ ideal:720 },
          facingMode:"user"
        }
      });

    document.getElementById("lobbyVideo").srcObject =
      meetingState.lobbyStream;

  }catch(error){
    toast("Camera or microphone permission is needed.");
  }
}

function toggleLobbyCamera(){
  const track = meetingState.lobbyStream?.getVideoTracks?.()[0];
  if(!track) return;

  track.enabled = !track.enabled;
  toast(track.enabled ? "Camera on" : "Camera off");
}

function toggleLobbyMic(){
  const track = meetingState.lobbyStream?.getAudioTracks?.()[0];
  if(!track) return;

  track.enabled = !track.enabled;
  toast(track.enabled ? "Microphone on" : "Microphone muted");
}

async function joinMeetingNow(){
  try{
    const response =
      await apiJSON(
        `/api/meetings/${encodeURIComponent(meetingState.meetingId)}/join`,
        "POST",
        {}
      );

    if(response.waitingRoom){
      document.getElementById("meetingStatus").textContent =
        "Waiting for host approval";

      toast("Waiting for host approval");
      return;
    }

    document.getElementById("meetingLobby")?.remove();

    await startLocalMediaFromLobbyOrFresh();

    meetingState.socket.emit("joinMeetingRoom",{
      meetingId:meetingState.meetingId
    });

    meetingState.startedAt = Date.now();
    startTimer();

    document.getElementById("meetingStatus").textContent =
      "Meeting live";

    reloadMeetingSoft();
    hideWaitingOverlay();

    await createOfferForParticipants();

  }catch(error){
    toast(error.message || "Unable to join meeting");
  }
}

async function startLocalMediaFromLobbyOrFresh(){
  if(meetingState.lobbyStream){
    meetingState.localStream = meetingState.lobbyStream;
    meetingState.lobbyStream = null;
  }else{
    meetingState.localStream =
      await navigator.mediaDevices.getUserMedia({
        audio:true,
        video:{
          width:{ ideal:1280 },
          height:{ ideal:720 },
          facingMode:"user"
        }
      });
  }

meetingState.rawLocalStream = meetingState.localStream;

document.getElementById("localVideo").srcObject =
  meetingState.localStream;

const savedBg =
  localStorage.getItem("aiftMeetingBackground") || "none";

if(savedBg !== "none"){
  setTimeout(()=>{
    setBackgroundMode(savedBg);
  },600);
}
}

/* WEBRTC */

async function ensurePeerConnection(remoteUserId){
  if(!remoteUserId) return null;

  if(meetingState.peerConnections[remoteUserId]){
    return meetingState.peerConnections[remoteUserId];
  }

  const pc = new RTCPeerConnection(RTC_CONFIG);

  meetingState.peerConnections[remoteUserId] = pc;
  meetingState.remoteStreams[remoteUserId] = new MediaStream();

  addParticipantVideoTile({
    _id:remoteUserId,
    name:"Participant"
  });

  meetingState.localStream?.getTracks().forEach(track=>{
    pc.addTrack(track,meetingState.localStream);
  });

  pc.ontrack = event=>{
    event.streams[0].getTracks().forEach(track=>{
      meetingState.remoteStreams[remoteUserId].addTrack(track);
    });

    const video =
      document.getElementById(`stream-${remoteUserId}`);

    if(video){
      video.srcObject = meetingState.remoteStreams[remoteUserId];
    }

    const status =
      document.getElementById(`status-${remoteUserId}`);

    if(status){
      status.textContent = "Connected";
    }

    hideWaitingOverlay();
  };

  pc.onicecandidate = event=>{
    if(event.candidate){
      meetingState.socket.emit("webrtcIceCandidate",{
        to:remoteUserId,
        candidate:event.candidate,
        meetingId:meetingState.meetingId
      });
    }
  };

  pc.onconnectionstatechange = ()=>{
    const status =
      document.getElementById(`status-${remoteUserId}`);

    if(status){
      status.textContent = pc.connectionState;
    }

    if(["failed","closed","disconnected"].includes(pc.connectionState)){
      removeParticipantVideoTile(remoteUserId);
    }
  };

  return pc;
}

async function createOfferForParticipants(){
  const others =
    (meetingState.meeting.participants || [])
      .map(p => p.user || p)
      .filter(user => getId(user) && getId(user) !== meetingState.myId);

  for(const user of others){
    const userId = getId(user);

    addParticipantVideoTile(user);

    await createOfferForSingleParticipant(userId);
  }
}

async function createOfferForSingleParticipant(userId){
  if(!userId || userId === meetingState.myId) return;

  const pc = await ensurePeerConnection(userId);
  if(!pc) return;

if(pc.signalingState !== "stable"){
  console.warn("Skipping offer, connection is not stable:", pc.signalingState);
  return;
}

meetingState.makingOffer[userId] = true;

try{
  const offer = await pc.createOffer({
    offerToReceiveAudio:true,
    offerToReceiveVideo:true
  });

  await pc.setLocalDescription(offer);

  meetingState.socket.emit("webrtcOffer",{
    to:userId,
    offer:pc.localDescription,
    meetingId:meetingState.meetingId
  });

}finally{
  meetingState.makingOffer[userId] = false;
}
}

function addParticipantVideoTile(user){
  const userId = getId(user);

  if(!userId || document.getElementById(`video-${userId}`)){
    return;
  }

  const grid =
    document.getElementById("videoGrid");

  if(!grid) return;

  const tile =
    document.createElement("article");

  tile.className = "video-tile remote-tile";
  tile.id = `video-${userId}`;

  tile.innerHTML = `
    <video
      id="stream-${userId}"
      autoplay
      playsinline
    ></video>

    <div class="tile-footer">
      <span>${esc(displayName(user))}</span>
      <strong id="status-${userId}">Connecting...</strong>
    </div>
  `;

  grid.appendChild(tile);
  updateVideoGridLayout();
}

function removeParticipantVideoTile(userId){
  document.getElementById(`video-${userId}`)?.remove();

  if(meetingState.peerConnections[userId]){
    try{
      meetingState.peerConnections[userId].close();
    }catch(error){}
  }

  delete meetingState.peerConnections[userId];
  delete meetingState.remoteStreams[userId];

  updateVideoGridLayout();
}

function updateVideoGridLayout(){
  const grid =
    document.getElementById("videoGrid");

  if(!grid) return;

  const count =
    grid.querySelectorAll(".video-tile").length;

  grid.dataset.count = String(count);
}

/* CONTROLS */

function toggleMeetingMic(){
  const track = meetingState.localStream?.getAudioTracks?.()[0];
  if(!track) return;

  meetingState.micMuted = !meetingState.micMuted;
  track.enabled = !meetingState.micMuted;

  document.getElementById("micBtn").classList.toggle("active",meetingState.micMuted);
  document.querySelector("#micBtn span").textContent =
    meetingState.micMuted ? "Unmute" : "Mute";

  document.getElementById("localMicStatus").textContent =
    meetingState.micMuted ? "Mic off" : "Mic on";
}

function toggleMeetingCamera(){
  const track = meetingState.localStream?.getVideoTracks?.()[0];
  if(!track) return;

  meetingState.cameraOff = !meetingState.cameraOff;
  track.enabled = !meetingState.cameraOff;

  document.getElementById("cameraBtn").classList.toggle("active",meetingState.cameraOff);
  document.querySelector("#cameraBtn span").textContent =
    meetingState.cameraOff ? "Camera off" : "Camera";
}

async function toggleMeetingScreenShare(){
  if(meetingState.screenStream){
    stopMeetingScreenShare();
    return;
  }

  try{
    meetingState.screenStream =
      await navigator.mediaDevices.getDisplayMedia({
video:{
  cursor:"always",
  displaySurface:"window"
},
audio:false,
preferCurrentTab:false,
selfBrowserSurface:"exclude",
surfaceSwitching:"include"
      });

    meetingState.sharingScreen = true;

    const screenTrack =
      meetingState.screenStream.getVideoTracks()[0];

Object.values(meetingState.peerConnections || {}).forEach(async pc=>{
  const sender =
    pc.getSenders().find(s => s.track?.kind === "video");

  if(sender){
    await sender.replaceTrack(screenTrack);
  }
});

document.querySelector(".stage")?.classList.add("screen-sharing-mode");

document.getElementById("screenShareVideo").srcObject =
  meetingState.screenStream;

document.getElementById("screenShareLabel").textContent =
  "You are presenting";


    screenTrack.onended =
      stopMeetingScreenShare;

    meetingState.socket.emit("screenShareStatus",{
      meetingId:meetingState.meetingId,
      sharing:true
    });

    document.getElementById("shareBtn").classList.add("active");

  }catch(error){
    toast("Unable to share screen");
  }
}

async function stopMeetingScreenShare(){
  meetingState.screenStream?.getTracks().forEach(t=>t.stop());
  meetingState.screenStream = null;
  meetingState.sharingScreen = false;

  const cameraTrack =
    meetingState.localStream?.getVideoTracks?.()[0];

Object.values(meetingState.peerConnections || {}).forEach(async pc=>{
  const sender =
    pc.getSenders().find(s => s.track?.kind === "video");

  if(sender && cameraTrack){
    await sender.replaceTrack(cameraTrack);
  }
});

document.querySelector(".stage")?.classList.remove("screen-sharing-mode");

document.getElementById("screenShareVideo").srcObject = null;

document.getElementById("localVideo").srcObject =
  meetingState.localStream;

  meetingState.socket.emit("screenShareStatus",{
    meetingId:meetingState.meetingId,
    sharing:false
  });

  document.getElementById("shareBtn").classList.remove("active");

}

function toggleRaiseHand(){
  meetingState.handRaised = !meetingState.handRaised;

  meetingState.socket.emit("raiseHand",{
    meetingId:meetingState.meetingId,
    raised:meetingState.handRaised
  });

  document.getElementById("handBtn").classList.toggle("active",meetingState.handRaised);
}

function toggleSidePanel(){
  document.getElementById("sidePanel").classList.toggle("hidden");
}

function switchPanel(panel,btn){
  document
    .querySelectorAll(".side-tabs button")
    .forEach(button=>button.classList.remove("active"));

  btn?.classList.add("active");

[
  "participants",
  "chat",
  "info",
  "host",
  "waiting",
  "analytics",
  "background"
].forEach(id=>{
    document
      .getElementById(id + "Panel")
      ?.classList
      .add("hidden");
  });

  document
    .getElementById(panel + "Panel")
    ?.classList
    .remove("hidden");

  if(panel === "waiting"){
    renderWaitingRoom();
  }

  if(panel === "analytics"){
    renderMeetingAnalytics();
  }
}

/* PARTICIPANTS */

async function reloadMeetingSoft(){
  try{
    const meeting =
      await api(`/api/meetings/${encodeURIComponent(meetingState.meetingId)}`,{
        headers:authHeaders()
      });

    meetingState.meeting = meeting;
    renderParticipants();

  }catch(error){
    console.warn("Reload meeting failed:",error.message);
  }
}

function renderParticipants(){
  const list = document.getElementById("participantsList");
  if(!list || !meetingState.meeting) return;

  const participants =
    meetingState.meeting.participants || [];

  if(!participants.length){
    list.innerHTML = `<p>No participants yet.</p>`;
    return;
  }

  list.innerHTML =
    participants.map(p=>{
      const user = p.user || p;
      const id = getId(user);

      return `
        <div class="participant-card">
          <div class="participant-user">
            <img src="${esc(avatar(user))}" alt="">
            <div>
              <strong>${esc(displayName(user))}</strong>
              <span>${esc(p.role || "participant")}</span>
            </div>
          </div>

          ${
            meetingState.isHost && id !== meetingState.myId
              ? `
                <div class="participant-actions">
                  <button onclick="removeParticipant('${esc(id)}')">Remove</button>
                </div>
              `
              : ""
          }
        </div>
      `;
    }).join("");
}

async function removeParticipant(userId){
  if(!meetingState.isHost) return;

  try{
    await apiJSON(
      `/api/meetings/${encodeURIComponent(meetingState.meetingId)}/participants/${encodeURIComponent(userId)}/remove`,
      "PATCH",
      {}
    );

    toast("Participant removed");
    reloadMeetingSoft();

  }catch(error){
    toast(error.message || "Unable to remove participant");
  }
}

/* CHAT */

function sendMeetingChat(){
  const input = document.getElementById("meetingChatInput");
  const text = String(input.value || "").trim();

  if(!text) return;

  const message = {
    sender:displayName(meetingState.me),
    text,
    createdAt:new Date().toISOString()
  };

  meetingState.chatMessages.push(message);
  input.value = "";

  renderMeetingChat();

  meetingState.socket.emit("meetingChatMessage",{
    meetingId:meetingState.meetingId,
    message
  });
}

function renderMeetingChat(){
  const box = document.getElementById("meetingChatMessages");
  if(!box) return;

  box.innerHTML =
    meetingState.chatMessages.map(msg=>`
      <div class="meeting-chat-msg">
        <strong>${esc(msg.sender)}</strong>
        <p>${esc(msg.text)}</p>
      </div>
    `).join("");

  box.scrollTop = box.scrollHeight;
}

/* INVITE */

function getMeetingInviteLink(){
  return `${location.origin}/meeting.html?code=${encodeURIComponent(meetingState.meetingCode)}`;
}

async function copyMeetingLink(){
  const url = getMeetingInviteLink();

  try{
    await navigator.clipboard.writeText(url);
    toast("AIFT Meet link copied");
  }catch{
    toast(url);
  }
}

function renderInvitePreview(){
  const box = document.getElementById("invitePreviewBox");
  if(!box) return;

  const url = getMeetingInviteLink();

  box.innerHTML = `
    <div class="aift-invite-preview">
      <div class="aift-invite-logo">
        <img src="images/aift-logo.png" alt="AIFT">
      </div>

      <div class="aift-invite-content">
        <strong>${esc(meetingState.meeting?.title || "AIFT Meeting")}</strong>
        <span>Join with camera and microphone preview</span>
        <p>${esc(url)}</p>
      </div>

      <button onclick="copyMeetingLink()">Copy</button>
    </div>
  `;
}

/* TIMER */

function startTimer(){
  if(meetingState.timer){
    clearInterval(meetingState.timer);
  }

  meetingState.timer = setInterval(()=>{
    const diff =
      Math.floor((Date.now() - meetingState.startedAt) / 1000);

    const min =
      String(Math.floor(diff / 60)).padStart(2,"0");

    const sec =
      String(diff % 60).padStart(2,"0");

    document.getElementById("meetingTimer").textContent =
      `${min}:${sec}`;
  },1000);
}

/* LEAVE */

async function leaveMeeting(){
  try{
    await apiJSON(
      `/api/meetings/${encodeURIComponent(meetingState.meetingId)}/leave`,
      "POST",
      {}
    );
  }catch(error){}

  meetingState.socket?.emit("leaveMeetingRoom",{
    meetingId:meetingState.meetingId
  });

  cleanupMeeting();

  location.href = "messages.html";
}

function cleanupMeeting(){
  meetingState.localStream?.getTracks().forEach(t=>t.stop());
  Object.values(meetingState.remoteStreams || {}).forEach(stream=>{
  stream.getTracks().forEach(track=>track.stop());
});

Object.values(meetingState.peerConnections || {}).forEach(pc=>{
  try{
    pc.close();
  }catch(error){}
});

meetingState.peerConnections = {};
meetingState.remoteStreams = {};
  meetingState.screenStream?.getTracks().forEach(t=>t.stop());
  meetingState.lobbyStream?.getTracks().forEach(t=>t.stop());

Object.values(meetingState.peerConnections || {}).forEach(pc=>{
  try{
    pc.close();
  }catch(error){}
});

meetingState.peerConnections = {};
meetingState.remoteStreams = {};

  if(meetingState.timer){
    clearInterval(meetingState.timer);
  }
}

function hideWaitingOverlay(){
  document.getElementById("waitingOverlay")?.classList.add("hidden");
}

window.addEventListener("beforeunload",cleanupMeeting);

document.addEventListener("DOMContentLoaded",()=>{
  initMeeting().catch(error=>{
    console.error(error);
    toast(error.message || "Unable to open meeting");
  });
});

async function muteAllParticipants(){
  await apiJSON(
    `/api/meetings/${meetingState.meetingId}/mute-all`,
    "PATCH",
    {}
  );

  toast("All participants muted");
}

async function endMeetingForEveryone(){

  if(!confirm("End meeting for everyone?")){
    return;
  }

  await apiJSON(
    `/api/meetings/${meetingState.meetingId}/end-for-everyone`,
    "PATCH",
    {}
  );
}

async function updateMeetingAccessPatch(patch){
  try{
    const meeting =
      await apiJSON(
        `/api/meetings/${encodeURIComponent(meetingState.meetingId)}/access`,
        "PATCH",
        patch
      );

    meetingState.meeting = meeting;
    toast("Meeting settings updated");
    renderParticipants();

  }catch(error){
    toast(error.message || "Unable to update meeting settings");
  }
}

async function saveAccessMode(){
  const accessMode =
    document.getElementById("meetingAccessMode")?.value || "restricted";

  await updateMeetingAccessPatch({ accessMode });
}

async function toggleMeetingLock(){
  const next =
    !meetingState.meeting?.lockMeeting;

  await updateMeetingAccessPatch({
    lockMeeting:next
  });

  toast(next ? "Meeting locked" : "Meeting unlocked");
}

async function disableAllCameras(){
  await updateMeetingAccessPatch({
    allowParticipantVideo:false
  });

  toast("Participant cameras disabled");
}

async function toggleMeetingChatPermission(){
  const current =
    meetingState.meeting?.hostControls?.allowParticipantsToChat !== false;

  await updateMeetingAccessPatch({
    hostControls:{
      allowParticipantsToChat:!current
    }
  });

  toast(!current ? "Chat enabled" : "Chat disabled");
}

async function toggleScreenSharePermission(){
  const current =
    meetingState.meeting?.hostControls?.allowParticipantsToShareScreen !== false;

  await updateMeetingAccessPatch({
    hostControls:{
      allowParticipantsToShareScreen:!current
    },
    allowScreenShare:!current
  });

  toast(!current ? "Screen sharing enabled" : "Screen sharing disabled");
}

function renderWaitingRoom(){
  const box =
    document.getElementById("waitingRoomList");

  if(!box) return;

  const waiting =
    meetingState.meeting?.waitingRoomUsers || [];

  if(!waiting.length){
    box.innerHTML = "No users waiting.";
    return;
  }

  box.innerHTML =
    waiting.map(user=>{
      const id = getId(user);

      return `
        <div class="participant-card">
          <div class="participant-user">
            <img src="${esc(avatar(user))}" alt="">
            <div>
              <strong>${esc(displayName(user))}</strong>
              <span>Waiting for approval</span>
            </div>
          </div>

          <div class="participant-actions">
            <button onclick="approveWaitingUser('${esc(id)}')">Approve</button>
            <button onclick="rejectWaitingUser('${esc(id)}')">Reject</button>
          </div>
        </div>
      `;
    }).join("");
}

async function approveWaitingUser(userId){
  try{
    await apiJSON(
      `/api/meetings/${encodeURIComponent(meetingState.meetingId)}/waiting-room/${encodeURIComponent(userId)}/approve`,
      "PATCH",
      {}
    );

    toast("User approved");
    await reloadMeetingSoft();
    renderWaitingRoom();

  }catch(error){
    toast(error.message || "Unable to approve user");
  }
}

async function rejectWaitingUser(userId){
  try{
    await apiJSON(
      `/api/meetings/${encodeURIComponent(meetingState.meetingId)}/waiting-room/${encodeURIComponent(userId)}/reject`,
      "PATCH",
      {}
    );

    toast("User rejected");
    await reloadMeetingSoft();
    renderWaitingRoom();

  }catch(error){
    toast(error.message || "Unable to reject user");
  }
}

function renderMeetingAnalytics(){
  const participants =
    meetingState.meeting?.participants || [];

  const analytics =
    meetingState.meeting?.analytics || {};

  document.getElementById("analyticsParticipants").textContent =
    participants.length;

  document.getElementById("analyticsPeak").textContent =
    analytics.peakParticipants || participants.length || 0;

  document.getElementById("analyticsDuration").textContent =
    document.getElementById("meetingTimer")?.textContent || "00:00";

  document.getElementById("analyticsShares").textContent =
    participants.filter(p=>p.screenSharing).length;
}

function toggleMeetingChatPanel(){
  toggleSidePanel();

  const btns =
    document.querySelectorAll(".side-tabs button");

  if(btns[1]){
    btns[1].click();
  }
}

function toggleRecording(){
  toast("Recording system ready");
}

function openBackgroundPanel(){
  const panel = document.getElementById("sidePanel");

  if(panel?.classList.contains("hidden")){
    panel.classList.remove("hidden");
  }

  const buttons =
    document.querySelectorAll(".side-tabs button");

  const backgroundBtn =
    Array.from(buttons).find(btn =>
      btn.textContent.trim().toLowerCase() === "background"
    );

  switchPanel("background",backgroundBtn);
}

async function setBackgroundMode(mode){
  meetingState.backgroundMode = mode;
  localStorage.setItem("aiftMeetingBackground",mode);

  document
    .querySelectorAll(".bg-option")
    .forEach(btn=>btn.classList.remove("active"));

  const active =
    Array.from(document.querySelectorAll(".bg-option"))
      .find(btn => btn.getAttribute("onclick")?.includes(`'${mode}'`));

  active?.classList.add("active");

  if(mode === "none"){
    stopVirtualBackground();
    toast("Background removed");
    return;
  }

  await startVirtualBackground(mode);
  toast("Background updated");
}

async function startVirtualBackground(mode){
  if(!meetingState.rawLocalStream){
    toast("Camera is not ready yet");
    return;
  }

  if(!window.SelfieSegmentation){
    toast("Background engine is still loading. Try again.");
    return;
  }

  stopVirtualBackground(false);

  meetingState.backgroundCanvas =
    document.createElement("canvas");

  meetingState.backgroundCanvas.width = 1280;
  meetingState.backgroundCanvas.height = 720;

  meetingState.backgroundVideo =
    document.createElement("video");

  meetingState.backgroundVideo.muted = true;
  meetingState.backgroundVideo.playsInline = true;
  meetingState.backgroundVideo.srcObject = meetingState.rawLocalStream;

  await meetingState.backgroundVideo.play();

  if(mode.startsWith("aift")){
    meetingState.backgroundImage = new Image();
    meetingState.backgroundImage.crossOrigin = "anonymous";
    meetingState.backgroundImage.src = getBackgroundImageUrl(mode);

    await new Promise(resolve=>{
      meetingState.backgroundImage.onload = resolve;
      meetingState.backgroundImage.onerror = resolve;
    });
  }

  meetingState.backgroundProcessor =
    new SelfieSegmentation({
      locateFile:file =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    });

  meetingState.backgroundProcessor.setOptions({
    modelSelection:1,
    selfieMode:true
  });

  meetingState.backgroundProcessor.onResults(drawVirtualBackgroundFrame);

  const processedStream =
    meetingState.backgroundCanvas.captureStream(30);

  const processedVideoTrack =
    processedStream.getVideoTracks()[0];

  const audioTracks =
    meetingState.rawLocalStream.getAudioTracks();

  meetingState.processedStream =
    new MediaStream([
      processedVideoTrack,
      ...audioTracks
    ]);

  meetingState.localStream =
    meetingState.processedStream;

  document.getElementById("localVideo").srcObject =
    meetingState.localStream;

  replaceOutgoingVideoTrack(processedVideoTrack);

  runBackgroundProcessor();
}

function drawVirtualBackgroundFrame(results){
  const canvas = meetingState.backgroundCanvas;
  const video = meetingState.backgroundVideo;

  if(!canvas || !video) return;

  const ctx = canvas.getContext("2d");

  ctx.save();
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.drawImage(
    results.segmentationMask,
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.globalCompositeOperation = "source-in";

  ctx.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.globalCompositeOperation = "destination-over";

  if(
    meetingState.backgroundMode === "blur" ||
    meetingState.backgroundMode === "strongBlur"
  ){
    ctx.filter =
      meetingState.backgroundMode === "strongBlur"
        ? "blur(24px)"
        : "blur(14px)";

    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.filter = "none";
  }else if(meetingState.backgroundImage){
    ctx.drawImage(
      meetingState.backgroundImage,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }else{
    ctx.fillStyle = "#111827";
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  ctx.restore();
}

async function runBackgroundProcessor(){
  if(
    !meetingState.backgroundProcessor ||
    !meetingState.backgroundVideo ||
    meetingState.backgroundMode === "none"
  ){
    return;
  }

  if(!meetingState.backgroundProcessing){
    meetingState.backgroundProcessing = true;

    try{
      await meetingState.backgroundProcessor.send({
        image:meetingState.backgroundVideo
      });
    }catch(error){
      console.warn("Background frame skipped:",error.message);
    }

    meetingState.backgroundProcessing = false;
  }

  meetingState.backgroundAnimation =
    requestAnimationFrame(runBackgroundProcessor);
}

function stopVirtualBackground(restoreCamera = true){
  if(meetingState.backgroundAnimation){
    cancelAnimationFrame(meetingState.backgroundAnimation);
    meetingState.backgroundAnimation = null;
  }

  meetingState.backgroundProcessor = null;
  meetingState.backgroundProcessing = false;
  meetingState.backgroundImage = null;

  meetingState.processedStream
    ?.getVideoTracks()
    ?.forEach(track=>track.stop());

  meetingState.processedStream = null;

  if(restoreCamera && meetingState.rawLocalStream){
    meetingState.localStream = meetingState.rawLocalStream;

    document.getElementById("localVideo").srcObject =
      meetingState.localStream;

    const cameraTrack =
      meetingState.rawLocalStream.getVideoTracks()[0];

    replaceOutgoingVideoTrack(cameraTrack);
  }
}

function replaceOutgoingVideoTrack(track){
  if(!track) return;

  Object.values(meetingState.peerConnections || {}).forEach(async pc=>{
    const sender =
      pc.getSenders().find(item => item.track?.kind === "video");

    if(sender){
      try{
        await sender.replaceTrack(track);
      }catch(error){
        console.warn("Replace video track failed:",error.message);
      }
    }
  });
}

function getBackgroundImageUrl(mode){
  const map = {
    aiftOffice:"images/aift-bg-office.svg",
    aiftClassroom:"images/aift-bg-classroom.svg",
    aiftStudio:"images/aift-bg-studio.svg",
    aiftCity:"images/aift-bg-city.svg",
    aiftConference:"images/aift-bg-conference.svg"
  };

  return map[mode] || "";
}

function toggleCaptions(){
  toast("Live captions ready");
}

let inviteSearchTimer = null;

function openInvitePanel(){
  document.getElementById("inviteModal")?.classList.remove("hidden");

  renderInvitePreview();

  setTimeout(()=>{
    document.getElementById("inviteSearchInput")?.focus();
  },80);
}

function closeInvitePanel(){
  document.getElementById("inviteModal")?.classList.add("hidden");
}

async function searchInviteUsers(query){
  const q = String(query || "").trim();

  const box =
    document.getElementById("inviteResults");

  if(!box) return;

  if(q.length < 2){
    box.innerHTML = "Type at least 2 letters.";
    return;
  }

  box.innerHTML = "Searching...";

  try{
    const data =
      await api(
        `/api/users/network?search=${encodeURIComponent(q)}&limit=12`,
        { headers:authHeaders() }
      );

    const users =
      Array.isArray(data)
        ? data
        : data.users || data.results || [];

    if(!users.length){
      box.innerHTML = "No users found.";
      return;
    }

    box.innerHTML =
      users
        .filter(user=>getId(user) !== meetingState.myId)
        .map(user=>`
          <div class="invite-user">
            <div class="invite-user-main">
              <img src="${esc(avatar(user))}" alt="">
              <div>
                <strong>${esc(displayName(user))}</strong>
                <span>${esc(user.role || user.headline || "AIFT user")}</span>
              </div>
            </div>

            <button onclick="inviteUserToMeeting('${esc(getId(user))}', this)">
              Invite
            </button>
          </div>
        `)
        .join("");

  }catch(error){
    box.innerHTML =
      error.message || "Unable to search users.";
  }
}

async function inviteUserToMeeting(userId,btn){
  if(!userId) return;

  try{
    btn.disabled = true;
    btn.textContent = "Inviting...";

await apiJSON(
  `/api/meetings/${encodeURIComponent(meetingState.meetingId)}/invite`,
  "POST",
  {
    users:[userId],
    inviteLink:getMeetingInviteLink()
  }
);

    btn.textContent = "Invited";
    toast("Invitation sent");

  }catch(error){
    btn.disabled = false;
    btn.textContent = "Invite";
    toast(error.message || "Unable to invite user");
  }
}


function hidePresenterToolbar(){
  document
    .getElementById("presenterToolbar")
    ?.classList
    .add("hidden");
}

function focusScreenPreview(){
  document
    .querySelector(".stage")
    ?.classList
    .add("screen-sharing-mode");

  document
    .getElementById("screenShareStage")
    ?.scrollIntoView({
      behavior:"smooth",
      block:"center"
    });
}

document.addEventListener("DOMContentLoaded",()=>{
  setTimeout(()=>{
    const input =
      document.getElementById("inviteSearchInput");

    if(!input) return;

    input.addEventListener("input",event=>{
      clearTimeout(inviteSearchTimer);

      inviteSearchTimer =
        setTimeout(()=>{
          searchInviteUsers(event.target.value);
        },280);
    });
  },300);
});
