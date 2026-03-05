import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950">
      <Spinner />
    </main>
  );
}
