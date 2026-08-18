(function () {
  "use strict";

  if (window.__AIFT_NATIVE_BRIDGE_LOADED__) return;
  window.__AIFT_NATIVE_BRIDGE_LOADED__ = true;

  const Capacitor = window.Capacitor || null;
  const Plugins = Capacitor && Capacitor.Plugins ? Capacitor.Plugins : {};
  const App = Plugins.App || null;
  const Keyboard = Plugins.Keyboard || null;
  const Network = Plugins.Network || null;
  const Share = Plugins.Share || null;
  const StatusBar = Plugins.StatusBar || null;

  function isNative() {
    return !!(Capacitor && typeof Capacitor.isNativePlatform === "function" && Capacitor.isNativePlatform());
  }

  if (!isNative()) return;

  document.documentElement.classList.add("aift-native-app");

  function normalizePageName() {
    const path = String(window.location.pathname || "").split("?")[0].split("#")[0];
    const page = path.substring(path.lastIndexOf("/") + 1).toLowerCase();
    return page || "index.html";
  }

  function isRootPage() {
    return new Set(["index.html", "home.html", "login.html"]).has(normalizePageName());
  }

  function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && !element.classList.contains("hidden");
  }

  function closeVisibleUiLayer() {
    const selectors = [
      "#incomingCallModal", "#callModal", "#mediaViewer", "#cameraModal", "#confirmModal",
      "#chatInfoDrawer", "#chatPicker", "#attachmentMenu", "#newChatPanel",
      '[role="dialog"][aria-hidden="false"]',
      ".modal.show", ".modal.active", ".modal.open",
      ".overlay.active", ".drawer.open", ".drawer.active",
      ".sheet.open", ".sheet.active", ".menu.open", ".menu.active"
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!isVisible(element)) continue;

      const closeButton = element.querySelector(
        '[data-close], .close, .close-btn, .modal-close, .drawer-close, .media-viewer-close, button[aria-label="Close"]'
      );

      if (closeButton && typeof closeButton.click === "function") {
        closeButton.click();
        return true;
      }

      if (element.id === "chatPicker" && typeof window.closeChatPicker === "function") {
        window.closeChatPicker();
        return true;
      }
      if (element.id === "attachmentMenu") {
        element.classList.add("hidden");
        return true;
      }
      if (element.id === "newChatPanel" && typeof window.closeNewChatMode === "function") {
        window.closeNewChatMode();
        return true;
      }
    }
    return false;
  }

  async function minimizeApp() {
    try {
      if (App && typeof App.minimizeApp === "function") await App.minimizeApp();
    } catch (error) {
      console.warn("[AIFT Native] Unable to minimize app:", error);
    }
  }

  async function handleBackButton(event) {
    if (closeVisibleUiLayer()) return;
    if (isRootPage()) return minimizeApp();
    if ((event && event.canGoBack) || window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.replace("home.html");
  }

  async function configureStatusBar() {
    if (!StatusBar) return;
    try {
      if (typeof StatusBar.setOverlaysWebView === "function") await StatusBar.setOverlaysWebView({ overlay: false });
      if (typeof StatusBar.setBackgroundColor === "function") await StatusBar.setBackgroundColor({ color: "#FFFFFF" });
      if (typeof StatusBar.setStyle === "function") await StatusBar.setStyle({ style: "LIGHT" });
    } catch (error) {
      console.warn("[AIFT Native] Status bar configuration failed:", error);
    }
  }

  function installSafeAreaStyles() {
    if (document.getElementById("aift-native-safe-area")) return;
    const style = document.createElement("style");
    style.id = "aift-native-safe-area";
    style.textContent = `
      html.aift-native-app { background:#fff; }
      html.aift-native-app body {
        min-height:100dvh;
        padding-bottom:env(safe-area-inset-bottom, 0px);
      }
      html.aift-native-app .aift-native-safe-top { padding-top:env(safe-area-inset-top, 0px)!important; }
      html.aift-native-app .aift-native-safe-bottom { padding-bottom:env(safe-area-inset-bottom, 0px)!important; }
      html.aift-native-app input,
      html.aift-native-app textarea,
      html.aift-native-app select { font-size:max(16px, 1em); }
    `;
    document.head.appendChild(style);
  }

  async function configureKeyboard() {
    if (!Keyboard) return;
    try {
      if (typeof Keyboard.setResizeMode === "function") await Keyboard.setResizeMode({ mode: "native" });
      if (typeof Keyboard.setScroll === "function") await Keyboard.setScroll({ isDisabled: false });
    } catch (error) {
      console.warn("[AIFT Native] Keyboard configuration failed:", error);
    }
  }

  function installKeyboardEvents() {
    if (!Keyboard || typeof Keyboard.addListener !== "function") return;
    Keyboard.addListener("keyboardWillShow", function (info) {
      document.documentElement.classList.add("aift-keyboard-open");
      document.documentElement.style.setProperty("--aift-keyboard-height", `${Number(info?.keyboardHeight || 0)}px`);
      window.dispatchEvent(new CustomEvent("aift:native-keyboard", { detail: { visible: true, ...info } }));
    });
    Keyboard.addListener("keyboardWillHide", function () {
      document.documentElement.classList.remove("aift-keyboard-open");
      document.documentElement.style.setProperty("--aift-keyboard-height", "0px");
      window.dispatchEvent(new CustomEvent("aift:native-keyboard", { detail: { visible: false, keyboardHeight: 0 } }));
    });
  }

  async function initializeNetwork() {
    if (!Network) return;
    try {
      const status = typeof Network.getStatus === "function" ? await Network.getStatus() : null;
      if (status) {
        document.documentElement.dataset.aiftConnection = status.connected ? "online" : "offline";
        window.dispatchEvent(new CustomEvent("aift:native-network", { detail: status }));
      }
      if (typeof Network.addListener === "function") {
        Network.addListener("networkStatusChange", function (nextStatus) {
          document.documentElement.dataset.aiftConnection = nextStatus.connected ? "online" : "offline";
          window.dispatchEvent(new CustomEvent("aift:native-network", { detail: nextStatus }));
        });
      }
    } catch (error) {
      console.warn("[AIFT Native] Network initialization failed:", error);
    }
  }

  function initializeLifecycle() {
    if (!App || typeof App.addListener !== "function") return;
    App.addListener("appStateChange", function (state) {
      window.dispatchEvent(new CustomEvent("aift:native-app-state", { detail: state }));
    });
    App.addListener("appUrlOpen", function (event) {
      window.dispatchEvent(new CustomEvent("aift:native-deep-link", { detail: event || {} }));
    });
  }

  function initializeBackButton() {
    if (!App || typeof App.addListener !== "function") return;
    App.addListener("backButton", function (event) {
      handleBackButton(event || {}).catch(function (error) {
        console.error("[AIFT Native] Back button handler failed:", error);
      });
    });
  }

  function enhanceFileInputs() {
    document.querySelectorAll('input[type="file"]').forEach(function (input) {
      input.setAttribute("data-aift-native-file", "true");
      if (!input.hasAttribute("multiple") && input.dataset.aiftMultiple === "true") input.multiple = true;
    });
  }

  function initializeFileInputObserver() {
    enhanceFileInputs();
    const observer = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes || []) {
          if (!(node instanceof Element)) continue;
          if (node.matches?.('input[type="file"]')) enhanceFileInputs();
          if (node.querySelector?.('input[type="file"]')) enhanceFileInputs();
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function mediaDevicesAvailable() {
    return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function");
  }

  async function requestMedia(options) {
    if (!mediaDevicesAvailable()) throw new Error("Camera or microphone is unavailable on this device.");
    return navigator.mediaDevices.getUserMedia(options || { audio: true, video: false });
  }

  function safeFileName(value, fallback) {
    const name = String(value || fallback || `aift-${Date.now()}`).trim();
    return name.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 160);
  }

  async function download(url, fileName) {
    if (!url) throw new Error("A download URL is required.");
    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) throw new Error(`Download failed (${response.status}).`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = safeFileName(fileName, `aift-download-${Date.now()}`);
      anchor.rel = "noopener";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      window.setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 1500);
    }
  }

  window.AIFTNative = Object.freeze({
    isNative: true,
    platform: "android",
    async share(options) {
      if (!Share || typeof Share.share !== "function") {
        if (navigator.share) return navigator.share(options || {});
        throw new Error("Native sharing is unavailable on this device.");
      }
      return Share.share(options || {});
    },
    async networkStatus() {
      if (Network && typeof Network.getStatus === "function") return Network.getStatus();
      return { connected: navigator.onLine, connectionType: "unknown" };
    },
    requestMedia,
    download,
    minimize: minimizeApp
  });

  async function initializeNativeBridge() {
    installSafeAreaStyles();
    initializeBackButton();
    initializeLifecycle();
    installKeyboardEvents();
    initializeFileInputObserver();
    await Promise.allSettled([
      configureStatusBar(),
      configureKeyboard(),
      initializeNetwork()
    ]);
    window.dispatchEvent(new CustomEvent("aift:native-ready", { detail: { platform: "android" } }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeNativeBridge, { once: true });
  } else {
    initializeNativeBridge();
  }
})();
