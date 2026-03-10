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

export async function getNuGetAdvice(packageName: string, personaInstruction?: string): Promise<NuGetAdvisorResult> {
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
}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
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
  framework: string,
  personaInstruction?: string
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
  "nextStepToolId": "compatibility-check or connection-health-check (whichever is most relevant)",
  "nextStepDescription": "Context-aware description for why the recommended tool would help, referencing specifics from this error."
}

The error log:
${errorLog}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
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
  framework: string,
  personaInstruction?: string
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
  "nextStepToolId": "integration-blueprint or tool-finder (whichever is most relevant)",
  "nextStepDescription": "Context-aware description for why the recommended tool would help, referencing specifics from this code."
}

The code:
${code}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
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
  framework: string,
  personaInstruction?: string
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
  "nextStepToolId": "code-generator or api-wrapper-generator",
  "nextStepDescription": "Context-aware description referencing specifics from this plan."
}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
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
  framework: string,
  personaInstruction?: string
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

Generate 2-4 files max. Keep code production-ready but concise.${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
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
  framework: string,
  personaInstruction?: string
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
  "nextStepToolId": "error-resolver",
  "nextStepDescription": "Context-aware description for debugging any errors found."
}

The configuration/setup:
${config}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
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
  framework: string,
  personaInstruction?: string
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
  "nextStepToolId": "code-generator",
  "nextStepDescription": "Context-aware description for generating updated integration code after migration."
}

The relevant code:
${code}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
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
  framework: string,
  personaInstruction?: string
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
  "nextStepToolId": "compatibility-check",
  "nextStepDescription": "Context-aware description for auditing dependencies after adding test packages."
}

Generate 1-3 test files. Cover happy paths, error cases, and edge cases.

The code to test:
${code}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
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
  framework: string,
  personaInstruction?: string
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

Generate 2-4 files max. Include proper typing, error handling, and authentication support.${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
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
  framework: string,
  personaInstruction?: string
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
  "nextStepToolId": "code-generator",
  "nextStepDescription": "Context-aware description for generating integration code with the recommended package."
}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
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
  framework: string,
  personaInstruction?: string
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
  "nextStepToolId": "upgrade-assistant",
  "nextStepDescription": "Context-aware description for migrating outdated dependencies."
}

The dependency file:
${dependencyFile}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
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

// --- Tool Planner ---

const toolPlannerSchema = z.object({
  recommendations: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
    cost: z.string(),
    integrationComplexity: z.enum(["low", "medium", "high"]),
  })),
  stackOverview: z.string(),
  implementationOrder: z.array(z.string()),
  considerations: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type ToolPlannerResult = z.infer<typeof toolPlannerSchema>;

export async function getToolPlan(
  description: string,
  personaInstruction?: string
): Promise<ToolPlannerResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `You are an integration platform advisor. The user needs help choosing the right tools and platforms for their business needs.

Analyse their requirements and recommend a compatible tool stack.

User's needs: "${description}"

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "recommendations": [{"name": "Tool Name", "purpose": "What it does for them", "cost": "Free / £X/month / etc", "integrationComplexity": "low|medium|high"}],
  "stackOverview": "How these tools work together as a stack",
  "implementationOrder": ["First do this", "Then this"],
  "considerations": ["Important things to know"],
  "nextStepSuggestion": "What to do next",
  "nextStepToolId": "integration-setup",
  "nextStepDescription": "Brief description of why this tool helps next"
}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = toolPlannerSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error(`Failed to parse Claude response: ${text}`);
  return parsed.data;
}

// --- Connection Map ---

const connectionMapSchema = z.object({
  connections: z.array(z.object({
    from: z.string(),
    to: z.string(),
    dataFlow: z.string(),
    method: z.string(),
  })),
  weakPoints: z.array(z.object({
    description: z.string(),
    severity: z.enum(["critical", "warning", "info"]),
    recommendation: z.string(),
  })),
  overallAssessment: z.string(),
  recommendations: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type ConnectionMapResult = z.infer<typeof connectionMapSchema>;

export async function getConnectionMap(
  platforms: string,
  concerns?: string,
  personaInstruction?: string
): Promise<ConnectionMapResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `You are an integration architecture advisor. Analyse the user's described platform landscape and map how data flows between systems.

Platforms: "${platforms}"
${concerns ? `Concerns: "${concerns}"` : ""}

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "connections": [{"from": "Platform A", "to": "Platform B", "dataFlow": "What data moves", "method": "API/webhook/sync/etc"}],
  "weakPoints": [{"description": "What could fail", "severity": "critical|warning|info", "recommendation": "How to address it"}],
  "overallAssessment": "Summary of the integration landscape health",
  "recommendations": ["Improvement suggestion 1", "Suggestion 2"],
  "nextStepSuggestion": "What to do next",
  "nextStepToolId": "integration-setup",
  "nextStepDescription": "Brief description of why this tool helps next"
}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = connectionMapSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error(`Failed to parse Claude response: ${text}`);
  return parsed.data;
}

