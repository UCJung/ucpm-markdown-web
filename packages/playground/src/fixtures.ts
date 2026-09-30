export interface MarkdownFixture {
  readonly label: string;
  readonly markdown: string;
}

export const markdownFixtures: Record<string, MarkdownFixture> = {
  mvp: {
    label: "MVP 문법",
    markdown: `# Markdown playground

기본 **강조**와 *기울임*, ~~취소선~~, \`inline code\`, https://example.com/autolink 를 편집합니다.

> 인용 블록과 기본 블록을 함께 확인합니다.

- 일반 목록
- 두 번째 항목

- [x] 완료한 체크리스트
- [ ] 남은 체크리스트

| 기능 | 상태 |
| --- | --- |
| GFM 표 | 지원 |
| 자동 링크 | 지원 |

---

\`\`\`ts
const visible = true;
\`\`\`
`
  }
};

export interface PasteFixture {
  readonly label: string;
  readonly html: string;
  readonly plainText: string;
}

export const pasteFixtures: Record<string, PasteFixture> = {
  allowed: {
    label: "허용 HTML",
    html: "<h2>Paste title</h2><p><strong>safe</strong> <a href=\"/guide\">link</a></p>",
    plainText: "Paste title safe link"
  },
  malicious: {
    label: "차단 대상 HTML",
    html: "<p onclick=\"globalThis.pwned=1\"><a href=\"j&#x61;va&#x09;script:alert(1)\">unsafe</a><span style=\"color:red\">plain</span></p><script>globalThis.pwned=2</script><iframe src=\"https://evil.example\"></iframe>",
    plainText: "unsafe plain"
  }
};
