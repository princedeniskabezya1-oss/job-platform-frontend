/* shared-mobile-navigation.js */

(function(){
  const API = "https://backend-1-9b6f.onrender.com";
  const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  function token(){
    return (
      localStorage.getItem("schoolToken") ||
      localStorage.getItem("teacherToken") ||
      localStorage.getItem("studentToken") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("employerToken") ||
      localStorage.getItem("talentToken") ||
      localStorage.getItem("agentToken") ||
      localStorage.getItem("token")
    );
  }

  function headers(){
    const t = token();
    return t ? { Authorization:"Bearer " + t } : {};
  }

  function setMobileAvatar(url){
    document.documentElement.style.setProperty(
      "--mobile-avatar",
      `url("${url || FALLBACK_AVATAR}")`
    );
  }

  async function loadMobileAvatar(){
    if(!token()){
      setMobileAvatar(FALLBACK_AVATAR);
      return;
    }

    try{
      const res = await fetch(`${API}/api/users/me`, {
        headers:headers()
      });

      const data = await res.json();
      const me = data.user || data;

      const avatar =
        me.profileImage ||
        me.avatar ||
        me.photoURL ||
        me.profilePicture ||
        FALLBACK_AVATAR;

      setMobileAvatar(avatar);

      const topAvatar = document.getElementById("topAvatar");
      if(topAvatar) topAvatar.src = avatar;

      if(me._id) localStorage.setItem("userId", me._id);
      if(me.role) localStorage.setItem("role", me.role);

    }catch{
      setMobileAvatar(FALLBACK_AVATAR);
    }
  }

  async function loadNotificationBadge(){
    const badge = document.getElementById("notificationBadge");
    if(!badge || !token()) return;

    try{
      let count = 0;

      try{
        const res = await fetch(`${API}/api/notifications/unread`, {
          headers:headers()
        });

        const data = await res.json();

        count =
          data.count ||
          data.unreadCount ||
          data.total ||
          (Array.isArray(data) ? data.length : 0);

      }catch{
        const res = await fetch(`${API}/api/notifications`, {
          headers:headers()
        });

        const data = await res.json();
        const list = Array.isArray(data) ? data : data.notifications || [];

        count = list.filter(n => !n.read && !n.isRead).length;
      }

      badge.textContent = count > 99 ? "99+" : String(count);
      badge.classList.toggle("hidden", count <= 0);

    }catch{
      badge.classList.add("hidden");
    }
  }

  function setupHomeExactScrollAnimation(){
    const topbar = document.querySelector(".topbar");
    const nav = document.querySelector(".mobile-nav");

    if(!topbar && !nav) return;

    let lastY = window.scrollY || 0;
    let hiddenAfter = 700;

    window.addEventListener("scroll", () => {
      const y = window.scrollY || 0;
      const goingDown = y > lastY;

      if(topbar){
        topbar.classList.toggle("is-glass", y > 12);

        if(y > hiddenAfter && goingDown){
          topbar.classList.add("is-hidden");
        }else{
          topbar.classList.remove("is-hidden");
        }
      }

      if(nav){
        if(y > 180 && goingDown){
          nav.classList.add("is-pulled-down");
        }else{
          nav.classList.remove("is-pulled-down");
        }
      }

      lastY = y;
    }, { passive:true });
  }

  window.goHome = window.goHome || function(){
    location.href = "home.html";
  };

  window.goMessages = window.goMessages || function(){
    if(typeof requireLogin === "function" && !requireLogin("message people")) return;
    location.href = "messages.html";
  };

  window.goNotifications = window.goNotifications || function(){
    if(typeof requireLogin === "function" && !requireLogin("view alerts")) return;
    location.href = "notifications.html";
  };

  document.addEventListener("DOMContentLoaded", () => {
    loadMobileAvatar();
    loadNotificationBadge();
    setupHomeExactScrollAnimation();
  });
})();
