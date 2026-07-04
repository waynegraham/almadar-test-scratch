"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CitationStyle = "chicago" | "mla" | "apa" | "harvard";
type CitationLocale = "en" | "ar";

export type CitationModalData = {
  title: Record<CitationLocale, string | null | undefined>;
  creators: Record<CitationLocale, string[]>;
  date: Record<CitationLocale, string | number | null | undefined>;
  institution: Record<CitationLocale, string | null | undefined>;
  gallery: Record<CitationLocale, string | null | undefined>;
  iabCode?: string | null;
};

type CitationModalProps = {
  work: CitationModalData;
};

const styleLabels: Array<{ id: CitationStyle; label: string }> = [
  { id: "chicago", label: "Chicago" },
  { id: "mla", label: "MLA" },
  { id: "apa", label: "APA" },
  { id: "harvard", label: "Harvard" },
];

const localeLabels: Array<{ id: CitationLocale; label: string }> = [
  { id: "en", label: "English" },
  { id: "ar", label: "Arabic" },
];

function clean(value?: string | number | null) {
  if (value === null || value === undefined) {
    return undefined;
  }

  const text = String(value).replace(/\s+/g, " ").trim();

  return text || undefined;
}

function sentence(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(". ").replace(/\.+$/u, "") + ".";
}

function titleFor(work: CitationModalData, locale: CitationLocale) {
  return clean(work.title[locale]) ?? clean(work.title.en) ?? "Untitled work";
}

function dateFor(work: CitationModalData, locale: CitationLocale) {
  return clean(work.date[locale]) ?? clean(work.date.en);
}

function holdingFor(work: CitationModalData, locale: CitationLocale) {
  return (
    clean(work.institution[locale]) ??
    clean(work.gallery[locale]) ??
    clean(work.institution.en) ??
    clean(work.gallery.en)
  );
}

function creatorsFor(work: CitationModalData, locale: CitationLocale) {
  const localized = work.creators[locale].map(clean).filter(Boolean) as string[];

  if (localized.length > 0) {
    return localized.join(", ");
  }

  const english = work.creators.en.map(clean).filter(Boolean) as string[];

  return english.join(", ") || undefined;
}

function currentDateLabel() {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function currentYear(value?: string) {
  const match = value?.match(/\b\d{3,4}\b/u);

  return match?.[0] ?? "n.d.";
}

function citationFor({
  work,
  locale,
  style,
  url,
}: {
  work: CitationModalData;
  locale: CitationLocale;
  style: CitationStyle;
  url: string;
}) {
  const title = titleFor(work, locale);
  const creators = creatorsFor(work, locale);
  const date = dateFor(work, locale);
  const holding = holdingFor(work, locale);
  const code = clean(work.iabCode);
  const accessed = currentDateLabel();

  if (style === "mla") {
    return sentence([
      creators,
      `"${title}"`,
      holding,
      date,
      code ? `IAB Code ${code}` : undefined,
      "Almadar Works Viewer",
      url,
      `Accessed ${accessed}`,
    ]);
  }

  if (style === "apa") {
    const author = creators ?? "Almadar";
    const year = currentYear(date);

    return sentence([
      `${author} (${year})`,
      `${title} [Work]`,
      holding,
      code ? `IAB Code ${code}` : undefined,
      url,
    ]);
  }

  if (style === "harvard") {
    const author = creators ?? "Almadar";
    const year = currentYear(date);

    return sentence([
      `${author} ${year}`,
      title,
      holding,
      code ? `IAB Code ${code}` : undefined,
      `viewed ${accessed}`,
      `<${url}>`,
    ]);
  }

  return sentence([
    creators,
    title,
    date,
    holding,
    code ? `IAB Code ${code}` : undefined,
    `Accessed ${accessed}`,
    url,
  ]);
}

export function CitationModal({ work }: CitationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [style, setStyle] = useState<CitationStyle>("chicago");
  const [locale, setLocale] = useState<CitationLocale>(() => {
    if (typeof document === "undefined") {
      return "en";
    }

    return document.documentElement.lang.toLowerCase().startsWith("ar")
      ? "ar"
      : "en";
  });
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [url] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.location.href;
  });
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const citation = useMemo(
    () => citationFor({ work, locale, style, url }),
    [locale, style, url, work],
  );

  const copyCitation = async () => {
    setCopyStatus("idle");

    try {
      await navigator.clipboard.writeText(citation);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setCopyStatus("idle");
        }}
        className="flex h-10 items-center justify-center border border-stone-900 bg-stone-900 px-4 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
      >
        Cite
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 px-4 py-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="citation-title"
            className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-xl ring-1 ring-stone-900/10"
          >
            <header className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
              <div>
                <h2 id="citation-title" className="text-lg font-semibold">
                  Citation
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  {titleFor(work, locale)}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close citation modal"
                className="flex h-9 w-9 shrink-0 items-center justify-center border border-stone-300 text-xl leading-none text-stone-700 transition-colors hover:border-stone-900 hover:bg-stone-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                x
              </button>
            </header>

            <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">
                    Style
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {styleLabels.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setStyle(item.id);
                          setCopyStatus("idle");
                        }}
                        className={
                          item.id === style
                            ? "border border-stone-900 bg-stone-900 px-3 py-2 text-sm font-medium text-white"
                            : "border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-stone-900"
                        }
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">
                    Locale
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {localeLabels.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setLocale(item.id);
                          setCopyStatus("idle");
                        }}
                        className={
                          item.id === locale
                            ? "border border-stone-900 bg-stone-900 px-3 py-2 text-sm font-medium text-white"
                            : "border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-stone-900"
                        }
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">
                  Output
                </p>
                <div
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  className="min-h-32 whitespace-pre-wrap border border-stone-300 bg-stone-50 p-4 text-sm leading-7 text-stone-900"
                >
                  {citation}
                </div>
              </div>
            </div>

            <footer className="flex flex-col gap-3 border-t border-stone-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-stone-600" aria-live="polite">
                {copyStatus === "copied"
                  ? "Copied to clipboard."
                  : copyStatus === "failed"
                    ? "Copy failed. Select the citation text to copy it."
                    : " "}
              </p>
              <button
                type="button"
                onClick={copyCitation}
                className="flex h-10 items-center justify-center border border-stone-900 bg-stone-900 px-4 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                Copy
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
