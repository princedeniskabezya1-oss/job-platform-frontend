/* shared-post-composer.js — canonical direct-media uploader build 20260920-r2-canonical-4 */

(function(){
  let startPostFiles = [];
  const LARGE_VIDEO_PREVIEW_BYTES = 25 * 1024 * 1024;

  function formatSelectedFileSize(bytes){
    const value = Math.max(0, Number(bytes) || 0);
    if(value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if(value >= 1024 * 1024) return `${Math.round(value / (1024 * 1024))} MB`;
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  window.loadStartPostVideoPreview = function(button){
    const index = Number(button?.dataset?.index);
    const file = startPostFiles[index];
    if(!file || !button?.parentElement) return;

    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.addEventListener("emptied", () => URL.revokeObjectURL(url), { once:true });
    button.parentElement.replaceChildren(video);
  };

  function getAPI(){
    return window.API || "https://backend-1-9b6f.onrender.com";
  }

  function getToken(){
    if(typeof window.token === "function") return window.token();
    if(typeof window.getToken === "function") return window.getToken();

    const role = localStorage.getItem("role") || "";

    return (
      localStorage.getItem(role + "Token") ||
      localStorage.getItem("schoolToken") ||
      localStorage.getItem("teacherToken") ||
      localStorage.getItem("studentToken") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("employerToken") ||
      localStorage.getItem("talentToken") ||
      localStorage.getItem("agentToken") ||
      localStorage.getItem("token") ||
      ""
    );
  }

  function isGuestUser(){
    if(typeof window.isGuest === "function") return window.isGuest();
    return !getToken();
  }

  function escapeText(v = ""){
    return String(v)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;");
  }

  function toast(message){
    if(typeof window.showToast === "function"){
      window.showToast(message);
      return;
    }

    alert(message);
  }

  function requirePostLogin(){
    if(!isGuestUser()) return true;

    if(typeof window.requireLogin === "function"){
      window.requireLogin("create posts");
      return false;
    }

    if(typeof window.showGuestModal === "function"){
      window.showGuestModal("create posts");
      return false;
    }

    location.href = "login.html";
    return false;
  }

  function currentUser(){
    return window.state?.me || {};
  }

  window.openMobileComposer = function(event){
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if(!requirePostLogin()) return;

    openStartPostModal();
  };

  window.openStartPostModal = function(){
    let modal = document.getElementById("startPostModal");
    const me = currentUser();

    if(!modal){
      modal = document.createElement("div");
      modal.id = "startPostModal";
      modal.className = "start-post-backdrop";

      modal.innerHTML = `
        <div class="start-post-modal">
          <header class="start-post-head">
            <strong>Create post</strong>
            <button type="button" onclick="closeStartPostModal()">×</button>
          </header>

          <div class="start-post-profile">
            <img id="startPostAvatar" src="${escapeText(me.profileImage || window.FALLBACK_AVATAR || "https://cdn-icons-png.flaticon.com/512/149/149071.png")}" alt="">
            <div>
              <strong id="startPostName">${escapeText(me.companyName || me.schoolName || me.name || "AIFT User")}</strong>
              <span>Post to your feed</span>
            </div>
          </div>

          <textarea id="startPostText" placeholder="What do you want to share?"></textarea>

          <div id="startPostPreview" class="start-post-preview"></div>

          <div class="start-upload-progress">
            <div class="start-upload-track">
              <div id="startUploadBar" class="start-upload-bar"></div>
            </div>
            <span id="startUploadText">0%</span>
          </div>

          <footer class="start-post-actions">
            <label class="start-media-btn">
              Photo / Video
              <input
                id="startPostMedia"
                type="file"
                accept="image/*,video/*"
                multiple
                onchange="previewStartPostMedia()"
              >
            </label>

            <button type="button" id="startPostSubmit" onclick="submitStartPost()">Post</button>
          </footer>
        </div>
      `;

      document.body.appendChild(modal);
    }

    const avatar = document.getElementById("startPostAvatar");
    const name = document.getElementById("startPostName");

    if(avatar){
      avatar.src = me.profileImage || window.FALLBACK_AVATAR || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    }

    if(name){
      name.textContent = me.companyName || me.schoolName || me.name || "AIFT User";
    }

    modal.classList.add("show");
    document.body.classList.add("start-post-open");

    setTimeout(() => {
      document.getElementById("startPostText")?.focus();
    }, 150);
  };

  window.closeStartPostModal = function(){
    resetStartPostModal();
    document.getElementById("startPostModal")?.classList.remove("show");
    document.body.classList.remove("start-post-open");
  };

  window.previewStartPostMedia = function(){
    const input = document.getElementById("startPostMedia");
    const preview = document.getElementById("startPostPreview");

    startPostFiles = Array.from(input?.files || []).filter(file => {
      const ok =
        file.type.startsWith("image/") ||
        file.type.startsWith("video/");

      if(!ok) toast("Only images and videos are allowed.");
      return ok;
    });

    if(!preview) return;

    preview.innerHTML = startPostFiles.map((file, index) => {
      const isVideo = file.type.startsWith("video/");

      if(isVideo && file.size > LARGE_VIDEO_PREVIEW_BYTES){
        return `
          <div class="start-preview-item">
            <button type="button" onclick="removeStartPostMedia(${index})">×</button>
            <div class="start-video-placeholder">
              <span aria-hidden="true">▶</span>
              <strong>${formatSelectedFileSize(file.size)} video selected</strong>
              <small>Ready to upload</small>
              <button type="button" class="start-video-preview-button" data-index="${index}" onclick="loadStartPostVideoPreview(this)">Preview</button>
            </div>
          </div>
        `;
      }

      const url = URL.createObjectURL(file);

      return `
        <div class="start-preview-item">
          <button type="button" onclick="removeStartPostMedia(${index})">×</button>
          ${
            isVideo
              ? `<video src="${url}" controls playsinline></video>`
              : `<img src="${url}" alt="">`
          }
        </div>
      `;
    }).join("");
  };

  window.resetStartPostModal = function(){
    const textEl = document.getElementById("startPostText");
    const mediaEl = document.getElementById("startPostMedia");
    const preview = document.getElementById("startPostPreview");
    const progress = document.querySelector(".start-upload-progress");
    const uploadBar = document.getElementById("startUploadBar");
    const uploadText = document.getElementById("startUploadText");

    if(textEl) textEl.value = "";
    if(mediaEl) mediaEl.value = "";
    if(preview) preview.innerHTML = "";

    startPostFiles = [];

    if(progress) progress.style.display = "none";
    if(uploadBar) uploadBar.style.width = "0%";
    if(uploadText) uploadText.textContent = "0%";
  };

  window.removeStartPostMedia = function(index){
    const input = document.getElementById("startPostMedia");
    const dt = new DataTransfer();

    startPostFiles.forEach((file, i) => {
      if(i !== index) dt.items.add(file);
    });

    if(input){
      input.files = dt.files;
    }

    previewStartPostMedia();
  };

  async function postAPI(path, options = {}){
    const response = await fetch(getAPI() + path, {
      ...options,
      headers: {
        Authorization: "Bearer " + getToken(),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers
      }
    });
    const data = await response.json().catch(() => ({}));
    if(!response.ok) throw new Error(data.message || "The upload service could not complete the request.");
    return data;
  }

  function sendMedia(url, file, onProgress, fields, headers = {}){
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open(fields ? "POST" : "PUT", url);
      Object.entries(headers).forEach(([key, value]) => request.setRequestHeader(key, value));
      request.upload.onprogress = event => {
        if(event.lengthComputable) onProgress(event.loaded / event.total);
      };
      request.onerror = () => reject(new Error("The upload connection failed. Please try again."));
      request.onload = () => {
        let result = {};
        try{ result = JSON.parse(request.responseText); }catch{}
        if(request.status < 200 || request.status >= 300){
          reject(new Error(result.error?.message || result.message || "Media upload failed. Please try again."));
          return;
        }
        resolve(result);
      };
      if(fields){
        const body = new FormData();
        Object.entries(fields).forEach(([key, value]) => body.append(key, value));
        body.append("file", file);
        request.send(body);
      }else{
        request.send(file);
      }
    });
  }

  async function uploadComposerMedia(files, onProgress){
    let completed = 0;
    const total = files.reduce((sum, file) => sum + file.size, 0) || 1;
    const uploaded = [];

    for(const file of files){
      const progress = fraction => onProgress(Math.round(100 * (completed + file.size * fraction) / total));
      if(file.type.startsWith("image/")){
        const signed = await postAPI("/api/posts/media-upload-signature?type=image");
        const result = await sendMedia(
          `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`,
          file,
          progress,
          { api_key: signed.apiKey, timestamp: signed.timestamp, signature: signed.signature, folder: signed.folder }
        );
        if(!result.secure_url) throw new Error("The image upload returned no URL.");
        uploaded.push({ url: result.secure_url, type: "image" });
      }else if(file.type.startsWith("video/")){
        const signed = await postAPI("/api/posts/media-upload-r2-url", {
          method: "POST",
          body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size })
        });
        await sendMedia(signed.uploadUrl, file, progress, null, { "Content-Type": signed.contentType });
        if(!signed.publicUrl) throw new Error("The video upload returned no URL.");
        uploaded.push({ url: signed.publicUrl, type: "video" });
      }else{
        throw new Error("Only images and videos are allowed.");
      }
      completed += file.size;
      progress(0);
    }
    onProgress(100);
    return uploaded;
  }

  async function publishComposerPost(post){
    return postAPI("/api/posts/direct", { method: "POST", body: JSON.stringify(post) });
  }

  window.submitStartPost = async function(){
    const textEl = document.getElementById("startPostText");
    const mediaEl = document.getElementById("startPostMedia");
    const btn = document.getElementById("startPostSubmit");
    const uploadProgress = document.querySelector(".start-upload-progress");
    const uploadBar = document.getElementById("startUploadBar");
    const uploadText = document.getElementById("startUploadText");

    const text = textEl?.value.trim() || "";
    const files = Array.from(mediaEl?.files || []);

    if(!text && !files.length){
      toast("Please write something or add a photo/video.");
      return;
    }

    if(!getToken()){
      requirePostLogin();
      return;
    }

    if(files.length > 10){
      toast("Choose up to 10 images or videos per post.");
      return;
    }

    try{
      btn.disabled = true;
      btn.textContent = files.length ? "Uploading 0%" : "Publishing...";

      if(uploadProgress){
        uploadProgress.style.display = files.length ? "flex" : "none";
      }

      let uploadedMedia = [];

      if(files.length){
        uploadedMedia = await uploadComposerMedia(files, percent => {
          const visiblePercent = Math.min(99, Math.max(0, Number(percent) || 0));

          if(uploadBar) uploadBar.style.width = visiblePercent + "%";

          if(visiblePercent >= 99){
            if(uploadText) uploadText.textContent = "Finishing upload...";
            btn.textContent = "Finishing upload...";
          }else{
            if(uploadText) uploadText.textContent = visiblePercent + "%";
            btn.textContent = `Uploading ${visiblePercent}%`;
          }
        });
      }

      if(files.length){
        if(uploadBar) uploadBar.style.width = "100%";
        if(uploadText) uploadText.textContent = "Publishing...";
      }

      btn.textContent = "Publishing...";

      await publishComposerPost({
        text,
        media: uploadedMedia
      });

      toast("Post created successfully.");

      resetStartPostModal();
      closeStartPostModal();

      if(document.getElementById("feedMount") && window.AIFTFeed?.mount){
        await window.AIFTFeed.mount("feedMount", {
          mode: "home",
          showComposer: !isGuestUser(),
          infiniteScroll: true,
          realtime: !isGuestUser(),
          guestMode: isGuestUser()
        });
      }

    }catch(err){
      console.error("Post failed:", err);

      if(uploadText && files.length){
        uploadText.textContent = "Upload failed";
      }

      toast(err.message || "Unable to create post.");
    }finally{
      btn.disabled = false;
      btn.textContent = "Post";
    }
  };

})();
