export const interactionFixtures = {
  allowedPaste: "<h2>Paste title</h2><p><strong>safe</strong> <a href=\"/guide\">link</a></p>",
  maliciousPaste: "<p onclick=\"globalThis.pwned=1\"><a href=\"j&#x61;va&#x09;script:alert(1)\">unsafe</a><span style=\"color:red\">plain</span></p><script>globalThis.pwned=2</script><iframe src=\"https://evil.example\"></iframe>",
  unsafeHrefs: ["javascript:alert(1)", "data:text/html,test", "vbscript:msgbox(1)", "j&#x61;va&#x09;script:alert(1)", "java&NewLine;script:alert(1)"] as const,
  rawSource: "<script>globalThis.executed = true</script>"
} as const;
