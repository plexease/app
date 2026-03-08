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

// --- Error Explainer ---

const ErrorExplainerSchema = z.object({
  rootCause: z.string(),
  fixSuggestions: z.array(z.string()),
  relatedDocs: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type ErrorExplainerResult = z.infer<typeof ErrorExplainerSchema>;

export async function getErrorExplanation(
  errorLog: string,
  language: string,
  framework: string
): Promise<ErrorExplainerResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an error analysis expert. The user has pasted an error log or stack trace from a ${language} (${framework}) project.

Analyse the error and return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "rootCause": "Plain English explanation of what caused this error and why.",
  "fixSuggestions": ["Actionable fix suggestion 1", "Actionable fix suggestion 2"],
  "relatedDocs": ["Relevant documentation link or resource 1", "Resource 2"],
  "nextStepSuggestion": "A 1-2 sentence recommendation for what the user should do next.",
  "nextStepToolId": "dependency-audit or health-checker (whichever is most relevant)",
  "nextStepDescription": "Context-aware description for why the recommended tool would help, referencing specifics from this error."
}

The error log:
${errorLog}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return ErrorExplainerSchema.parse(JSON.parse(text));
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
    max_tokens: 4096,
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

// --- Health Checker ---

const HealthCheckerSchema = z.object({
  configurationStatus: z.string(),
  issues: z.array(z.object({
    severity: z.enum(["critical", "warning", "info"]),
    description: z.string(),
    fix: z.string(),
  })),
  recommendations: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type HealthCheckerResult = z.infer<typeof HealthCheckerSchema>;

export async function checkHealth(
  config: string,
  language: string,
  framework: string
): Promise<HealthCheckerResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an integration health checker. Analyse this ${language} (${framework}) configuration or integration setup and identify issues.

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "configurationStatus": "Overall health summary — healthy, needs attention, or critical issues found.",
  "issues": [
    {"severity": "critical|warning|info", "description": "What the issue is", "fix": "How to fix it"}
  ],
  "recommendations": ["Best practice recommendation 1", "Recommendation 2"],
  "nextStepSuggestion": "Recommendation for next step.",
  "nextStepToolId": "error-explainer",
  "nextStepDescription": "Context-aware description for debugging any errors found."
}

The configuration/setup:
${config}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return HealthCheckerSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}

// --- Migration Assistant ---

const MigrationAssistantSchema = z.object({
  migrationSteps: z.array(z.object({
    step: z.number(),
    title: z.string(),
    description: z.string(),
    codeChanges: z.string(),
  })),
  breakingChanges: z.array(z.string()),
  estimatedEffort: z.string(),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type MigrationAssistantResult = z.infer<typeof MigrationAssistantSchema>;

export async function getMigrationPlan(
  migratingFrom: string,
  migratingTo: string,
  code: string,
  language: string,
  framework: string
): Promise<MigrationAssistantResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a migration assistant. Help the user migrate their ${language} (${framework}) project from "${migratingFrom}" to "${migratingTo}".

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "migrationSteps": [
    {"step": 1, "title": "Step title", "description": "What to do and why", "codeChanges": "// Code changes needed for this step"}
  ],
  "breakingChanges": ["Breaking change 1 — what breaks and how to fix it"],
  "estimatedEffort": "Medium — 2-4 hours for a typical project",
  "nextStepSuggestion": "Recommendation for next step.",
  "nextStepToolId": "integration-code-generator",
  "nextStepDescription": "Context-aware description for generating updated integration code after migration."
}

The relevant code:
${code}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return MigrationAssistantSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}

// --- Unit Test Generator ---

const UnitTestGeneratorSchema = z.object({
  files: z.array(z.object({
    filename: z.string(),
    description: z.string(),
    code: z.string(),
  })),
  testFramework: z.string(),
  mockingApproach: z.string(),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type UnitTestGeneratorResult = z.infer<typeof UnitTestGeneratorSchema>;

export async function generateUnitTests(
  code: string,
  language: string,
  framework: string
): Promise<UnitTestGeneratorResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a unit test generator. Generate comprehensive unit tests for this ${language} (${framework}) code.

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "files": [
    {"filename": "TestFile.ext", "description": "What these tests cover", "code": "// Full test file contents"}
  ],
  "testFramework": "Which test framework was chosen and why (e.g. xUnit for .NET, pytest for Python).",
  "mockingApproach": "How mocking/stubbing is set up (e.g. Moq for .NET, unittest.mock for Python).",
  "nextStepSuggestion": "Recommendation for next step.",
  "nextStepToolId": "dependency-audit",
  "nextStepDescription": "Context-aware description for auditing dependencies after adding test packages."
}

Generate 1-3 test files. Cover happy paths, error cases, and edge cases.

The code to test:
${code}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return UnitTestGeneratorSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}

// --- API Wrapper Generator ---

const ApiWrapperGeneratorSchema = z.object({
  files: z.array(z.object({
    filename: z.string(),
    description: z.string(),
    code: z.string(),
  })),
  authenticationSetup: z.string(),
  usageExample: z.string(),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type ApiWrapperGeneratorResult = z.infer<typeof ApiWrapperGeneratorSchema>;

export async function generateApiWrapper(
  apiDescription: string,
  language: string,
  framework: string
): Promise<ApiWrapperGeneratorResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an API wrapper code generator. Generate a typed wrapper/client for this API using ${language} (${framework}): "${apiDescription}".

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "files": [
    {"filename": "FileName.ext", "description": "What this file does", "code": "// Full file contents"}
  ],
  "authenticationSetup": "Step-by-step instructions for configuring authentication (API keys, OAuth, etc.).",
  "usageExample": "// Example code showing how to use the generated wrapper",
  "nextStepSuggestion": "Recommendation for next step.",
  "nextStepToolId": "unit-test-generator",
  "nextStepDescription": "Context-aware description for generating tests for this wrapper."
}

Generate 2-4 files max. Include proper typing, error handling, and authentication support.`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return ApiWrapperGeneratorSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}

// --- Package Advisor ---

const PackageAdvisorSchema = z.object({
  recommendation: z.string(),
  alternatives: z.array(z.object({
    name: z.string(),
    comparison: z.string(),
  })),
  compatibility: z.string(),
  versionAdvice: z.string(),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type PackageAdvisorResult = z.infer<typeof PackageAdvisorSchema>;

export async function getPackageAdvice(
  query: string,
  language: string,
  framework: string
): Promise<PackageAdvisorResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a package advisor for ${language} (${framework}) developers. The user is looking for a package: "${query}".

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "recommendation": "Main package recommendation with reasoning for why it's the best choice.",
  "alternatives": [{"name": "PackageName", "comparison": "How it compares to the recommendation"}],
  "compatibility": "Version and framework compatibility information.",
  "versionAdvice": "Latest stable version, whether to upgrade, any deprecation notes.",
  "nextStepSuggestion": "A 1-2 sentence recommendation for what to do next.",
  "nextStepToolId": "integration-code-generator",
  "nextStepDescription": "Context-aware description for generating integration code with the recommended package."
}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return PackageAdvisorSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}

// --- Dependency Audit ---

const DependencyAuditSchema = z.object({
  summary: z.string(),
  dependencies: z.array(z.object({
    name: z.string(),
    currentVersion: z.string(),
    latestVersion: z.string(),
    status: z.enum(["up-to-date", "outdated", "vulnerable", "deprecated"]),
    note: z.string(),
  })),
  recommendations: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type DependencyAuditResult = z.infer<typeof DependencyAuditSchema>;

export async function auditDependencies(
  dependencyFile: string,
  language: string,
  framework: string
): Promise<DependencyAuditResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a dependency audit tool. Analyse this ${language} (${framework}) dependency file and check for outdated, vulnerable, or deprecated packages.

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "summary": "Overall health summary (e.g. '3 of 8 packages need attention').",
  "dependencies": [
    {"name": "PackageName", "currentVersion": "1.0.0", "latestVersion": "2.0.0", "status": "outdated", "note": "Major version available with breaking changes."}
  ],
  "recommendations": ["Priority action 1", "Priority action 2"],
  "nextStepSuggestion": "Recommendation for next step.",
  "nextStepToolId": "migration-assistant",
  "nextStepDescription": "Context-aware description for migrating outdated dependencies."
}

The dependency file:
${dependencyFile}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return DependencyAuditSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}
