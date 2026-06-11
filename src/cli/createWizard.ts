import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export interface TemplateChoice {
  label: string;
  value: string;
}

interface FrameworkChoice {
  label: string;
  variants: TemplateChoice[];
}

const frameworks: FrameworkChoice[] = [
  {
    label: "React",
    variants: [
      { label: "TypeScript + Vite", value: "react-vite" },
      { label: "JavaScript + Vite", value: "react-vite-js" }
    ]
  },
  {
    label: "Next.js",
    variants: [{ label: "TypeScript", value: "nextjs" }]
  },
  {
    label: "Express API",
    variants: [{ label: "TypeScript", value: "express-api" }]
  },
  {
    label: "Node.js",
    variants: [{ label: "TypeScript", value: "node-ts" }]
  }
];

export interface CreateWizardResult {
  projectName: string;
  templateName: string;
}

export async function runCreateWizard(defaultProjectName?: string): Promise<CreateWizardResult> {
  if (!process.stdin.isTTY) {
    throw new Error("Interactive create requires a terminal. Use packvault create <template> <project-name> instead.");
  }

  const reader = readline.createInterface({ input, output });

  try {
    console.log("PackVault offline project creator");
    console.log("");

    const projectName = await promptText(reader, "Project name", defaultProjectName ?? "my-packvault-app");
    const framework = await promptSelect(reader, "Select a framework", frameworks);
    const variant = framework.variants.length === 1
      ? framework.variants[0]
      : await promptSelect(reader, "Select a variant", framework.variants);

    return {
      projectName,
      templateName: variant.value
    };
  } finally {
    reader.close();
  }
}

export function isKnownTemplate(value: string): boolean {
  return knownTemplates().includes(value);
}

export function normalizeTemplateName(value: string): string {
  return value === "react-app" ? "react-vite" : value;
}

export function knownTemplates(): string[] {
  return ["react-vite", "react-vite-js", "react-app", "nextjs", "express-api", "node-ts"];
}

async function promptText(
  reader: readline.Interface,
  label: string,
  defaultValue: string
): Promise<string> {
  const answer = await reader.question(`${label} (${defaultValue}): `);
  return answer.trim() || defaultValue;
}

async function promptSelect<T extends { label: string }>(
  reader: readline.Interface,
  label: string,
  choices: T[]
): Promise<T> {
  console.log(label);
  choices.forEach((choice, index) => {
    console.log(`  ${index + 1}. ${choice.label}`);
  });

  while (true) {
    const answer = await reader.question("Choose a number: ");
    const index = Number(answer.trim()) - 1;

    if (Number.isInteger(index) && choices[index]) {
      return choices[index];
    }

    console.log(`Please choose a number between 1 and ${choices.length}.`);
  }
}
