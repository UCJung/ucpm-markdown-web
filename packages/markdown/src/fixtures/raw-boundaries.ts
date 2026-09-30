export const rawBoundaryFixtures = {
  blockquoteHtml: "> <div>quoted raw</div>\n",
  listHtml: "- <div>listed raw</div>\n",
  inlineImage: "![alt text](https://example.com/image.png \"image\")\n",
  inlineHtml: "before <span>raw</span> after\n",
  inlineReference: "[reference text][ref]\n\n[ref]: https://example.com\n",
  rangePrefix: "text\n:::note\n\n:::\n",
  rangeSuffix: ":::note\n\n:::\ntext\n",
  quoteFenceThenDirective: "> ```\n> code\n\n:::note\nraw\n:::\n",
  indentedFenceThenDirective: "    ```\n    code\n\n:::note\nraw\n:::\n",
  quoteUnclosedThenDirective: "> :::note\n> unclosed\n\n:::note\nraw\n:::\n",
  manyUnclosed: ":::note\n:::warning\n:::tip\n:::aside\n"
} as const;
