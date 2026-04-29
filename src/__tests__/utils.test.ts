import {
  isDetailPage,
  isIssuesOrPullsPage,
  isIssueOrPrUrl,
  parseIssueOrPullRef,
  formatCopyLinkLabel,
  formatCopyPayload,
  formatCopyPayloadMultiple,
  formatCopyPayloadHtml,
  escapeHtml,
  buildDetailTitle,
  matchStatusBadge,
  STATUS_STYLES,
} from "../utils";

describe("isIssuesOrPullsPage", () => {
  it("returns true for repo issues list and detail", () => {
    expect(isIssuesOrPullsPage("/owner/repo/issues")).toBe(true);
    expect(isIssuesOrPullsPage("/owner/repo/issues/123")).toBe(true);
    expect(isIssuesOrPullsPage("/a/b/issues")).toBe(true);
    expect(isIssuesOrPullsPage("/a/b/issues/1")).toBe(true);
  });

  it("returns true for repo pulls list and pull detail", () => {
    expect(isIssuesOrPullsPage("/owner/repo/pulls")).toBe(true);
    expect(isIssuesOrPullsPage("/owner/repo/pull/456")).toBe(true);
  });

  it("returns false for repo root and other pages", () => {
    expect(isIssuesOrPullsPage("/owner/repo")).toBe(false);
    expect(isIssuesOrPullsPage("/")).toBe(false);
    expect(isIssuesOrPullsPage("/explore")).toBe(false);
    expect(isIssuesOrPullsPage("/notifications")).toBe(false);
    expect(isIssuesOrPullsPage("/owner/repo/issues/123/comments")).toBe(false);
  });

  it("normalizes trailing slash", () => {
    expect(isIssuesOrPullsPage("/owner/repo/issues/")).toBe(true);
    expect(isIssuesOrPullsPage("/owner/repo/pulls/")).toBe(true);
  });
});

describe("isDetailPage", () => {
  it("returns true for issue detail path", () => {
    expect(isDetailPage("/owner/repo/issues/123")).toBe(true);
    expect(isDetailPage("/EasySLR/next-easyslr/issues/2794")).toBe(true);
  });

  it("returns true for PR detail path", () => {
    expect(isDetailPage("/owner/repo/pull/456")).toBe(true);
    expect(isDetailPage("/EasySLR/next-easyslr/pull/100")).toBe(true);
  });

  it("returns false for list paths", () => {
    expect(isDetailPage("/owner/repo/issues")).toBe(false);
    expect(isDetailPage("/owner/repo/pulls")).toBe(false);
    expect(isDetailPage("/owner/repo/issues?page=2")).toBe(false);
  });
});

describe("isIssueOrPrUrl", () => {
  it("returns true for issue URLs", () => {
    expect(isIssueOrPrUrl("https://github.com/owner/repo/issues/123")).toBe(true);
    expect(isIssueOrPrUrl("https://github.com/EasySLR/next-easyslr/issues/2794")).toBe(true);
  });

  it("returns true for PR URLs", () => {
    expect(isIssueOrPrUrl("https://github.com/owner/repo/pull/456")).toBe(true);
  });

  it("returns false for list URLs", () => {
    expect(isIssueOrPrUrl("https://github.com/owner/repo/issues")).toBe(false);
    expect(isIssueOrPrUrl("https://github.com/owner/repo/pulls")).toBe(false);
    expect(isIssueOrPrUrl("https://github.com/owner/repo/issues?state=open")).toBe(false);
  });
});

describe("parseIssueOrPullRef", () => {
  it("detects pull before issue segment when both appear", () => {
    expect(parseIssueOrPullRef("https://github.com/o/r/pull/99")).toEqual({
      kind: "pull",
      num: "99",
    });
  });

  it("parses issue", () => {
    expect(parseIssueOrPullRef("https://github.com/o/r/issues/7")).toEqual({
      kind: "issue",
      num: "7",
    });
  });

  it("returns null when no id", () => {
    expect(parseIssueOrPullRef("https://example.com/")).toBe(null);
  });
});

describe("formatCopyLinkLabel", () => {
  it("returns PR #n for pull URLs", () => {
    expect(formatCopyLinkLabel("https://github.com/EasySLR/next-easyslr/pull/3223")).toBe(
      "PR #3223"
    );
  });

  it("returns Issue #n for issue URLs", () => {
    expect(formatCopyLinkLabel("https://github.com/a/b/issues/42")).toBe("Issue #42");
  });
});

describe("formatCopyPayload", () => {
  it("puts plain title then Issue link markdown", () => {
    expect(formatCopyPayload("Fix bug #123", "https://github.com/a/b/issues/123")).toBe(
      "Fix bug #123 [Issue #123](https://github.com/a/b/issues/123)"
    );
  });

  it("puts plain title then PR link markdown", () => {
    expect(
      formatCopyPayload(
        "security(upload): fix PDF",
        "https://github.com/EasySLR/next-easyslr/pull/3223"
      )
    ).toBe(
      "security(upload): fix PDF [PR #3223](https://github.com/EasySLR/next-easyslr/pull/3223)"
    );
  });

  it("handles empty title (link label only)", () => {
    expect(formatCopyPayload("", "https://github.com/a/b/pull/1")).toBe(
      "[PR #1](https://github.com/a/b/pull/1)"
    );
  });

  it("handles non-GitHub shape: title plus raw URL", () => {
    expect(formatCopyPayload("Only", "https://x.com")).toBe("Only https://x.com");
  });

  it("handles non-GitHub URL with empty title", () => {
    expect(formatCopyPayload("", "https://example.com")).toBe("https://example.com");
  });
});

