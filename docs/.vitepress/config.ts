export default {
  lang: "ko-KR",
  title: "UC Markdown Web",
  description: "프레임워크 중립 WYSIWYG Markdown 에디터 소비자 가이드",
  srcExclude: ["**/[[]*.md", "UCPM_PIPELINE_GUIDE.md"],
  themeConfig: {
    nav: [
      { text: "시작", link: "/" },
      { text: "설치", link: "/guide/installation" },
      { text: "Vanilla", link: "/guide/vanilla" },
      { text: "문법", link: "/guide/syntax" },
      { text: "제한사항", link: "/guide/limitations" }
    ],
    sidebar: [
      {
        text: "소비자 가이드",
        items: [
          { text: "설치", link: "/guide/installation" },
          { text: "Vanilla 사용", link: "/guide/vanilla" },
          { text: "지원 문법", link: "/guide/syntax" },
          { text: "제한사항", link: "/guide/limitations" }
        ]
      }
    ]
  }
};
