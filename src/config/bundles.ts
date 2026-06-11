import type { BundleDefinition } from "../types/index.js";

export const builtInBundles: BundleDefinition[] = [
  {
    name: "frontend",
    packages: ["react", "vite", "tailwindcss", "eslint", "prettier"]
  },
  {
    name: "backend",
    packages: ["express", "prisma", "dotenv"]
  },
  {
    name: "fullstack",
    packages: ["react", "vite", "express", "prisma"]
  }
];
