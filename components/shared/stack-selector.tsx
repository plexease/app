"use client";

import { useState, useEffect } from "react";
import { STACK_OPTIONS, loadStack, saveStack, type Language, type SelectedStack } from "@/lib/stack-options";

type Props = {
  onChange?: (stack: SelectedStack) => void;
  initialStack?: SelectedStack | null;
};

export function StackSelector({ onChange, initialStack }: Props) {
  const [language, setLanguage] = useState<Language | "">(initialStack?.language ?? "");
  const [framework, setFramework] = useState(initialStack?.framework ?? "");

  // Load from localStorage on mount if no initial provided
  useEffect(() => {
    if (initialStack) return;
    const saved = loadStack();
    if (saved) {
      setLanguage(saved.language);
      setFramework(saved.framework);
      onChange?.(saved);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedLang = STACK_OPTIONS.find((o) => o.id === language);
  const frameworks = selectedLang?.frameworks ?? [];

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    const defaultFramework = STACK_OPTIONS.find((o) => o.id === lang)?.frameworks[0]?.id ?? "";
    setFramework(defaultFramework);
    const stack: SelectedStack = { language: lang, framework: defaultFramework };
    saveStack(stack);
    onChange?.(stack);
  };

  const handleFrameworkChange = (fw: string) => {
    setFramework(fw);
    if (language) {
      const stack: SelectedStack = { language, framework: fw };
      saveStack(stack);
      onChange?.(stack);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <div>
        <label htmlFor="stack-language" className="block text-xs font-medium text-muted-400 mb-1">
          Language
        </label>
        <select
          id="stack-language"
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as Language)}
          className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="" disabled>Select language</option>
          {STACK_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      {frameworks.length > 0 && (
        <div>
          <label htmlFor="stack-framework" className="block text-xs font-medium text-muted-400 mb-1">
            Framework
          </label>
          <select
            id="stack-framework"
            value={framework}
            onChange={(e) => handleFrameworkChange(e.target.value)}
            className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {frameworks.map((fw) => (
              <option key={fw.id} value={fw.id}>{fw.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
