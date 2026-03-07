export function Attribution() {
  return (
    <section className="px-6 py-8 text-center">
      <p className="text-sm text-muted-500">
        Powered by Claude AI from{" "}
        <a
          href="https://www.anthropic.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-400 hover:text-muted-300 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg"
        >
          Anthropic
        </a>
      </p>
    </section>
  );
}
