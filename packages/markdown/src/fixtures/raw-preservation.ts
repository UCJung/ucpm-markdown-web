export interface RawPreservationFixture {
  readonly name: string;
  readonly source: string;
  readonly expectedExport: string;
  readonly expectedRawSources: readonly string[];
}

export const rawPreservationFixtures: readonly RawPreservationFixture[] = [
  {
    name: "raw HTML with CRLF and trailing newline",
    source: "<aside data-kind=\"raw\">\r\n  <p>preserve</p>\r\n</aside>\r\n",
    expectedExport: "<aside data-kind=\"raw\">\r\n  <p>preserve</p>\r\n</aside>",
    expectedRawSources: ["<aside data-kind=\"raw\">\r\n  <p>preserve</p>\r\n</aside>"]
  },
  {
    name: "display math",
    source: "$$\na^2 + b^2\n$$\n",
    expectedExport: "$$\na^2 + b^2\n$$",
    expectedRawSources: ["$$\na^2 + b^2\n$$"]
  },
  {
    name: "directive",
    source: ":::note\nraw directive body\n:::\n",
    expectedExport: ":::note\nraw directive body\n:::",
    expectedRawSources: [":::note\nraw directive body\n:::"]
  },
  {
    name: "unsupported mdast definition block",
    source: "[reference]: https://example.com \"preserve\"\n",
    expectedExport: "[reference]: https://example.com \"preserve\"",
    expectedRawSources: ["[reference]: https://example.com \"preserve\""]
  },
  {
    name: "mixed supported and raw blocks",
    source: "# Supported\n\n<aside>raw</aside>\n\nAfter\n",
    expectedExport: "# Supported\n\n<aside>raw</aside>\n\nAfter\n",
    expectedRawSources: ["<aside>raw</aside>"]
  },
  {
    name: "nested quote directive",
    source: "> :::note\n> nested raw\n> :::\n",
    expectedExport: "> :::note\n> nested raw\n> :::",
    expectedRawSources: ["> :::note\n> nested raw\n> :::"]
  },
  {
    name: "nested list directive",
    source: "- :::note\n  nested raw\n  :::\n",
    expectedExport: "- :::note\n  nested raw\n  :::",
    expectedRawSources: ["- :::note\n  nested raw\n  :::"]
  },
  {
    name: "adjacent directives",
    source: ":::note\none\n:::\n\n:::warning\ntwo\n:::\n",
    expectedExport: ":::note\none\n:::\n\n:::warning\ntwo\n:::",
    expectedRawSources: [":::note\none\n:::", ":::warning\ntwo\n:::"]
  }
];

export const fencedCodeFixture = {
  source: "```markdown\n$$\n:::\n```\n",
  expectedExport: "```markdown\n$$\n:::\n```\n"
} as const;

export const indentedCodeFixture = {
  source: "    $$\n    :::\n",
  expectedExport: "```\n$$\n:::\n```\n"
} as const;
