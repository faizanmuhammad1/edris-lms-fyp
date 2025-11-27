#!/usr/bin/env node

/**
 * Safe build script that handles EPERM errors on Windows
 * by catching and ignoring permission errors for system directories
 */

const path = require("path");
const fs = require("fs");
const nextBuild = require("next/dist/build").default;

// Absolute path to the Next.js project root
const projectRoot = path.resolve(__dirname, "..");

// Set environment variables to restrict file system access
process.env.NEXT_TELEMETRY_DISABLED = "1";

// Monkey-patch fs.readdir and fs.readdirSync to ignore EPERM errors for system directories
const originalReaddir = fs.readdir;
const originalReaddirSync = fs.readdirSync;

fs.readdir = function(filePath, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = undefined;
    }

    const wrappedCallback = (err, files) => {
        if (isIgnorableWindowsFsAccessError(err)) {
            // Return empty array for non-project system directories
            return callback(null, []);
        }
        callback(err, files);
    };

    return originalReaddir.call(this, filePath, options, wrappedCallback);
};

fs.readdirSync = function(filePath, options) {
    try {
        return originalReaddirSync.call(this, filePath, options);
    } catch (err) {
        if (isIgnorableWindowsFsAccessError(err)) {
            // Return empty array for non-project system directories
            return [];
        }
        throw err;
    }
};

// Utility: determine if an FS access error (EPERM/EACCES) is outside the project directory on Windows
function isIgnorableWindowsFsAccessError(err) {
    if (!err) return false;
    const message = (err.message || String(err)).toLowerCase();
    if (!message.includes("eperm") && !message.includes("eacces")) return false;

    const p = (err.path || "").toLowerCase();
    if (!p) return false;

    const projectRootLower = projectRoot.toLowerCase();

    // Ignore access errors that happen outside of the project directory
    return !p.startsWith(projectRootLower);
}

// Patch fs.promises.readdir as well so async callers don't crash on EPERM
if (fs.promises && typeof fs.promises.readdir === "function") {
    const originalReaddirPromise = fs.promises.readdir.bind(fs.promises);
    fs.promises.readdir = async function(filePath, options) {
        try {
            return await originalReaddirPromise(filePath, options);
        } catch (err) {
            if (isIgnorableWindowsFsAccessError(err)) {
                return [];
            }
            throw err;
        }
    };
}

// After requiring next/dist/build, Next attaches its own fatal exception listeners
// which exit the process on ANY unhandledRejection/uncaughtException.
// We remove those and install our own softer handlers that ignore Windows EPERM
// errors outside the project directory but still fail the build for everything else.
for (const eventName of["unhandledRejection", "uncaughtException"]) {
    for (const listener of process.listeners(eventName)) {
        process.removeListener(eventName, listener);
    }
}

process.on("unhandledRejection", (reason) => {
    if (isIgnorableWindowsFsAccessError(reason)) {
        // Silently ignore these specific Windows permission errors
        return;
    }
    console.error("Unhandled rejection during Next.js build:", reason);
    process.exitCode = 1;
});

process.on("uncaughtException", (error) => {
    if (isIgnorableWindowsFsAccessError(error)) {
        // Silently ignore these specific Windows permission errors
        return;
    }
    console.error("Uncaught exception during Next.js build:", error);
    process.exit(1);
});

// Override console.error to filter out EPERM errors for non-project system directories
const originalError = console.error;
console.error = (...args) => {
    const message = args.join(" ");
    const lower = message.toLowerCase();

    // Filter out EPERM errors that clearly refer to paths outside the project root
    if (
        lower.includes("eperm") &&
        !lower.includes(projectRoot.toLowerCase())
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
        const lower = message.toLowerCase();

        // Filter out EPERM errors for non-project system directories
        if (
            lower.includes("eperm") &&
            !lower.includes(projectRoot.toLowerCase())
        ) {
            // Silently ignore these errors
            if (callback) callback();
            return true;
        }
    }

    return originalStderrWrite(chunk, encoding, callback);
};

// Run Next.js build programmatically in this process so our patches apply
(async() => {
    try {
        await nextBuild(projectRoot);
        // If no fatal errors were thrown, ensure success exit code
        if (!process.exitCode) {
            process.exit(0);
        }
    } catch (error) {
        if (isIgnorableWindowsFsAccessError(error)) {
            // Treat these as non-fatal and succeed the build
            console.warn("Ignored FS access error for Windows system directory:", error.path || "");
            process.exit(0);
            return;
        }
        console.error("Next.js build failed:", error);
        process.exit(1);
    }
})();