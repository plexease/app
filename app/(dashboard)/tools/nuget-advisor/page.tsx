import { redirect } from "next/navigation";

export default function NuGetAdvisorPage() {
  redirect("/tools/tool-finder?language=csharp");
}
