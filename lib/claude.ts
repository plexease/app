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
