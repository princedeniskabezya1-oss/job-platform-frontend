"use strict";

const fs = require("fs");
const path = require("path");

const MOBILE_ROOT = __dirname;
const PROJECT_ROOT = path.resolve(MOBILE_ROOT, "..");
const OUTPUT_DIR = path.join(MOBILE_ROOT, "www");
const MOBILE_ENTRY_FILE = path.join(MOBILE_ROOT, "launcher", "index.html");

const EXCLUDED_ROOT_DIRECTORIES = new Set([
  ".git",
  ".github",
  ".idea",
  ".vscode",
  "mobile-build",
  "node_modules"
]);

const EXCLUDED_ROOT_FILES = new Set([
  ".DS_Store",
  ".gitignore",
  "package.json",
  "package-lock.json",
  "capacitor.config.json",
  "capacitor.config.ts",
  "README",
  "README.md"
]);

const ALLOWED_EXTENSIONS = new Set([
  ".html", ".htm", ".css", ".js", ".mjs", ".json", ".webmanifest", ".xml",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".ico",
  ".woff", ".woff2", ".ttf", ".otf",
  ".mp3", ".wav", ".ogg", ".m4a", ".aac",
  ".mp4", ".webm", ".mov",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv"
]);

function removeDirectory(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.rmSync(directoryPath, { recursive: true, force: true });
  }
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function shouldCopyFile(sourcePath) {
  const fileName = path.basename(sourcePath);

  if (EXCLUDED_ROOT_FILES.has(fileName) && path.dirname(sourcePath) === PROJECT_ROOT) {
    return false;
  }

  if (path.resolve(sourcePath) === path.join(PROJECT_ROOT, "index.html")) {
    return false;
  }

  return ALLOWED_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function copyFile(sourcePath, destinationPath) {
  ensureDirectory(path.dirname(destinationPath));
  fs.copyFileSync(sourcePath, destinationPath);
}

function copyDirectory(sourceDirectory, relativeDirectory = "") {
  const entries = fs.readdirSync(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const relativePath = path.join(relativeDirectory, entry.name);
    const destinationPath = path.join(OUTPUT_DIR, relativePath);

    if (entry.isDirectory()) {
      if (sourceDirectory === PROJECT_ROOT && EXCLUDED_ROOT_DIRECTORIES.has(entry.name)) {
        continue;
      }

      copyDirectory(sourcePath, relativePath);
      continue;
    }

    if (!entry.isFile() || !shouldCopyFile(sourcePath)) {
      continue;
    }

    copyFile(sourcePath, destinationPath);
  }
}

function requireSourceFile(relativePath) {
  const filePath = path.join(PROJECT_ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required AIFT source file is missing: ${relativePath}`);
  }
}

function validateSource() {
  requireSourceFile("login.html");
  requireSourceFile("home.html");

  if (!fs.existsSync(MOBILE_ENTRY_FILE)) {
    throw new Error("Required Android launcher is missing: mobile-build/launcher/index.html");
  }
}

function validateOutput() {
  for (const relativePath of ["index.html", "login.html", "home.html"]) {
    const filePath = path.join(OUTPUT_DIR, relativePath);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Mobile build output is missing: ${relativePath}`);
    }
  }
}

function build() {
  console.log("[AIFT Mobile] Building packaged web application...");
  validateSource();
  removeDirectory(OUTPUT_DIR);
  ensureDirectory(OUTPUT_DIR);
  copyDirectory(PROJECT_ROOT);
  copyFile(MOBILE_ENTRY_FILE, path.join(OUTPUT_DIR, "index.html"));
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
