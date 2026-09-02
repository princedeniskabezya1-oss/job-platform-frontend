/* AIFT Messages voice-note recorder. Loaded by messages.html. */
(() => {
  const voice = {
    recorder: null,
    stream: null,
    chunks: [],
    startedAt: 0,
    timer: null,
    blobUrl: "",
    file: null,
    recording: false
  };

  function supportedMimeType(){
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    return candidates.find(type => window.MediaRecorder?.isTypeSupported?.(type)) || "";
  }

  function formatDuration(ms){
    const total = Math.max(0, Math.floor(ms / 1000));
    return `${String(Math.floor(total / 60)).padStart(2,"0")}:${String(total % 60).padStart(2,"0")}`;
  }

  function cleanupStream(){
    voice.stream?.getTracks().forEach(track => track.stop());
    voice.stream = null;
  }

  function clearTimer(){
    if(voice.timer) clearInterval(voice.timer);
    voice.timer = null;
  }

  function revokePreview(){
    if(voice.blobUrl){ URL.revokeObjectURL(voice.blobUrl); voice.blobUrl = ""; }
  }

  function previewBox(){ return document.getElementById("attachmentPreview"); }

  function renderRecording(){
    const box = previewBox();
    if(!box) return;
    box.innerHTML = `<div class="preview-card voice-recording-card"><div class="preview-file-icon">●</div><div class="preview-info"><strong>Recording voice message</strong><span id="voiceRecordingTime">00:00</span></div><button type="button" onclick="cancelVoiceRecording()">Cancel</button><button type="button" onclick="finishVoiceRecording()">Stop</button></div>`;
    box.classList.remove("hidden");
  }

  function renderReady(){
    const box = previewBox();
    if(!box || !voice.file) return;
    revokePreview();
    voice.blobUrl = URL.createObjectURL(voice.file);
    box.innerHTML = `<div class="preview-card voice-recording-card"><div class="preview-file-icon">▶</div><div class="preview-info"><strong>Voice message</strong><span>${esc(fileSize(voice.file.size))}</span><audio src="${esc(voice.blobUrl)}" controls style="width:min(360px,100%);height:34px;margin-top:6px;"></audio></div><button type="button" onclick="cancelVoiceRecording()">Delete</button><button type="button" onclick="sendVoiceRecording()">Send</button></div>`;
    box.classList.remove("hidden");
  }

  window.startVoiceRecording = async function(){
    if(voice.recording) return finishVoiceRecording();
    if(!state?.activeConversation){ toast("Select a conversation first"); return; }
    if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){
      toast("Voice recording is not supported in this browser");
      chooseAttachment("audio");
      return;
    }
    try{
      clearAttachment();
      closeChatPicker?.();
      document.getElementById("attachmentMenu")?.classList.add("hidden");
      voice.stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      voice.chunks = [];
      const mimeType = supportedMimeType();
      voice.recorder = mimeType ? new MediaRecorder(voice.stream,{mimeType}) : new MediaRecorder(voice.stream);
      voice.recorder.ondataavailable = event => { if(event.data?.size) voice.chunks.push(event.data); };
      voice.recorder.onstop = () => {
        clearTimer(); cleanupStream(); voice.recording = false;
        if(!voice.chunks.length){ toast("No audio was recorded"); cancelVoiceRecording(); return; }
        const type = voice.recorder?.mimeType || mimeType || "audio/webm";
        const blob = new Blob(voice.chunks,{type});
        const extension = type.includes("mp4") ? "m4a" : "webm";
        voice.file = new File([blob],`aift-voice-${Date.now()}.${extension}`,{type});
        renderReady();
      };
      voice.recorder.start(250);
      voice.startedAt = Date.now();
      voice.recording = true;
      renderRecording();
      voice.timer = setInterval(() => {
        const el = document.getElementById("voiceRecordingTime");
        if(el) el.textContent = formatDuration(Date.now() - voice.startedAt);
        if(Date.now() - voice.startedAt >= 10 * 60 * 1000) finishVoiceRecording();
      },250);
    }catch(error){
      cleanupStream(); clearTimer(); voice.recording = false;
      if(error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") toast("Microphone permission is required to record a voice message");
      else toast(error?.message || "Unable to start voice recording");
    }
  };

  window.finishVoiceRecording = function(){
    if(!voice.recorder || !voice.recording) return;
    try{ voice.recorder.stop(); }catch{ cancelVoiceRecording(); }
  };

  window.cancelVoiceRecording = function(){
    try{ if(voice.recorder?.state && voice.recorder.state !== "inactive") voice.recorder.stop(); }catch{}
    clearTimer(); cleanupStream(); revokePreview();
    voice.recorder = null; voice.chunks = []; voice.file = null; voice.recording = false;
    state.attachment = null;
    const box = previewBox(); if(box){ box.innerHTML = ""; box.classList.add("hidden"); }
  };

  window.sendVoiceRecording = async function(){
    if(!voice.file) return;
    state.attachment = voice.file;
    voice.file = null;
    revokePreview();
    const box = previewBox(); if(box){ box.innerHTML = ""; box.classList.add("hidden"); }
    await sendMessage();
  };

  document.addEventListener("DOMContentLoaded", () => {
    const mic = document.querySelector(".mic-btn");
    if(!mic) return;
    mic.setAttribute("aria-label","Record voice message");
    mic.setAttribute("title","Record voice message");
    mic.onclick = event => { event.preventDefault(); event.stopPropagation(); startVoiceRecording(); };
  });

  window.addEventListener("beforeunload", cleanupStream);
})();
