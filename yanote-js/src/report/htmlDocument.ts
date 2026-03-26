export type HtmlSection = {
  id: string;
  title: string;
  summary?: string;
  content: string;
};

export type HtmlDefinition = {
  term: string;
  description: string;
};

export type HtmlMetric = {
  label: string;
  value: string;
  note?: string;
};

const DOCUMENT_STYLES = `
:root {
  color-scheme: light;
  --bg: #ffffff;
  --surface: #f6f8fc;
  --surface-strong: #eaf0fb;
  --text: #142033;
  --muted: #4c5971;
  --border: #c9d3e4;
  --accent: #005fcc;
  --good-bg: #e7f6eb;
  --good-text: #0f5d2d;
  --warn-bg: #fff4d6;
  --warn-text: #7b5300;
  --bad-bg: #fbe7ea;
  --bad-text: #8a1d32;
  --neutral-bg: #edf1f7;
  --neutral-text: #344056;
}

* {
  box-sizing: border-box;
}

html {
  background: var(--bg);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.5;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
}

main,
header,
footer,
nav {
  width: min(76rem, calc(100% - 2rem));
  margin-inline: auto;
}

header,
nav,
main,
footer {
  padding-block: 1rem;
}

header {
  padding-top: 2.5rem;
}

footer {
  padding-bottom: 3rem;
  color: var(--muted);
}

section {
  margin-block: 1.25rem;
  padding: 1.25rem;
  border: 1px solid var(--border);
  border-radius: 1rem;
  background: var(--surface);
}

a {
  color: var(--accent);
}

a:focus-visible,
summary:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.skip-link {
  position: absolute;
  left: 1rem;
  top: -3rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: #111827;
  color: #ffffff;
  text-decoration: none;
  z-index: 10;
}

.skip-link:focus {
  top: 1rem;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: var(--muted);
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.page-title {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.75rem);
  line-height: 1.15;
}

.page-summary,
.section-summary,
.muted {
  color: var(--muted);
}

.section-summary {
  margin-top: 0.5rem;
}

.section-title {
  margin: 0;
  font-size: 1.5rem;
}

.in-page-nav ul,
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.in-page-nav a {
  display: inline-flex;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  text-decoration: none;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.metric-card {
  padding: 0.9rem;
  border: 1px solid var(--border);
  border-radius: 0.9rem;
  background: var(--bg);
}

.metric-label {
  display: block;
  color: var(--muted);
  font-size: 0.95rem;
}

.metric-value {
  display: block;
  margin-top: 0.25rem;
  font-size: 1.35rem;
  font-weight: 700;
}

.metric-note {
  margin-top: 0.4rem;
  color: var(--muted);
  font-size: 0.92rem;
}

.definition-list {
  display: grid;
  grid-template-columns: minmax(9rem, max-content) 1fr;
  gap: 0.6rem 1rem;
  margin: 0;
}

.definition-list dt {
  font-weight: 700;
}

.definition-list dd {
  margin: 0;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.95em;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg);
}

caption {
  padding-bottom: 0.75rem;
  text-align: left;
  font-weight: 700;
}

th,
 td {
  padding: 0.7rem;
  border: 1px solid var(--border);
  vertical-align: top;
  text-align: left;
}

thead th {
  background: var(--surface-strong);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-weight: 700;
  font-size: 0.9rem;
}

.status-pill--good {
  background: var(--good-bg);
  color: var(--good-text);
}

.status-pill--warn {
  background: var(--warn-bg);
  color: var(--warn-text);
}

.status-pill--bad {
  background: var(--bad-bg);
  color: var(--bad-text);
}

.status-pill--neutral {
  background: var(--neutral-bg);
  color: var(--neutral-text);
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg);
}

.stack {
  display: grid;
  gap: 1rem;
}

.cell-stack {
  display: grid;
  gap: 0.35rem;
}

@media (max-width: 48rem) {
  header,
  nav,
  main,
  footer {
    width: min(76rem, calc(100% - 1rem));
  }

  section {
    padding: 1rem;
  }

  .definition-list {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

export function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderCode(value: string): string {
  return `<code>${escapeHtml(value)}</code>`;
}

export function formatNumber(value: number | null | undefined): string {
  return typeof value === "number" ? String(value) : "N/A";
}

export function formatPercent(value: number | null | undefined): string {
  return typeof value === "number" ? `${String(value)}%` : "N/A";
}

export function renderStatusPill(value: string): string {
  const lowered = value.toLowerCase();
  const tone =
    lowered === "ok" ||
    lowered === "covered" ||
    lowered === "satisfied" ||
    lowered === "valid"
      ? "good"
      : lowered === "partial" ||
          lowered === "optional" ||
          lowered === "clear" ||
          lowered === "unavailable"
        ? "warn"
        : lowered === "invalid" ||
            lowered === "uncovered" ||
            lowered === "missing" ||
            lowered === "unsupported"
          ? "bad"
          : "neutral";

  return `<span class="status-pill status-pill--${tone}">${escapeHtml(value)}</span>`;
}

export function renderDefinitionList(items: HtmlDefinition[]): string {
  return `<dl class="definition-list">${items
    .map((item) => `<dt>${escapeHtml(item.term)}</dt><dd>${item.description}</dd>`)
    .join("")}</dl>`;
}

export function renderMetricGrid(items: HtmlMetric[]): string {
  return `<ul class="metric-grid">${items
    .map(
      (item) =>
        `<li class="metric-card"><span class="metric-label">${escapeHtml(item.label)}</span><span class="metric-value">${item.value}</span>${
          item.note ? `<div class="metric-note">${item.note}</div>` : ""
        }</li>`
    )
    .join("")}</ul>`;
}

export function renderChipList(values: string[], emptyLabel = "None"): string {
  const items = values.length > 0 ? values : [emptyLabel];
  return `<ul class="chip-list">${items
    .map((value) => `<li class="chip">${escapeHtml(value)}</li>`)
    .join("")}</ul>`;
}

export function renderTable(input: {
  caption: string;
  headers: string[];
  rows: string[][];
  emptyMessage?: string;
}): string {
  const rows =
    input.rows.length > 0
      ? input.rows
          .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
          .join("")
      : `<tr><td colspan="${input.headers.length}">${escapeHtml(input.emptyMessage ?? "No rows.")}</td></tr>`;

  return `<div class="table-wrap"><table><caption>${escapeHtml(input.caption)}</caption><thead><tr>${input.headers
    .map((header) => `<th scope="col">${escapeHtml(header)}</th>`)
    .join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function renderStack(blocks: string[]): string {
  return `<div class="stack">${blocks.join("")}</div>`;
}

export function renderHtmlDocument(input: {
  title: string;
  heading: string;
  summary: string;
  sections: HtmlSection[];
}): string {
  const navItems = input.sections
    .map((section) => `<li><a href="#${section.id}">${escapeHtml(section.title)}</a></li>`)
    .join("");

  const sections = input.sections
    .map(
      (section) =>
        `<section id="${section.id}" aria-labelledby="${section.id}-title"><h2 id="${section.id}-title" class="section-title">${escapeHtml(
          section.title
        )}</h2>${section.summary ? `<p class="section-summary">${escapeHtml(section.summary)}</p>` : ""}${section.content}</section>`
    )
    .join("");

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${escapeHtml(input.title)}</title>`,
    `  <style>${DOCUMENT_STYLES}</style>`,
    "</head>",
    "<body>",
    '  <a class="skip-link" href="#main-content">Skip to main content</a>',
    "  <header>",
    '    <p class="eyebrow">Yanote static report</p>',
    `    <h1 class="page-title">${escapeHtml(input.heading)}</h1>`,
    `    <p class="page-summary">${escapeHtml(input.summary)}</p>`,
    "  </header>",
    '  <nav class="in-page-nav" aria-label="Report sections">',
    `    <ul>${navItems}</ul>`,
    "  </nav>",
    '  <main id="main-content" tabindex="-1">',
    `    ${sections}`,
    "  </main>",
    "  <footer>",
    "    <p>This self-contained artifact is designed for offline inspection and does not rely on external scripts, styles, fonts, or images.</p>",
    "  </footer>",
    "</body>",
    "</html>",
    ""
  ].join("\n");
}
