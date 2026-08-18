"use strict";

const fs = require("fs");
const path = require("path");

const MOBILE_ROOT = __dirname;
const PROJECT_ROOT = path.resolve(MOBILE_ROOT, "..");
const OUTPUT_DIR = path.join(MOBILE_ROOT, "www");
const MOBILE_ENTRY_FILE = path.join(MOBILE_ROOT, "launcher", "index.html");
const NATIVE_BRIDGE_SOURCE = path.join(MOBILE_ROOT, "native", "aift-native.js");
const NATIVE_BRIDGE_OUTPUT = path.join(OUTPUT_DIR, "aift-native.js");
const NATIVE_BRIDGE_TAG = '<script src="aift-native.js"></script>';
const ANDROID_MANIFEST = path.join(MOBILE_ROOT, "android", "app", "src", "main", "AndroidManifest.xml");
const ANDROID_STYLES = path.join(MOBILE_ROOT, "android", "app", "src", "main", "res", "values", "styles.xml");
const ANDROID_MAIN_ACTIVITY = path.join(
  MOBILE_ROOT,
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "aift",
  "app",
  "MainActivity.java"
);

const EXCLUDED_ROOT_DIRECTORIES = new Set([".git", ".github", ".idea", ".vscode", "mobile-build", "node_modules"]);
const EXCLUDED_ROOT_FILES = new Set([".DS_Store", ".gitignore", "package.json", "package-lock.json", "capacitor.config.json", "capacitor.config.ts", "README", "README.md"]);
const ALLOWED_EXTENSIONS = new Set([
  ".html", ".htm", ".css", ".js", ".mjs", ".json", ".webmanifest", ".xml",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".ico",
  ".woff", ".woff2", ".ttf", ".otf", ".mp3", ".wav", ".ogg", ".m4a", ".aac",
  ".mp4", ".webm", ".mov", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv"
]);

function removeDirectory(directoryPath) {
  if (fs.existsSync(directoryPath)) fs.rmSync(directoryPath, { recursive: true, force: true });
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function shouldCopyFile(sourcePath) {
  const fileName = path.basename(sourcePath);
  if (EXCLUDED_ROOT_FILES.has(fileName) && path.dirname(sourcePath) === PROJECT_ROOT) return false;
  if (path.resolve(sourcePath) === path.join(PROJECT_ROOT, "index.html")) return false;
  return ALLOWED_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function copyFile(sourcePath, destinationPath) {
  ensureDirectory(path.dirname(destinationPath));
  fs.copyFileSync(sourcePath, destinationPath);
}

function copyDirectory(sourceDirectory, relativeDirectory = "") {
  for (const entry of fs.readdirSync(sourceDirectory, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const relativePath = path.join(relativeDirectory, entry.name);
    const destinationPath = path.join(OUTPUT_DIR, relativePath);

    if (entry.isDirectory()) {
      if (sourceDirectory === PROJECT_ROOT && EXCLUDED_ROOT_DIRECTORIES.has(entry.name)) continue;
      copyDirectory(sourcePath, relativePath);
      continue;
    }

    if (entry.isFile() && shouldCopyFile(sourcePath)) copyFile(sourcePath, destinationPath);
  }
}

function requireSourceFile(relativePath) {
  if (!fs.existsSync(path.join(PROJECT_ROOT, relativePath))) {
    throw new Error(`Required AIFT source file is missing: ${relativePath}`);
  }
}

function validateSource() {
  requireSourceFile("login.html");
  requireSourceFile("home.html");
  if (!fs.existsSync(MOBILE_ENTRY_FILE)) throw new Error("Required Android launcher is missing: mobile-build/launcher/index.html");
  if (!fs.existsSync(NATIVE_BRIDGE_SOURCE)) throw new Error("Required Android native bridge is missing: mobile-build/native/aift-native.js");
}

function walkHtmlFiles(directoryPath, output = []) {
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) walkHtmlFiles(entryPath, output);
    else if (entry.isFile() && /\.html?$/i.test(entry.name)) output.push(entryPath);
  }
  return output;
}

function injectNativeBridgeIntoHtml() {
  for (const htmlFile of walkHtmlFiles(OUTPUT_DIR)) {
    let html = fs.readFileSync(htmlFile, "utf8");
    if (html.includes(NATIVE_BRIDGE_TAG)) continue;
    if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `  ${NATIVE_BRIDGE_TAG}\n</body>`);
    else html += `\n${NATIVE_BRIDGE_TAG}\n`;
    fs.writeFileSync(htmlFile, html, "utf8");
  }
}

function configureAndroidManifest() {
  if (!fs.existsSync(ANDROID_MANIFEST)) return;
  let manifest = fs.readFileSync(ANDROID_MANIFEST, "utf8");
  const permissions = [
    "android.permission.CAMERA",
    "android.permission.RECORD_AUDIO",
    "android.permission.MODIFY_AUDIO_SETTINGS"
  ];

  for (const permission of permissions) {
    if (!manifest.includes(`android:name="${permission}"`)) {
      manifest = manifest.replace(
        /<application\b/i,
        `    <uses-permission android:name="${permission}" />\n\n    <application`
      );
    }
  }

  if (!manifest.includes("android.hardware.camera.any")) {
    manifest = manifest.replace(
      /<application\b/i,
      '    <uses-feature android:name="android.hardware.camera.any" android:required="false" />\n\n    <application'
    );
  }

  if (!manifest.includes("android.hardware.microphone")) {
    manifest = manifest.replace(
      /<application\b/i,
      '    <uses-feature android:name="android.hardware.microphone" android:required="false" />\n\n    <application'
    );
  }

  fs.writeFileSync(ANDROID_MANIFEST, manifest, "utf8");
  console.log("[AIFT Mobile] Android camera/microphone permissions configured.");
}

