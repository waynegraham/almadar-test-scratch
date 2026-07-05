"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type RichTextNode = {
  type?: string;
  text?: string;
  children?: RichTextNode[];
};

const sampleInput = JSON.stringify(
  [
    {
      type: "paragraph",
      children: [
        {
          text: "Established in Tashkent in AH 1361/1943 CE, the Abu Rayhan Beruni Institute of Oriental Studies, Uzbekistan Academy of Sciences promotes worldwide scholarship and learning through its extensive manuscript collection, which UNESCO placed on the Register of Cultural Heritage in AH 1420/2000 CE.",
          type: "text",
        },
      ],
    },
    {
      type: "paragraph",
      children: [
        {
          text: "The institute is home to an estimated 26,000 manuscripts, with an even larger number of lithographed and printed books.",
          type: "text",
        },
      ],
    },
  ],
  null,
  2,
);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textFromNode(node: RichTextNode): string {
  if (typeof node.text === "string") {
    return node.text;
  }

  if (Array.isArray(node.children)) {
    return node.children.map(textFromNode).join("");
  }

  return "";
}

function normalizeNodes(value: unknown): RichTextNode[] {
  if (Array.isArray(value)) {
    return value as RichTextNode[];
  }

  if (value && typeof value === "object" && "children" in value) {
    const children = (value as RichTextNode).children;

    if (Array.isArray(children)) {
      return children;
    }
  }

  throw new Error("Expected a JSON array of rich text blocks.");
}

function htmlFromStructuredContent(input: string) {
  if (!input.trim()) {
    return "";
  }

  const nodes = normalizeNodes(JSON.parse(input) as unknown);

  return nodes
    .map((node) => {
      const text = escapeHtml(textFromNode(node).trim());
      return `<p>${text || "&nbsp;"}</p>`;
    })
    .join("\n");
}

export default function HtmlConverterPage() {
  const [input, setInput] = useState(sampleInput);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    try {
      return {
        html: htmlFromStructuredContent(input),
        error: undefined,
      };
    } catch (caught) {
      return {
        html: "",
        error:
          caught instanceof Error
            ? caught.message
            : "Unable to convert this content.",
      };
    }
  }, [input]);

  async function copyHtml() {
    if (!result.html) {
      return;
    }

    await navigator.clipboard.writeText(result.html);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-stone-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 border-b border-stone-300 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-stone-600 underline-offset-4 hover:text-stone-950 hover:underline"
            >
              Back to collection
            </Link>
            <p className="mt-5 text-sm font-medium uppercase tracking-[0.12em] text-stone-600">
              Content utility
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-950 sm:text-4xl">
              Structured content to CKEditor HTML
            </h1>
          </div>
          <button
            type="button"
            onClick={copyHtml}
            disabled={!result.html || Boolean(result.error)}
            className="w-fit border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition-colors hover:border-stone-900 hover:bg-stone-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400 disabled:hover:border-stone-200 disabled:hover:bg-stone-100"
          >
            {copied ? "Copied" : "Copy HTML"}
          </button>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="flex min-h-[34rem] flex-col border border-stone-300 bg-white">
            <div className="border-b border-stone-300 px-4 py-3">
              <h2 className="text-base font-semibold">Structured JSON</h2>
            </div>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              spellCheck={false}
              className="min-h-[28rem] flex-1 resize-y bg-white p-4 font-mono text-sm leading-6 text-stone-900 outline-none focus:ring-2 focus:ring-inset focus:ring-stone-900"
              aria-label="Structured JSON input"
            />
          </section>

          <section className="flex min-h-[34rem] flex-col border border-stone-300 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-stone-300 px-4 py-3">
              <h2 className="text-base font-semibold">Plain HTML</h2>
              {result.error ? (
                <span className="text-sm font-medium text-amber-800">
                  Needs valid JSON
                </span>
              ) : null}
            </div>
            {result.error ? (
              <div className="border-b border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                {result.error}
              </div>
            ) : null}
            <textarea
              readOnly
              value={result.html}
              spellCheck={false}
              className="min-h-[28rem] flex-1 resize-y bg-stone-50 p-4 font-mono text-sm leading-6 text-stone-900 outline-none focus:ring-2 focus:ring-inset focus:ring-stone-900"
              aria-label="Generated plain HTML"
            />
          </section>
        </div>
      </section>
    </main>
  );
}
