import {
  isDetailPage,
  isIssueOrPrUrl,
  formatCopyPayload,
  formatCopyPayloadMultiple,
  buildDetailTitle,
  matchStatusBadge,
  STATUS_STYLES,
} from "../utils";

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

describe("formatCopyPayload", () => {
  it("formats title and URL with newline", () => {
    expect(formatCopyPayload("Fix bug #123", "https://github.com/a/b/issues/123")).toBe(
      "Fix bug #123\nhttps://github.com/a/b/issues/123"
    );
  });

  it("handles empty title", () => {
    expect(formatCopyPayload("", "https://example.com")).toBe("\nhttps://example.com");
  });
});

describe("formatCopyPayloadMultiple", () => {
  it("joins items with double newline", () => {
    expect(
      formatCopyPayloadMultiple([
        { title: "Fix #1", url: "https://github.com/a/b/issues/1" },
        { title: "Fix #2", url: "https://github.com/a/b/issues/2" },
      ])
    ).toBe(
      "Fix #1\nhttps://github.com/a/b/issues/1\n\nFix #2\nhttps://github.com/a/b/issues/2"
    );
  });

  it("handles single item", () => {
    expect(
      formatCopyPayloadMultiple([{ title: "Only", url: "https://x.com" }])
    ).toBe("Only\nhttps://x.com");
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
  it("defines colors for all badge types", () => {
    expect(STATUS_STYLES.approved.color).toBe("#1a7f37");
    expect(STATUS_STYLES["review-required"].color).toBe("#22d3ee");
    expect(STATUS_STYLES["changes-requested"].color).toBe("#cf222e");
  });

  it("review-required uses cyan", () => {
    expect(STATUS_STYLES["review-required"].color).toBe("#22d3ee");
  });
});
