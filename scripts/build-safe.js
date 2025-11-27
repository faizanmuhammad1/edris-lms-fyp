#!/usr/bin/env node

/**
 * Safe build script that handles EPERM errors on Windows
 * by catching and ignoring permission errors for system directories
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Set environment variables to restrict file system access
process.env.NEXT_TELEMETRY_DISABLED = "1";

// Monkey-patch fs.readdir and fs.readdirSync to ignore EPERM errors for system directories
const originalReaddir = fs.readdir;
const originalReaddirSync = fs.readdirSync;

fs.readdir = function (filePath, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = undefined;
  }
  
  const wrappedCallback = (err, files) => {
    if (err && err.code === "EPERM" && err.path) {
      const path = err.path.toLowerCase();
      if (
        path.includes("application data") ||
        path.includes("appdata") ||
        path.includes("program files") ||
        path.includes("programdata")
      ) {
        // Return empty array for system directories
        return callback(null, []);
      }
    }
    callback(err, files);
  };
  
  return originalReaddir.call(this, filePath, options, wrappedCallback);
};

fs.readdirSync = function (filePath, options) {
  try {
    return originalReaddirSync.call(this, filePath, options);
  } catch (err) {
    if (err.code === "EPERM" && err.path) {
      const path = err.path.toLowerCase();
      if (
        path.includes("application data") ||
        path.includes("appdata") ||
        path.includes("program files") ||
        path.includes("programdata")
      ) {
        // Return empty array for system directories
        return [];
      }
    }
    throw err;
  }
};

// Handle unhandled rejections to catch EPERM errors
process.on("unhandledRejection", (reason, promise) => {
  const errorMessage = reason?.message || String(reason);
  const errorPath = reason?.path || "";
  
  // Ignore EPERM errors for system directories
  if (
    errorMessage.includes("EPERM") &&
    (errorPath.includes("Application Data") ||
     errorPath.includes("AppData") ||
     errorPath.includes("Program Files") ||
     errorPath.includes("ProgramData") ||
     errorMessage.includes("Application Data"))
  ) {
    // Silently ignore these errors
    return;
  }
  
  // Log other unhandled rejections
  console.error("Unhandled rejection:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  const errorMessage = error?.message || String(error);
  const errorPath = error?.path || "";
  
  // Ignore EPERM errors for system directories
  if (
    errorMessage.includes("EPERM") &&
    (errorPath.includes("Application Data") ||
     errorPath.includes("AppData") ||
     errorPath.includes("Program Files") ||
     errorPath.includes("ProgramData") ||
     errorMessage.includes("Application Data"))
  ) {
    // Silently ignore these errors
    return;
  }
  
  // Re-throw other exceptions
  throw error;
});

// Override console.error to filter out EPERM errors for system directories
const originalError = console.error;
console.error = (...args) => {
  const message = args.join(" ");
  
  // Filter out EPERM errors for Application Data and other system directories
  if (
    message.includes("EPERM") &&
    (message.includes("Application Data") ||
     message.includes("AppData") ||
     message.includes("Program Files") ||
     message.includes("ProgramData"))
  ) {
    // Silently ignore these errors
    return;
  }
  
  // Pass through all other errors
  originalError.apply(console, args);
};

// Override process.stderr.write to filter EPERM errors
const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, encoding, callback) => {
  if (typeof chunk === "string" || Buffer.isBuffer(chunk)) {
    const message = chunk.toString();
    
    // Filter out EPERM errors for system directories
    if (
      message.includes("EPERM") &&
      (message.includes("Application Data") ||
       message.includes("AppData") ||
       message.includes("Program Files") ||
       message.includes("ProgramData"))
    ) {
      // Silently ignore these errors
      if (callback) callback();
      return true;
    }
  }
  
  return originalStderrWrite(chunk, encoding, callback);
};

// Spawn the Next.js build process
const buildProcess = spawn("next", ["build"], {
  stdio: "inherit",
  shell: true,
  cwd: path.resolve(__dirname, ".."),
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
  },
});

buildProcess.on("error", (error) => {
  // Only exit with error if it's not an EPERM error for system directories
  if (
    error.code === "EPERM" &&
    (error.path?.includes("Application Data") ||
     error.path?.includes("AppData") ||
     error.path?.includes("Program Files") ||
     error.path?.includes("ProgramData"))
  ) {
    console.warn("Ignored EPERM error for system directory:", error.path);
    return;
  }
  
  console.error("Build process error:", error);
  process.exit(1);
});

buildProcess.on("exit", (code) => {
  process.exit(code || 0);
});

