import type { BundleDefinition } from "../types/index.js";

export const builtInBundles: BundleDefinition[] = [
  {
    name: "frontend",
    packages: ["react", "react-dom", "vite", "tailwindcss", "eslint", "prettier"]
  },
  {
    name: "backend",
    packages: ["express", "prisma", "dotenv"]
  },
  {
    name: "fullstack",
    packages: ["react", "vite", "express", "prisma"]
  },
  {
    name: "frameworks",
    packages: [
      "react",
      "react-dom",
      "vue",
      "svelte",
      "solid-js",
      "preact",
      "@builder.io/qwik",
      "@builder.io/qwik-city",
      "@angular/core",
      "@angular/cli",
      "next",
      "nuxt",
      "@sveltejs/kit",
      "astro",
      "@remix-run/react",
      "express",
      "fastify",
      "@nestjs/core",
      "vite",
      "typescript"
    ]
  }
];
