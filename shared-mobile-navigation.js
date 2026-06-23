/* shared-mobile-navigation.js */

(function(){
  let lastScroll = 0;
  let scrollTicking = false;

  function handleSharedMobileScroll(){
    if(window.innerWidth > 760) return;

    const topbar = document.querySelector(".topbar");
    const nav = document.querySelector(".mobile-nav");
    if(!topbar || !nav) return;

    const current = window.scrollY;
    const scrollingDown = current > lastScroll;
    const scrollingUp = current < lastScroll;

    topbar.classList.toggle("is-glass", current > 20);

    if(scrollingDown && current > 900){
      topbar.classList.add("is-hidden");
      nav.classList.add("is-pulled-down");
    }

    if(scrollingUp || current < 120){
      topbar.classList.remove("is-hidden");
      nav.classList.remove("is-pulled-down");
    }

    lastScroll = current <= 0 ? 0 : current;
  }

  window.addEventListener("scroll", () => {
    if(scrollTicking) return;

    scrollTicking = true;

    requestAnimationFrame(() => {
      handleSharedMobileScroll();
      scrollTicking = false;
    });
  });

  document.addEventListener("DOMContentLoaded", () => {
    handleSharedMobileScroll();
  });
})();
