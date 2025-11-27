import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Restrict Next.js to only scan within the project directory
  // This prevents scanning system directories on Windows
  experimental: {
    // Use more restrictive file system access
  },

  images: {
    remotePatterns: [
      {
        hostname: "marshal-lms-yt-video-subscribe.fly.storage.tigris.dev",
        port: "",
        protocol: "https",
      },
      {
        hostname: "lmsbucket6969.fly.storage.tigris.dev",
        port: "",
        protocol: "https",
      },
      {
        hostname: "edris-lms.fly.storage.tigris.dev",
        port: "",
        protocol: "https",
      },
      {
        hostname: "avatar.vercel.sh",
        port: "",
        protocol: "https",
      },
      {
        hostname: "images.unsplash.com",
        port: "",
        protocol: "https",
      },
    ],
  },

  webpack: (config, { isServer }) => {
    // Restrict file watching to project directory only
    // This prevents webpack from scanning system directories on Windows
    const projectRoot = path.resolve(__dirname);
    
    // Set webpack context to project root to prevent scanning outside
    config.context = projectRoot;
    
    // Use only string glob patterns (RegExp not supported in watchOptions.ignored array)
    const ignoredPatterns: string[] = [
      // Exclude node_modules
      "**/node_modules/**",
      // Exclude .next build directory
      "**/.next/**",
      // Exclude system directories (Windows) - specific paths that cause EPERM errors
      "**/Application Data/**",
      "**/AppData/**",
      "**/Program Files/**",
      "**/Program Files (x86)/**",
      "**/Windows/**",
      "**/ProgramData/**",
    ];

    // Add Windows-specific glob patterns
    if (process.platform === "win32") {
      // Exclude any path containing Application Data (the specific EPERM error)
      ignoredPatterns.push("**/*Application Data*/**");
      // Exclude user directories outside project (using glob pattern)
      ignoredPatterns.push("C:/Users/**/Application Data/**");
      ignoredPatterns.push("C:/Users/**/AppData/**");
    } else {
      // Unix-specific exclusions
      ignoredPatterns.push("/usr/**");
      ignoredPatterns.push("/etc/**");
      ignoredPatterns.push("/var/**");
    }

    config.watchOptions = {
      ...config.watchOptions,
      ignored: ignoredPatterns,
      // Only watch files within the project directory
      aggregateTimeout: 300,
      poll: false,
    };

    // Configure webpack to only resolve modules within the project
    config.resolve = {
      ...config.resolve,
      // Prevent webpack from resolving outside project directory
      symlinks: false,
      // Restrict module resolution to project directory
      modules: [
        path.resolve(projectRoot, "node_modules"),
        ...(config.resolve?.modules || []).filter(
          (m) => typeof m === "string" && path.resolve(m).startsWith(projectRoot)
        ),
      ],
    };

    return config;
  },
};

export default nextConfig;
