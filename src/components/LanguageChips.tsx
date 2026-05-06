import { cn } from "@/lib/utils";

export type Language = "en" | "fr" | "fil";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "fil", label: "Filipino" },
];

interface LanguageChipsProps {
  value: Language;
  onChange: (lang: Language) => void;
  className?: string;
}

export const LanguageChips = ({ value, onChange, className }: LanguageChipsProps) => {
  return (
    <div className={cn("flex items-center gap-1 rounded-full bg-muted/60 p-1", className)}>
      {LANGUAGES.map((lang) => {
        const active = value === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => onChange(lang.code)}
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-full transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            aria-pressed={active}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
};

// Mock translation utility for prototype/testing
const PHRASE_MAP: Record<Exclude<Language, "en">, Array<[RegExp, string]>> = {
  fr: [
    [/\bHello\b/gi, "Bonjour"],
    [/\bHi\b/gi, "Salut"],
    [/\bThank you\b/gi, "Merci"],
    [/\bPlease\b/gi, "S'il vous plaît"],
    [/\bpolicy\b/gi, "politique"],
    [/\bpolicies\b/gi, "politiques"],
    [/\bemployee\b/gi, "employé"],
    [/\bleave\b/gi, "congé"],
    [/\bremote work\b/gi, "télétravail"],
    [/\brequest\b/gi, "demande"],
    [/\bapprove(d)?\b/gi, "approuvé"],
    [/\bmanager\b/gi, "responsable"],
    [/\bbenefits\b/gi, "avantages"],
    [/\breview\b/gi, "évaluation"],
    [/\byes\b/gi, "oui"],
    [/\bno\b/gi, "non"],
  ],
  fil: [
    [/\bHello\b/gi, "Kumusta"],
    [/\bHi\b/gi, "Hi"],
    [/\bThank you\b/gi, "Salamat"],
    [/\bPlease\b/gi, "Pakiusap"],
    [/\bpolicy\b/gi, "patakaran"],
    [/\bpolicies\b/gi, "mga patakaran"],
    [/\bemployee\b/gi, "empleyado"],
    [/\bleave\b/gi, "bakasyon"],
    [/\bremote work\b/gi, "remote na trabaho"],
    [/\brequest\b/gi, "kahilingan"],
    [/\bmanager\b/gi, "tagapamahala"],
    [/\bbenefits\b/gi, "benepisyo"],
    [/\breview\b/gi, "pagsusuri"],
    [/\byes\b/gi, "oo"],
    [/\bno\b/gi, "hindi"],
  ],
};

const LANG_LABEL: Record<Language, string> = {
  en: "English",
  fr: "Français",
  fil: "Filipino",
};

export const translateText = (text: string, lang: Language): string => {
  if (lang === "en" || !text) return text;
  let out = text;
  for (const [pattern, replacement] of PHRASE_MAP[lang]) {
    out = out.replace(pattern, replacement);
  }
  return `_[${LANG_LABEL[lang]}]_\n\n${out}`;
};
