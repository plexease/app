import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const NuGetAdvisorSchema = z.object({
  whatItDoes: z.string(),
  alternatives: z.array(z.string()),
  compatibility: z.string(),
  versionAdvice: z.string(),
});

export type NuGetAdvisorResult = z.infer<typeof NuGetAdvisorSchema>;

export async function getNuGetAdvice(packageName: string): Promise<NuGetAdvisorResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a .NET package advisor. The user has asked about the NuGet package: "${packageName}".
Return ONLY valid JSON in this exact shape — no markdown, no explanation, no code fences:
{
  "whatItDoes": "Plain English description of what this package does.",
  "alternatives": ["Package1", "Package2", "Package3"],
  "compatibility": "Which .NET versions are supported, any known issues.",
  "versionAdvice": "Latest stable version, whether to upgrade, any deprecation notes."
}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return NuGetAdvisorSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}

// --- Code Explainer ---

const CodeExplainerSchema = z.object({
  explanation: z.string(),
  detectedPackages: z.array(z.string()),
  detectedPatterns: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type CodeExplainerResult = z.infer<typeof CodeExplainerSchema>;

export async function getCodeExplanation(
  code: string,
  scopeQuestion: string,
  language: string,
  framework: string
): Promise<CodeExplainerResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a code explainer for developers and non-developers. The user has pasted ${language} code (${framework}) and wants to understand: "${scopeQuestion}".

Analyse this code and return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "explanation": "A clear, plain English explanation accessible to non-developers. Explain what the code does, not how.",
  "detectedPackages": ["List", "of", "packages/libraries used"],
  "detectedPatterns": ["List", "of", "design patterns or integration patterns detected"],
  "nextStepSuggestion": "A 1-2 sentence recommendation for what the user should do next, referencing a specific tool.",
  "nextStepToolId": "integration-planner or package-advisor (whichever is most relevant)",
  "nextStepDescription": "Context-aware description for why the recommended tool would help, referencing specifics from this code."
}

The code:
${code}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return CodeExplainerSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}

// --- Integration Planner ---

const IntegrationPlannerSchema = z.object({
  approach: z.string(),
  recommendedPackages: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
  })),
  architectureOverview: z.string(),
  considerations: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type IntegrationPlannerResult = z.infer<typeof IntegrationPlannerSchema>;

export async function getIntegrationPlan(
  description: string,
  language: string,
  framework: string
): Promise<IntegrationPlannerResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an integration planning advisor. The user wants to build an integration using ${language} (${framework}): "${description}".

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "approach": "A clear, plain English summary of the recommended approach.",
  "recommendedPackages": [{"name": "PackageName", "purpose": "What it's used for"}],
  "architectureOverview": "High-level architecture description — components, data flow, key patterns.",
  "considerations": ["Security consideration", "Error handling note", "Testing approach"],
  "nextStepSuggestion": "A 1-2 sentence recommendation for what to do next.",
  "nextStepToolId": "integration-code-generator or api-wrapper-generator",
  "nextStepDescription": "Context-aware description referencing specifics from this plan."
}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return IntegrationPlannerSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}

// --- Integration Code Generator ---

const CodeGeneratorSchema = z.object({
  files: z.array(z.object({
    filename: z.string(),
    description: z.string(),
    code: z.string(),
  })),
  setupInstructions: z.string(),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type CodeGeneratorResult = z.infer<typeof CodeGeneratorSchema>;

export async function generateIntegrationCode(
  spec: string,
  language: string,
  framework: string
): Promise<CodeGeneratorResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are an integration code generator. Generate boilerplate code for this integration using ${language} (${framework}): "${spec}".

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "files": [
    {"filename": "FileName.ext", "description": "What this file does", "code": "// Full file contents"}
  ],
  "setupInstructions": "Step-by-step setup instructions (package install commands, config, env vars).",
  "nextStepSuggestion": "Recommendation for next step.",
  "nextStepToolId": "unit-test-generator",
  "nextStepDescription": "Context-aware description for generating tests for this code."
}

Generate 2-4 files max. Keep code production-ready but concise.`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return CodeGeneratorSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}
