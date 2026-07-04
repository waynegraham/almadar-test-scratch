import { IiifViewer } from "@/components/iiif-viewer";
import { CitationModal, type CitationModalData } from "@/components/citation-modal";
import {
  getWorkByIabCode,
  relationItems,
  type LocalizedValue,
  type StrapiAgentCredit,
  type StrapiNamedEntity,
  type StrapiTextBlock,
  type WorkDetail,
  unwrapAttributes,
  workTitle,
} from "@/lib/works";
import Link from "next/link";
import { notFound } from "next/navigation";

type WorkPageParams = Promise<{
  iabCode: string;
}>;

function textValue(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return String(value);
}

function entityName(entity?: StrapiNamedEntity | null): LocalizedValue {
  if (!entity) {
    return {};
  }

  const item = unwrapAttributes(entity);

  return {
    en:
      item.displayTitle ??
      item.nameEn ??
      item.titleEn ??
      item.labelEn ??
      item.slug ??
      undefined,
    ar: item.nameAr ?? item.titleAr ?? item.labelAr ?? undefined,
  };
}

function htmlBlock(value?: string | null) {
  if (!value) {
    return <span className="text-stone-400">-</span>;
  }

  return (
    <div
      className="space-y-3 leading-7 [&_a]:underline [&_em]:italic [&_p]:m-0 [&_strong]:font-semibold"
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
}

function plainBlock(value?: string | number | null) {
  return value ? (
    <span className="whitespace-pre-wrap leading-7">{value}</span>
  ) : (
    <span className="text-stone-400">-</span>
  );
}

function localizedList(values: LocalizedValue[]) {
  const filled = values.filter((value) => value.en || value.ar);

  return {
    en: filled.map((value) => value.en).filter(Boolean).join("\n"),
    ar: filled.map((value) => value.ar).filter(Boolean).join("\n"),
  };
}

function agentInformation(work: WorkDetail) {
  const credits = relationItems(work.agentCredits)
    .map(unwrapAttributes)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return localizedList(
    credits.map((credit: Omit<StrapiAgentCredit, "attributes">) => {
      const agent = entityName(credit.agent);
      const role = entityName(credit.agent_role);

      return {
        en: [role.en, agent.en].filter(Boolean).join(": "),
        ar: [role.ar, agent.ar].filter(Boolean).join(": "),
      };
    }),
  );
}

function citationCreators(work: WorkDetail) {
  const credits = relationItems(work.agentCredits)
    .map(unwrapAttributes)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return credits.reduce(
    (creators, credit: Omit<StrapiAgentCredit, "attributes">) => {
      const agent = entityName(credit.agent);

      if (agent.en) {
        creators.en.push(agent.en);
      }

      if (agent.ar) {
        creators.ar.push(agent.ar);
      }

      return creators;
    },
    { en: [] as string[], ar: [] as string[] },
  );
}

function textBlockValue(block: Omit<StrapiTextBlock, "attributes">): LocalizedValue {
  const labelEn = block.labelEn ?? block.titleEn ?? block.type ?? undefined;
  const labelAr = block.labelAr ?? block.titleAr ?? block.type ?? undefined;
  const bodyEn =
    block.descriptionEn ?? block.textEn ?? block.essayEn ?? block.footnotesEn;
  const bodyAr =
    block.descriptionAr ?? block.textAr ?? block.essayAr ?? block.footnotesAr;

  return {
    en: [labelEn, bodyEn].filter(Boolean).join("\n"),
    ar: [labelAr, bodyAr].filter(Boolean).join("\n"),
  };
}

function textBlockList(blocks?: WorkDetail["additionalDescriptions"]) {
  return localizedList(
    relationItems(blocks)
      .map(unwrapAttributes)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(textBlockValue),
  );
}

function MetadataRow({
  label,
  en,
  ar,
  html = false,
}: {
  label: string;
  en?: string | number | null;
  ar?: string | number | null;
  html?: boolean;
}) {
  return (
    <div className="grid gap-3 border-t border-stone-200 py-4 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-stone-500">
        {label}
      </h2>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-stone-400">
          English
        </p>
        {html ? htmlBlock(textValue(en)) : plainBlock(en)}
      </div>
      <div dir="rtl" className="text-right">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-stone-400">
          العربية
        </p>
        {html ? htmlBlock(textValue(ar)) : plainBlock(ar)}
      </div>
    </div>
  );
}

function metadataRows(work: WorkDetail) {
  const gallery = entityName(work.gallery);
  const institution = entityName(work.institution);
  const agents = agentInformation(work);
  const additionalDescriptions = textBlockList(work.additionalDescriptions);
  const inscriptions = textBlockList(work.inscriptions);
  const stories = textBlockList(work.curatedStories);

  return [
    { label: "Primary IAB Code", en: work.iabCode, ar: work.iabCode },
    { label: "Title", en: work.titleEn, ar: work.titleAr },
    { label: "Gallery", en: gallery.en, ar: gallery.ar },
    { label: "Institution", en: institution.en, ar: institution.ar },
    { label: "Agent information", en: agents.en, ar: agents.ar },
    {
      label: "Gregorian Dates",
      en: work.dateDisplayGregorianEn,
      ar: work.dateDisplayGregorianAr,
    },
    {
      label: "Hijri Dates",
      en: work.dateDisplayHijriEn,
      ar: work.dateDisplayHijriAr,
    },
    { label: "Earliest year", en: work.earliestDate, ar: work.earliestDate },
    { label: "Latest year", en: work.latestDate, ar: work.latestDate },
    { label: "Origin", en: work.originEn, ar: work.originAr },
    { label: "Dimensions", en: work.dimensionEn, ar: work.dimensionAr },
    {
      label: "Material statement",
      en: work.materialDisplayEn,
      ar: work.materialDisplayAr,
    },
    {
      label: "Description",
      en: work.descriptionEn,
      ar: work.descriptionAr,
      html: true,
    },
    { label: "Footnotes", en: work.footnoteEn, ar: work.footnoteAr, html: true },
    {
      label: "Additional typed descriptions",
      en: additionalDescriptions.en,
      ar: additionalDescriptions.ar,
      html: true,
    },
    {
      label: "Inscriptions",
      en: inscriptions.en,
      ar: inscriptions.ar,
      html: true,
    },
    {
      label: "Curated stories",
      en: stories.en,
      ar: stories.ar,
      html: true,
    },
    { label: "Credit line", en: work.creditLineEn, ar: work.creditLineAr },
  ];
}

function citationData(work: WorkDetail): CitationModalData {
  const gallery = entityName(work.gallery);
  const institution = entityName(work.institution);

  return {
    title: {
      en: work.titleEn,
      ar: work.titleAr,
    },
    creators: citationCreators(work),
    date: {
      en: work.dateDisplayGregorianEn ?? work.earliestDate,
      ar: work.dateDisplayGregorianAr ?? work.earliestDate,
    },
    institution: {
      en: institution.en,
      ar: institution.ar,
    },
    gallery: {
      en: gallery.en,
      ar: gallery.ar,
    },
    iabCode: work.iabCode,
  };
}

export default async function WorkPage({ params }: { params: WorkPageParams }) {
  const { iabCode } = await params;
  const decodedIabCode = decodeURIComponent(iabCode);
  const { url, work } = await getWorkByIabCode(decodedIabCode);

  if (!work) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-stone-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-stone-300 pb-6">
          <Link
            href="/"
            className="w-fit text-sm font-medium text-stone-600 underline-offset-4 hover:text-stone-950 hover:underline"
          >
            Back to collection
          </Link>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-sm text-stone-600">{work.iabCode}</p>
              <h1 className="mt-2 text-3xl font-semibold text-stone-950 sm:text-4xl">
                {workTitle(work)}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-stone-600">
                {work.images.length} IIIF image{work.images.length === 1 ? "" : "s"}
              </p>
              <CitationModal work={citationData(work)} />
            </div>
          </div>
        </header>

        <IiifViewer images={work.images} />

        <section className="bg-white px-5 py-2 shadow-sm ring-1 ring-stone-300 sm:px-6">
          {metadataRows(work).map((row) => (
            <MetadataRow key={row.label} {...row} />
          ))}
        </section>

        <details className="border border-stone-300 bg-white p-4 text-sm">
          <summary className="cursor-pointer font-medium">Generated Strapi URL</summary>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block break-all font-mono text-xs text-stone-600 underline-offset-4 hover:text-stone-950 hover:underline"
          >
            {url}
          </a>
        </details>
      </section>
    </main>
  );
}