// --- Integration Setup ---

const integrationSetupSchema = z.object({
  prerequisites: z.array(z.string()),
  steps: z.array(z.object({
    step: z.number(),
    title: z.string(),
    description: z.string(),
    platform: z.string(),
  })),
  verificationSteps: z.array(z.string()),
  commonPitfalls: z.array(z.object({
    issue: z.string(),
    prevention: z.string(),
  })),
  estimatedTime: z.string(),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type IntegrationSetupResult = z.infer<typeof integrationSetupSchema>;

export async function getIntegrationSetup(
  platformA: string,
  platformB: string,
  goal?: string,
  personaInstruction?: string
): Promise<IntegrationSetupResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are an integration setup expert. Guide the user through connecting two platforms together with clear, step-by-step instructions.

Connect: "${platformA}" to "${platformB}"
${goal ? `Goal: "${goal}"` : ""}

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "prerequisites": ["What you need before starting"],
  "steps": [{"step": 1, "title": "Step title", "description": "Detailed instructions", "platform": "Which platform this step is on"}],
  "verificationSteps": ["How to verify the connection works"],
  "commonPitfalls": [{"issue": "Common problem", "prevention": "How to avoid it"}],
  "estimatedTime": "Approximate setup time",
  "nextStepSuggestion": "What to do next",
  "nextStepToolId": "webhook-builder",
  "nextStepDescription": "Brief description of why this tool helps next"
}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = integrationSetupSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error(`Failed to parse Claude response: ${text}`);
  return parsed.data;
}

// --- Webhook Builder ---

const webhookBuilderSchema = z.object({
  sourceSetup: z.object({
    steps: z.array(z.string()),
    webhookUrl: z.string(),
    authentication: z.string(),
  }),
  targetSetup: z.object({
    steps: z.array(z.string()),
    endpointCode: z.string().optional(),
  }),
  payloadFormat: z.object({
    description: z.string(),
    exampleFields: z.array(z.object({ field: z.string(), description: z.string() })),
  }),
  testing: z.array(z.string()),
  securityNotes: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type WebhookBuilderResult = z.infer<typeof webhookBuilderSchema>;

export async function getWebhookSetup(
  sourceApp: string,
  targetApp: string,
  events?: string,
  personaInstruction?: string
): Promise<WebhookBuilderResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are a webhook integration specialist. Help the user set up event-driven communication between two applications.

Source (sends events): "${sourceApp}"
Target (receives events): "${targetApp}"
${events ? `Events to handle: "${events}"` : ""}

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "sourceSetup": {"steps": ["Step 1", "Step 2"], "webhookUrl": "Example webhook URL pattern", "authentication": "How auth works"},
  "targetSetup": {"steps": ["Step 1", "Step 2"], "endpointCode": "// Optional example endpoint code"},
  "payloadFormat": {"description": "What the webhook payload looks like", "exampleFields": [{"field": "field_name", "description": "What this field contains"}]},
  "testing": ["How to test the webhook"],
  "securityNotes": ["Security best practice"],
  "nextStepSuggestion": "What to do next",
  "nextStepToolId": "troubleshooter",
  "nextStepDescription": "Brief description of why this tool helps next"
}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = webhookBuilderSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error(`Failed to parse Claude response: ${text}`);
  return parsed.data;
}

// --- Auth Guide ---

