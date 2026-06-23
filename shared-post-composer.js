/* shared-post-composer.js */

(function(){
  let startPostFiles = [];

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
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
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
      const url = URL.createObjectURL(file);

      return `
        <div class="start-preview-item">
          <button type="button" onclick="removeStartPostMedia(${index})">×</button>
          ${
            file.type.startsWith("video/")
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

  window.submitStartPost = async function(){
    const textEl = document.getElementById("startPostText");
    const mediaEl = document.getElementById("startPostMedia");
    const btn = document.getElementById("startPostSubmit");
    const uploadProgress = document.querySelector(".start-upload-progress");

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

    const form = new FormData();
    form.append("text", text);

    files.forEach(file => {
      form.append("media", file);
    });

    try{
      btn.disabled = true;
      btn.textContent = "Posting...";

      if(uploadProgress){
        uploadProgress.style.display = "flex";
      }

      const res = await uploadPostWithProgress(form, percent => {
        const bar = document.getElementById("startUploadBar");
        const textEl = document.getElementById("startUploadText");

        if(bar) bar.style.width = percent + "%";
        if(textEl) textEl.textContent = percent + "%";
      });

      const data = await res.json().catch(() => ({}));

      if(!res.ok){
        throw new Error(data.message || data.error || "Post failed");
      }

      toast("Post created successfully.");

      resetStartPostModal();
      closeStartPostModal();

      if(window.AIFTFeed && document.getElementById("feedMount")){
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
      toast(err.message || "Unable to create post.");
    }finally{
      btn.disabled = false;
      btn.textContent = "Post";
    }
  };

  function uploadPostWithProgress(form, onProgress){
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", getAPI() + "/api/posts");
      xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);

      xhr.upload.onprogress = event => {
        if(event.lengthComputable){
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          json: async () => JSON.parse(xhr.responseText || "{}")
        });
      };

      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(form);
    });
  }
})();
