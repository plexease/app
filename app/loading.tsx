import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-950">
      <Spinner />
    </main>
  );
}