const authGuideSchema = z.object({
  authMethod: z.string(),
  steps: z.array(z.object({
    step: z.number(),
    title: z.string(),
    description: z.string(),
  })),
  securityTips: z.array(z.string()),
  testingSteps: z.array(z.string()),
  commonErrors: z.array(z.object({
    error: z.string(),
    fix: z.string(),
  })),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type AuthGuideResult = z.infer<typeof authGuideSchema>;

export async function getAuthGuide(
  service: string,
  purpose?: string,
  personaInstruction?: string
): Promise<AuthGuideResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `You are an API authentication expert. Help the user understand and set up authentication for a specific service. Cover the auth method (API key, OAuth 2.0, JWT, etc.), step-by-step credential setup, and security best practices.

Service: "${service}"
${purpose ? `Purpose: "${purpose}"` : ""}

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "authMethod": "The authentication method used (e.g. OAuth 2.0, API Key, JWT)",
  "steps": [{"step": 1, "title": "Step title", "description": "Detailed instructions"}],
  "securityTips": ["Security best practice"],
  "testingSteps": ["How to verify auth works"],
  "commonErrors": [{"error": "Common auth error", "fix": "How to fix it"}],
  "nextStepSuggestion": "What to do next",
  "nextStepToolId": "integration-setup",
  "nextStepDescription": "Brief description of why this tool helps next"
}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = authGuideSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error(`Failed to parse Claude response: ${text}`);
  return parsed.data;
}

// --- Workflow Builder ---

const workflowBuilderSchema = z.object({
  trigger: z.object({
    event: z.string(),
    platform: z.string(),
    conditions: z.array(z.string()),
  }),
  steps: z.array(z.object({
    step: z.number(),
    action: z.string(),
    platform: z.string(),
    details: z.string(),
    errorHandling: z.string(),
  })),
  implementationOptions: z.array(z.object({
    method: z.string(),
    description: z.string(),
    complexity: z.enum(["low", "medium", "high"]),
    cost: z.string(),
  })),
  estimatedSetupTime: z.string(),
  considerations: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type WorkflowBuilderResult = z.infer<typeof workflowBuilderSchema>;

export async function getWorkflow(
  description: string,
  platforms?: string,
  personaInstruction?: string
): Promise<WorkflowBuilderResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are an automation workflow designer. Help the user design a multi-step workflow that connects their apps. Consider both no-code (Zapier, Make, n8n) and code-based approaches.

Workflow: "${description}"
${platforms ? `Platforms: "${platforms}"` : ""}

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "trigger": {"event": "What starts the workflow", "platform": "Where the trigger happens", "conditions": ["When to run"]},
  "steps": [{"step": 1, "action": "What happens", "platform": "Where", "details": "How", "errorHandling": "What if it fails"}],
  "implementationOptions": [{"method": "Zapier/Make/Custom code", "description": "How to implement", "complexity": "low|medium|high", "cost": "Free/£X/month"}],
  "estimatedSetupTime": "How long to set up",
  "considerations": ["Important things to know"],
  "nextStepSuggestion": "What to do next",
  "nextStepToolId": "webhook-builder",
  "nextStepDescription": "Brief description of why this tool helps next"
}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = workflowBuilderSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error(`Failed to parse Claude response: ${text}`);
  return parsed.data;
}

// --- Troubleshooter ---

const troubleshooterSchema = z.object({
  likelyCause: z.object({
    category: z.enum(["auth", "webhook", "mapping", "rate_limit", "service_outage", "configuration", "other"]),
    explanation: z.string(),
    confidence: z.enum(["high", "medium", "low"]),
  }),
  diagnosticSteps: z.array(z.object({
    step: z.number(),
    check: z.string(),
    expectedResult: z.string(),
    ifFails: z.string(),
  })),
  fixSteps: z.array(z.string()),
  preventionTips: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type TroubleshooterResult = z.infer<typeof troubleshooterSchema>;

export async function troubleshootIntegration(
  problem: string,
  platforms?: string,
  recentChanges?: string,
  personaInstruction?: string
): Promise<TroubleshooterResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are an integration troubleshooting expert. Diagnose the user's integration problem through a guided diagnostic approach. Identify the most likely root cause category and provide step-by-step fix instructions.

Problem: "${problem}"
${platforms ? `Platforms involved: "${platforms}"` : ""}
${recentChanges ? `Recent changes: "${recentChanges}"` : ""}

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "likelyCause": {"category": "auth|webhook|mapping|rate_limit|service_outage|configuration|other", "explanation": "What likely went wrong", "confidence": "high|medium|low"},
  "diagnosticSteps": [{"step": 1, "check": "What to check", "expectedResult": "What you should see", "ifFails": "What to do if this check fails"}],
  "fixSteps": ["Step-by-step fix instructions"],
  "preventionTips": ["How to prevent this in future"],
  "nextStepSuggestion": "What to do next",
  "nextStepToolId": "connection-health-check",
  "nextStepDescription": "Brief description of why this tool helps next"
}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = troubleshooterSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error(`Failed to parse Claude response: ${text}`);
  return parsed.data;
}

// --- What Changed ---

const whatChangedSchema = z.object({
  affectedIntegrations: z.array(z.object({
    integration: z.string(),
    impact: z.enum(["breaking", "degraded", "cosmetic", "none"]),
    description: z.string(),
  })),
  priorityOrder: z.array(z.object({
    item: z.string(),
    urgency: z.enum(["immediate", "soon", "when_convenient"]),
    effort: z.string(),
  })),
  migrationSteps: z.array(z.string()),
  workarounds: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type WhatChangedResult = z.infer<typeof whatChangedSchema>;

export async function analyseChange(
  change: string,
  currentSetup?: string,
  personaInstruction?: string
): Promise<WhatChangedResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are a change impact analyst for software integrations. The user is describing an external change (API update, platform deprecation, regulation change, etc.). Analyse which integrations are affected, what breaks, and what needs updating.

Change: "${change}"
${currentSetup ? `Current setup: "${currentSetup}"` : ""}

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "affectedIntegrations": [{"integration": "What's affected", "impact": "breaking|degraded|cosmetic|none", "description": "How it's affected"}],
  "priorityOrder": [{"item": "What to fix", "urgency": "immediate|soon|when_convenient", "effort": "Low/Medium/High"}],
  "migrationSteps": ["Step-by-step migration instructions"],
  "workarounds": ["Temporary workaround if available"],
  "nextStepSuggestion": "What to do next",
  "nextStepToolId": "upgrade-assistant",
  "nextStepDescription": "Brief description of why this tool helps next"
}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = whatChangedSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error(`Failed to parse Claude response: ${text}`);
  return parsed.data;
}
