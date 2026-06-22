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
    return t ? { Authorization: "Bearer " + t } : {};
  }

  function setMobileAvatar(url){
    document.documentElement.style.setProperty(
      "--mobile-avatar",
      `url("${url || FALLBACK_AVATAR}")`
    );
  }

  async function loadSharedAvatar(){
    if(!token()){
      setMobileAvatar(FALLBACK_AVATAR);
      return;
    }

    try{
      const res = await fetch(API + "/api/users/me", {
        headers: headers()
      });

      const data = await res.json();
      const user = data.user || data;

      const avatar =
        user.profileImage ||
        user.avatar ||
        user.photoURL ||
        user.profilePicture ||
        FALLBACK_AVATAR;

      setMobileAvatar(avatar);

      const topAvatar = document.getElementById("topAvatar");
      if(topAvatar) topAvatar.src = avatar;

      if(user?._id){
        localStorage.setItem("userId", user._id);
      }

      if(user?.role){
        localStorage.setItem("role", user.role);
      }

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
        const res = await fetch(API + "/api/notifications/unread", {
          headers: headers()
        });

        const data = await res.json();

        count =
          data.count ||
          data.unreadCount ||
          data.total ||
          (Array.isArray(data) ? data.length : 0);

      }catch{
        const res = await fetch(API + "/api/notifications", {
          headers: headers()
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

  function setupScrollTopbar(){
    const topbar = document.querySelector(".topbar");
    if(!topbar) return;

    let lastY = window.scrollY || 0;

    window.addEventListener("scroll", () => {
      const y = window.scrollY || 0;

      topbar.classList.toggle("is-glass", y > 12);

      if(y > 260 && y > lastY){
        topbar.classList.add("is-hidden");
      }else{
        topbar.classList.remove("is-hidden");
      }

      lastY = y;
    }, { passive:true });
  }

  window.goHome = function(){
    location.href = "home.html";
  };

  window.goNetwork = function(){
    location.href = "network.html";
  };

  window.goJobs = function(){
    location.href = "jobs.html";
  };

  window.goMessages = function(){
    if(typeof requireLogin === "function" && !requireLogin("message people")) return;
    location.href = "messages.html";
  };

  window.goNotifications = function(){
    if(typeof requireLogin === "function" && !requireLogin("view alerts")) return;
    location.href = "notifications.html";
  };

  window.openSharedPost = function(){
    location.href = "home.html?compose=1";
  };

  document.addEventListener("DOMContentLoaded", () => {
    loadSharedAvatar();
    loadNotificationBadge();
    setupScrollTopbar();
  });
})();
