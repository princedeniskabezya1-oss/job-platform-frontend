(function () {
  "use strict";

  if (/\/messages\.html$/i.test(location.pathname) || window.__aiftGlobalCalls) return;
  window.__aiftGlobalCalls = true;

  const API = "https://backend-1-9b6f.onrender.com";
  const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  let socket = null;
  let activeCall = null;
  let ringtone = null;

  function token() {
    const role = String(localStorage.getItem("role") || "").toLowerCase();
    return localStorage.getItem(role + "Token") || localStorage.getItem("studentToken") ||
      localStorage.getItem("teacherToken") || localStorage.getItem("schoolToken") ||
      localStorage.getItem("employerToken") || localStorage.getItem("talentToken") ||
      localStorage.getItem("agentToken") || localStorage.getItem("adminToken") ||
      localStorage.getItem("token") || "";
  }

  function userIdFromToken(value) {
    try {
      const body = JSON.parse(atob(value.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return String(body.id || body._id || body.userId || "");
    } catch (_) { return ""; }
  }

  function ensureStyles() {
    if (document.getElementById("aift-global-call-styles")) return;
    const style = document.createElement("style");
    style.id = "aift-global-call-styles";
    style.textContent = ".aift-call-alert{position:fixed;inset:0;z-index:2147483646;background:rgba(8,18,36,.58);display:grid;place-items:center;padding:20px;font-family:Inter,system-ui,-apple-system,sans-serif}.aift-call-alert[hidden]{display:none}.aift-call-card{width:min(360px,100%);background:#fff;border-radius:24px;padding:26px 22px 20px;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.28)}.aift-call-card img{width:78px;height:78px;border-radius:50%;object-fit:cover}.aift-call-card h2{font-size:22px;margin:13px 0 4px;color:#111827}.aift-call-card p{margin:0;color:#667085;font-size:15px}.aift-call-actions{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:24px}.aift-call-actions button{border:0;border-radius:14px;padding:13px;font-size:15px;font-weight:750;cursor:pointer}.aift-call-decline{background:#f1f3f6;color:#d92d20}.aift-call-answer{background:#1477f8;color:#fff}";
    document.head.appendChild(style);
  }

  function stopRing() {
    try { ringtone?.pause(); if (ringtone) ringtone.currentTime = 0; } catch (_) {}
  }

  function closeAlert() {
    stopRing();
    document.getElementById("aiftGlobalCallAlert")?.remove();
    activeCall = null;
  }

  function decline() {
    if (activeCall) socket?.emit("declineCall", { to: activeCall.from, callId: activeCall.callId, reason: "declined" });
    closeAlert();
  }

  function answer() {
    if (!activeCall) return;
    sessionStorage.setItem("aiftPendingIncomingCall", JSON.stringify(activeCall));
    stopRing();
    const query = new URLSearchParams({ conversation: activeCall.conversationId || "", resumeCall: activeCall.callId || "" });
    location.href = "messages.html?" + query.toString();
  }

  function showIncomingCall(payload) {
    if (!payload?.callId || activeCall?.callId === payload.callId) return;
    activeCall = payload;
    ensureStyles();
    document.getElementById("aiftGlobalCallAlert")?.remove();
    const alert = document.createElement("div");
    alert.id = "aiftGlobalCallAlert";
    alert.className = "aift-call-alert";
    const name = payload.isGroupInvite ? (payload.groupName || payload.callerName) : payload.callerName;
    const avatar = payload.isGroupInvite ? (payload.groupAvatar || payload.callerAvatar) : payload.callerAvatar;
    alert.innerHTML = '<section class="aift-call-card" role="dialog" aria-modal="true" aria-label="Incoming call"><img alt=""><h2></h2><p></p><div class="aift-call-actions"><button class="aift-call-decline" type="button">Decline</button><button class="aift-call-answer" type="button">Answer</button></div></section>';
    alert.querySelector("img").src = avatar || FALLBACK_AVATAR;
    alert.querySelector("h2").textContent = name || "AIFT User";
    alert.querySelector("p").textContent = "Incoming " + (payload.callType === "video" ? "video" : "audio") + " call";
    alert.querySelector(".aift-call-decline").onclick = decline;
    alert.querySelector(".aift-call-answer").onclick = answer;
    document.body.appendChild(alert);
    ringtone = ringtone || new Audio("audio/ringtone.mp3");
    ringtone.loop = true;
    ringtone.preload = "auto";
    ringtone.play().catch(() => {});
    if (document.hidden && "Notification" in window && Notification.permission === "granted") {
      try { new Notification("Incoming AIFT call", { body: (name || "Someone") + " is calling", icon: avatar || FALLBACK_AVATAR, tag: "aift-call-" + payload.callId }); } catch (_) {}
    }
  }

  function loadSocketIo(callback) {
    if (typeof window.io === "function") return callback();
    const script = document.createElement("script");
    script.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";
    script.onload = callback;
    document.head.appendChild(script);
  }

  function connect() {
    const authToken = token(), userId = userIdFromToken(authToken);
    if (!authToken || !userId || typeof window.io !== "function") return;
    socket = window.io(API, { auth: { token: authToken }, transports: ["websocket", "polling"] });
    socket.on("connect", () => socket.emit("join", { userId, token: authToken }));
    socket.on("incomingCall", showIncomingCall);
    socket.on("callEnded", closeAlert);
    socket.on("callDeclined", closeAlert);
  }

  const start = () => loadSocketIo(connect);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}());