describe("escapeHtml", () => {
  it("escapes special characters", () => {
    expect(escapeHtml(`a<b c="d">e&f`)).toBe("a&lt;b c=&quot;d&quot;&gt;e&amp;f");
  });
});

describe("formatCopyPayloadHtml", () => {
  it("plain title then Issue anchor", () => {
    expect(
      formatCopyPayloadHtml("Hi", "https://github.com/o/r/issues/100")
    ).toBe(
      'Hi <a href="https://github.com/o/r/issues/100">Issue #100</a>'
    );
  });

  it("escapes title and uses PR anchor", () => {
    expect(
      formatCopyPayloadHtml('Say "yes"', "https://github.com/o/r/pull/2")
    ).toBe(
      'Say &quot;yes&quot; <a href="https://github.com/o/r/pull/2">PR #2</a>'
    );
  });
});

describe("formatCopyPayloadMultiple", () => {
  it("joins lines with double newline", () => {
    expect(
      formatCopyPayloadMultiple([
        { title: "Fix #1", url: "https://github.com/a/b/issues/1" },
        { title: "Fix #2", url: "https://github.com/a/b/issues/2" },
      ])
    ).toBe(
      "Fix #1 [Issue #1](https://github.com/a/b/issues/1)\n\nFix #2 [Issue #2](https://github.com/a/b/issues/2)"
    );
  });

  it("handles single item without parseable id", () => {
    expect(
      formatCopyPayloadMultiple([{ title: "Only", url: "https://x.com" }])
    ).toBe("Only https://x.com");
  });

  it("handles empty array", () => {
    expect(formatCopyPayloadMultiple([])).toBe("");
  });
});

describe("buildDetailTitle", () => {
  it("appends issue number when not present", () => {
    expect(
      buildDetailTitle("Fix the thing", "https://github.com/owner/repo/issues/42")
    ).toBe("Fix the thing #42");
  });

  it("appends PR number when not present", () => {
    expect(
      buildDetailTitle("Add feature", "https://github.com/owner/repo/pull/99")
    ).toBe("Add feature #99");
  });

  it("keeps title as-is when # already present", () => {
    expect(
      buildDetailTitle("Fix bug #123", "https://github.com/owner/repo/issues/123")
    ).toBe("Fix bug #123");
  });

  it("trims whitespace", () => {
    expect(
      buildDetailTitle("  Title  ", "https://github.com/a/b/issues/1")
    ).toBe("Title #1");
  });

  it("returns trimmed title when no issue number in URL", () => {
    expect(buildDetailTitle("  Title  ", "https://github.com/a/b/issues")).toBe("Title");
  });
});

describe("matchStatusBadge", () => {
  it("returns approved for Approved variants", () => {
    expect(matchStatusBadge("Approved")).toBe("approved");
    expect(matchStatusBadge("• Approved")).toBe("approved");
    expect(matchStatusBadge("  Approved  ")).toBe("approved");
  });

  it("returns review-required for Review required variants", () => {
    expect(matchStatusBadge("Review required")).toBe("review-required");
    expect(matchStatusBadge("• Review required")).toBe("review-required");
  });

  it("returns changes-requested for Changes requested variants", () => {
    expect(matchStatusBadge("Changes requested")).toBe("changes-requested");
    expect(matchStatusBadge("• Changes requested")).toBe("changes-requested");
    expect(matchStatusBadge("Requested Changes")).toBe("changes-requested");
    expect(matchStatusBadge("• Requested Changes")).toBe("changes-requested");
  });

  it("returns null for non-matching text", () => {
    expect(matchStatusBadge("")).toBe(null);
    expect(matchStatusBadge("Open")).toBe(null);
    expect(matchStatusBadge("2 approved reviews")).toBe(null);
    expect(matchStatusBadge("Something else")).toBe(null);
  });
});

describe("STATUS_STYLES", () => {
  const badgeTypes = ["approved", "review-required", "changes-requested"] as const;

  it("defines colors for all badge types", () => {
    expect(STATUS_STYLES.approved.color).toBe("#1a7f37");
    expect(STATUS_STYLES["review-required"].color).toBe("#eab308");
    expect(STATUS_STYLES["changes-requested"].color).toBe("#cf222e");
  });

  it("each badge type has color, fontSize, and fontWeight", () => {
    badgeTypes.forEach((type) => {
      expect(STATUS_STYLES[type]).toHaveProperty("color");
      expect(STATUS_STYLES[type]).toHaveProperty("fontSize");
      expect(STATUS_STYLES[type]).toHaveProperty("fontWeight");
      expect(typeof STATUS_STYLES[type].color).toBe("string");
      expect(STATUS_STYLES[type].fontSize).toBe("11px");
      expect(STATUS_STYLES[type].fontWeight).toBe("600");
    });
  });

  it("has no extra or missing keys", () => {
    expect(Object.keys(STATUS_STYLES).sort()).toEqual([...badgeTypes].sort());
  });
});
