import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type NuGetAdvisorResult = {
  whatItDoes: string;
  alternatives: string[];
  compatibility: string;
  versionAdvice: string;
};

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

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    return JSON.parse(text) as NuGetAdvisorResult;
  } catch {
    throw new Error("Failed to parse Claude response");
  }
}