function configureAndroidSystemBars() {
  if (!fs.existsSync(ANDROID_STYLES)) return;

  let styles = fs.readFileSync(ANDROID_STYLES, "utf8");
  const items = [
    ["android:statusBarColor", "@android:color/transparent"],
    ["android:navigationBarColor", "@android:color/transparent"],
    ["android:windowLightStatusBar", "true"],
    ["android:windowLightNavigationBar", "true"],
    ["android:windowDrawsSystemBarBackgrounds", "true"]
  ];

  function applyToStyle(styleName) {
    const escaped = styleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(<style\\s+name="${escaped}"[^>]*>)([\\s\\S]*?)(<\\/style>)`, "m");
    const match = styles.match(regex);
    if (!match) return false;

    let body = match[2];
    for (const [name, value] of items) {
      const itemRegex = new RegExp(`<item\\s+name="${name.replace(/:/g, "\\:")}"[^>]*>[\\s\\S]*?<\\/item>`, "i");
      if (itemRegex.test(body)) body = body.replace(itemRegex, `<item name="${name}">${value}</item>`);
      else body += `\n        <item name="${name}">${value}</item>`;
    }

    styles = styles.replace(regex, `${match[1]}${body}\n    ${match[3]}`);
    return true;
  }

  applyToStyle("AppTheme.NoActionBar");
  applyToStyle("AppTheme.NoActionBarLaunch");
  fs.writeFileSync(ANDROID_STYLES, styles, "utf8");
  console.log("[AIFT Mobile] Android system bars configured transparent.");
}

function configureAndroidMainActivity() {
  if (!fs.existsSync(ANDROID_MAIN_ACTIVITY)) {
    console.warn("[AIFT Mobile] MainActivity.java not found; edge-to-edge activity patch skipped.");
    return;
  }

  const java = `package com.aift.app;\n\nimport android.graphics.Color;\nimport android.os.Build;\nimport android.os.Bundle;\nimport android.view.Window;\nimport android.view.WindowManager;\n\nimport androidx.core.view.WindowCompat;\nimport androidx.core.view.WindowInsetsControllerCompat;\n\nimport com.getcapacitor.BridgeActivity;\n\npublic class MainActivity extends BridgeActivity {\n    @Override\n    protected void onCreate(Bundle savedInstanceState) {\n        super.onCreate(savedInstanceState);\n\n        final Window window = getWindow();\n\n        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);\n        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);\n        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);\n\n        WindowCompat.setDecorFitsSystemWindows(window, false);\n        window.setStatusBarColor(Color.TRANSPARENT);\n        window.setNavigationBarColor(Color.TRANSPARENT);\n\n        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {\n            window.setNavigationBarDividerColor(Color.TRANSPARENT);\n        }\n\n        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {\n            window.setStatusBarContrastEnforced(false);\n            window.setNavigationBarContrastEnforced(false);\n        }\n\n        WindowInsetsControllerCompat controller =\n                WindowCompat.getInsetsController(window, window.getDecorView());\n\n        controller.setAppearanceLightStatusBars(true);\n        controller.setAppearanceLightNavigationBars(true);\n    }\n}\n`;

  fs.writeFileSync(ANDROID_MAIN_ACTIVITY, java, "utf8");
  console.log("[AIFT Mobile] MainActivity configured for edge-to-edge rendering without Android contrast scrims.");
}

function validateOutput() {
  for (const relativePath of ["index.html", "login.html", "home.html", "aift-native.js"]) {
    if (!fs.existsSync(path.join(OUTPUT_DIR, relativePath))) {
      throw new Error(`Mobile build output is missing: ${relativePath}`);
    }
  }

  const missingBridge = walkHtmlFiles(OUTPUT_DIR).filter(
    filePath => !fs.readFileSync(filePath, "utf8").includes(NATIVE_BRIDGE_TAG)
  );

  if (missingBridge.length) {
    throw new Error(`Native bridge injection failed for ${missingBridge.length} HTML file(s).`);
  }
}

function build() {
  console.log("[AIFT Mobile] Building packaged web application...");
  validateSource();
  removeDirectory(OUTPUT_DIR);
  ensureDirectory(OUTPUT_DIR);
  copyDirectory(PROJECT_ROOT);
  copyFile(MOBILE_ENTRY_FILE, path.join(OUTPUT_DIR, "index.html"));
  copyFile(NATIVE_BRIDGE_SOURCE, NATIVE_BRIDGE_OUTPUT);
  injectNativeBridgeIntoHtml();
  configureAndroidManifest();
  configureAndroidSystemBars();
  configureAndroidMainActivity();
  validateOutput();
  console.log(`[AIFT Mobile] Web build ready: ${OUTPUT_DIR}`);
}

try {
  build();
} catch (error) {
  console.error("[AIFT Mobile] Build failed.");
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
}
