import { redirect } from "next/navigation";

export default function NuGetAdvisorPage() {
  redirect("/tools/package-advisor?language=csharp");
}
