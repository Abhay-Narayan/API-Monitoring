// Bootstrap file for tsconfig-paths to resolve paths correctly at runtime
const tsConfigPaths = require("tsconfig-paths");
const path = require("path");

// Get the base directory (where this file is located)
const baseUrl = path.resolve(__dirname, "dist");

// Register the path mappings
// These paths are relative to the dist folder
tsConfigPaths.register({
  baseUrl: baseUrl,
  paths: {
    "@/*": ["./*"],
    "@/modules/*": ["./modules/*"],
    "@/shared/*": ["./shared/*"],
    "@/config/*": ["./config/*"],
    "@/types": ["./types"],
    "@/dto/*": ["./dto/*"],
  },
});
