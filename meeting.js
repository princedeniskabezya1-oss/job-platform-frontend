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

  localStream:null,
  remoteStream:null,
  screenStream:null,
  peerConnection:null,

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
    meetingState.meeting.waitingRoomEnabled
      ? "waiting-room"
      : "open";

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

  renderParticipants();
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

  meetingState.socket.on("meetingParticipantJoined",payload=>{
    toast("Participant joined");
    hideWaitingOverlay();
    reloadMeetingSoft();
  });

  meetingState.socket.on("meetingParticipantLeft",payload=>{
    toast("Participant left");
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

  meetingState.socket.on("webrtcOffer",async payload=>{
    if(!payload.offer || !payload.from) return;

    await ensurePeerConnection(payload.from);

    await meetingState.peerConnection.setRemoteDescription(
      new RTCSessionDescription(payload.offer)
    );

    const answer = await meetingState.peerConnection.createAnswer();
    await meetingState.peerConnection.setLocalDescription(answer);

    meetingState.socket.emit("webrtcAnswer",{
      to:payload.from,
      answer,
      meetingId:meetingState.meetingId
    });
  });

  meetingState.socket.on("webrtcAnswer",async payload=>{
    if(!payload.answer || !meetingState.peerConnection) return;

    await meetingState.peerConnection.setRemoteDescription(
      new RTCSessionDescription(payload.answer)
    );
  });

  meetingState.socket.on("webrtcIceCandidate",async payload=>{
    if(!payload.candidate || !meetingState.peerConnection) return;

    try{
      await meetingState.peerConnection.addIceCandidate(
        new RTCIceCandidate(payload.candidate)
      );
    }catch(error){
      console.warn("ICE failed:",error.message);
    }
  });

  meetingState.socket.on("participantHandRaised",payload=>{
    toast("A participant raised their hand");
    reloadMeetingSoft();
  });

  meetingState.socket.on("screenShareStatus",payload=>{
    toast(payload.sharing ? "Screen sharing started" : "Screen sharing stopped");
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

  document.getElementById("localVideo").srcObject =
    meetingState.localStream;
}

/* WEBRTC */

async function ensurePeerConnection(remoteUserId){
  if(meetingState.peerConnection){
    return meetingState.peerConnection;
  }

  const pc = new RTCPeerConnection(RTC_CONFIG);
  meetingState.peerConnection = pc;

  meetingState.remoteStream = new MediaStream();
  document.getElementById("remoteVideo").srcObject =
    meetingState.remoteStream;

  meetingState.localStream?.getTracks().forEach(track=>{
    pc.addTrack(track,meetingState.localStream);
  });

  pc.ontrack = event=>{
    event.streams[0].getTracks().forEach(track=>{
      meetingState.remoteStream.addTrack(track);
    });

    document.getElementById("remoteStatus").textContent =
      "Connected";

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
    document.getElementById("remoteStatus").textContent =
      pc.connectionState;
  };

  return pc;
}

async function createOfferForParticipants(){
  const others =
    (meetingState.meeting.participants || [])
      .map(p => getId(p.user || p))
      .filter(id => id && id !== meetingState.myId);

  const remoteUserId = others[0];

  if(!remoteUserId) return;

  const pc =
    await ensurePeerConnection(remoteUserId);

  const offer =
    await pc.createOffer({
      offerToReceiveAudio:true,
      offerToReceiveVideo:true
    });

  await pc.setLocalDescription(offer);

  meetingState.socket.emit("webrtcOffer",{
    to:remoteUserId,
    offer,
    meetingId:meetingState.meetingId
  });
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
        video:true,
        audio:false
      });

    meetingState.sharingScreen = true;

    const screenTrack =
      meetingState.screenStream.getVideoTracks()[0];

    const sender =
      meetingState.peerConnection
        ?.getSenders()
        .find(s => s.track?.kind === "video");

    if(sender){
      await sender.replaceTrack(screenTrack);
    }

    document.getElementById("localVideo").srcObject =
      meetingState.screenStream;

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

  const sender =
    meetingState.peerConnection
      ?.getSenders()
      .find(s => s.track?.kind === "video");

  if(sender && cameraTrack){
    await sender.replaceTrack(cameraTrack);
  }

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
  document.querySelectorAll(".side-tabs button").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");

  document.getElementById("participantsPanel").classList.add("hidden");
  document.getElementById("chatPanel").classList.add("hidden");
  document.getElementById("infoPanel").classList.add("hidden");

  document.getElementById(panel + "Panel").classList.remove("hidden");
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

async function copyMeetingLink(){
  const url =
    `${location.origin}/meeting.html?code=${encodeURIComponent(meetingState.meetingCode)}`;

  try{
    await navigator.clipboard.writeText(url);
    toast("Meeting link copied");
  }catch{
    toast(url);
  }
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
  meetingState.remoteStream?.getTracks().forEach(t=>t.stop());
  meetingState.screenStream?.getTracks().forEach(t=>t.stop());
  meetingState.lobbyStream?.getTracks().forEach(t=>t.stop());

  if(meetingState.peerConnection){
    meetingState.peerConnection.close();
  }

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
