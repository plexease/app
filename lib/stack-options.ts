export type Language = "csharp" | "javascript" | "python" | "php" | "java" | "go";

export interface StackOption {
  id: Language;
  label: string;
  frameworks: { id: string; label: string }[];
}

export const STACK_OPTIONS: StackOption[] = [
  {
    id: "csharp",
    label: "C#",
    frameworks: [
      { id: "dotnet8", label: ".NET 8" },
      { id: "dotnet6", label: ".NET 6" },
      { id: "dotnet-framework", label: ".NET Framework 4.x" },
    ],
  },
  {
    id: "javascript",
    label: "JavaScript / TypeScript",
    frameworks: [
      { id: "node-express", label: "Node / Express" },
      { id: "nextjs", label: "Next.js" },
      { id: "nestjs", label: "NestJS" },
    ],
  },
  {
    id: "python",
    label: "Python",
    frameworks: [
      { id: "django", label: "Django" },
      { id: "flask", label: "Flask" },
      { id: "fastapi", label: "FastAPI" },
    ],
  },
  {
    id: "php",
    label: "PHP",
    frameworks: [
      { id: "laravel", label: "Laravel" },
      { id: "symfony", label: "Symfony" },
      { id: "php-plain", label: "Plain PHP" },
    ],
  },
  {
    id: "java",
    label: "Java",
    frameworks: [
      { id: "spring", label: "Spring Boot" },
      { id: "quarkus", label: "Quarkus" },
      { id: "jakarta", label: "Jakarta EE" },
    ],
  },
  {
    id: "go",
    label: "Go",
    frameworks: [
      { id: "go-std", label: "Standard Library" },
      { id: "gin", label: "Gin" },
      { id: "echo", label: "Echo" },
    ],
  },
];

const STACK_KEY = "plexease_stack";

export interface SelectedStack {
  language: Language;
  framework: string;
}

export function saveStack(stack: SelectedStack): void {
  try { localStorage.setItem(STACK_KEY, JSON.stringify(stack)); } catch {}
}

export function loadStack(): SelectedStack | null {
  try {
    const raw = localStorage.getItem(STACK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
