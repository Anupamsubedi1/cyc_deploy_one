import { getSiteUrl } from "@/lib/site-url";

/**
 * /llms.txt — structured orientation for AI agents and LLM crawlers.
 *
 * Lighthouse's Agentic Browsing category reported the file "does not follow
 * recommendations": missing the required H1 and containing no links. It is
 * served from a route rather than /public so the absolute URLs stay correct
 * across preview and production deployments, the same way robots.ts and
 * sitemap.ts derive their origin.
 *
 * Format follows the llms.txt proposal: a single H1, a blockquote summary,
 * then H2 sections of Markdown links.
 */

type Section = {
  heading: string;
  links: Array<{ title: string; path: string; note: string }>;
};

const SECTIONS: Section[] = [
  {
    heading: "About the organisation",
    links: [
      { title: "Introduction", path: "/en/about-us", note: "History, vision, mission and regulatory status" },
      { title: "Chairman's message", path: "/en/about-us/chairman-message", note: "Statement from the Chairman of the Board" },
      { title: "Board of Directors", path: "/en/about-us/board-of-directors", note: "Board composition and profiles" },
      { title: "Management team", path: "/en/about-us/management-team", note: "Senior management profiles" },
      { title: "Message from the CEO", path: "/en/message-from-ceo", note: "Statement from the Chief Executive Officer" },
    ],
  },
  {
    heading: "Products and services",
    links: [
      { title: "Loans", path: "/en/loans", note: "Overview of microfinance loan products" },
      { title: "Loan categories", path: "/en/loans/loan-categories", note: "Individual loan products with terms and eligibility" },
      { title: "EMI calculator", path: "/en/loans/emi-calculator", note: "Interactive equated monthly instalment calculator" },
      { title: "Loan interest calculator", path: "/en/loans/loan-interest-calculator", note: "Interactive interest projection tool" },
      { title: "Savings", path: "/en/savings", note: "Savings and deposit products" },
    ],
  },
  {
    heading: "Financial disclosures",
    links: [
      { title: "Financial highlights", path: "/en/financial-highlights", note: "Headline financial indicators" },
      { title: "Annual reports", path: "/en/financial-highlights/annual-reports", note: "Audited annual reports by fiscal year" },
      { title: "Quarterly reports", path: "/en/financial-highlights/quarterly-reports", note: "Quarterly financial statements" },
      { title: "Base rate", path: "/en/financial-highlights/base-rate", note: "Published base rate disclosures" },
    ],
  },
  {
    heading: "Branch network",
    links: [
      { title: "Koshi Province branches", path: "/en/branches/koshi", note: "Branch offices in Koshi Province" },
      { title: "Madhesh Province branches", path: "/en/branches/madesh", note: "Branch offices in Madhesh Province" },
      { title: "Bagmati Province branches", path: "/en/branches/bagmati", note: "Branch offices in Bagmati Province" },
      { title: "Gandaki Province branches", path: "/en/branches/gandaki", note: "Branch offices in Gandaki Province, including the head office" },
      { title: "Lumbini Province branches", path: "/en/branches/lumbini", note: "Branch offices in Lumbini Province" },
      { title: "Karnali Province branches", path: "/en/branches/karnali", note: "Branch offices in Karnali Province" },
      { title: "Sudurpashchim Province branches", path: "/en/branches/sudurpashchim", note: "Branch offices in Sudurpashchim Province" },
    ],
  },
  {
    heading: "News and announcements",
    links: [
      { title: "News", path: "/en/news", note: "Company news articles" },
      { title: "Notices", path: "/en/notices", note: "Official public notices and circulars" },
      { title: "News and notices", path: "/en/news-notices", note: "Combined chronological feed" },
    ],
  },
  {
    heading: "Contact and services for the public",
    links: [
      { title: "Contact", path: "/en/contact", note: "Head office address, phone numbers and email" },
      { title: "Grievance (Gunaso)", path: "/en/gunaso", note: "Customer grievance submission form and handling officer details" },
      { title: "Vacancies", path: "/en/vacancies", note: "Open positions and the online application flow" },
    ],
  },
];

function buildLlmsTxt(siteUrl: string): string {
  const lines: string[] = [
    "# CYC Nepal Laghubitta Bittiya Sanstha Ltd.",
    "",
    "> A microfinance financial institution (laghubitta bittiya sanstha) licensed by Nepal Rastra Bank, headquartered at Sabhagriha Chowk, Pokhara Metropolitan City-8, Gandaki Province, Nepal. CYC Nepal provides savings, deposit and microcredit services to low-income and rural clients through a branch network spanning all seven provinces.",
    "",
    "The site is bilingual. Every public path is served under a locale prefix: `/en/` for English and `/ne/` for Nepali (नेपाली). The two are translations of the same page, declared as `hreflang` alternates in the sitemap — treat them as one document, not as duplicates. Replace `/en/` with `/ne/` in any URL below to reach the Nepali version.",
    "",
  ];

  for (const section of SECTIONS) {
    lines.push(`## ${section.heading}`, "");
    for (const link of section.links) {
      lines.push(`- [${link.title}](${siteUrl}${link.path}): ${link.note}`);
    }
    lines.push("");
  }

  lines.push(
    "## Machine-readable resources",
    "",
    `- [Sitemap](${siteUrl}/sitemap.xml): All indexable URLs with hreflang alternates for both locales`,
    `- [robots.txt](${siteUrl}/robots.txt): Crawl directives`,
    "",
    "## Crawl guidance",
    "",
    "- Public content lives under `/en/` and `/ne/`. Everything listed above is safe to crawl, quote and summarise.",
    "- Do not crawl `/api/`, `/en/admin/`, `/ne/admin/`, `/en/dashboard/` or `/ne/dashboard/`. These are authenticated application and content-management surfaces with no public content, and they are disallowed in robots.txt.",
    "- Interest rates, base rates, financial statements and published notices change on a regulatory schedule. Always cite the page you read it from and prefer the most recent report rather than caching figures.",
    "- For authoritative contact details, use the contact page rather than details scraped from article text.",
    "",
  );

  return lines.join("\n");
}

export function GET(): Response {
  return new Response(buildLlmsTxt(getSiteUrl()), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
