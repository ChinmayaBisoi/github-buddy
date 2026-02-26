import { findTableHeader } from "../domHelpers";

describe("findTableHeader", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns element with data-testid=table-header when present in scope", () => {
    const scope = document.createElement("div");
    scope.id = "repo-content-pjax-container";
    const header = document.createElement("div");
    header.setAttribute("data-testid", "table-header");
    header.textContent = "header";
    scope.appendChild(header);
    document.body.appendChild(scope);

    expect(findTableHeader(scope)).toBe(header);
  });

  it("returns list-view-metadata for new Issues UI (Evolving Issues)", () => {
    const scope = document.createElement("div");
    const meta = document.createElement("div");
    meta.id = "_R_1rahl6b_-list-view-metadata";
    const tabsContainer = document.createElement("div");
    const openLink = document.createElement("a");
    openLink.textContent = "Open";
    const closedLink = document.createElement("a");
    closedLink.textContent = "Closed";
    tabsContainer.appendChild(openLink);
    tabsContainer.appendChild(closedLink);
    meta.appendChild(tabsContainer);
    scope.appendChild(meta);
    document.body.appendChild(scope);

    expect(findTableHeader(scope)).toBe(meta);
  });

  it("returns .Box-header when present in scope and no table-header testid", () => {
    const scope = document.createElement("div");
    const box = document.createElement("div");
    box.className = "Box";
    const boxHeader = document.createElement("div");
    boxHeader.className = "Box-header";
    box.appendChild(boxHeader);
    scope.appendChild(box);
    document.body.appendChild(scope);

    expect(findTableHeader(scope)).toBe(boxHeader);
  });

  it("returns header when Open/Closed links exist with checkbox in container", () => {
    const scope = document.createElement("div");
    const row = document.createElement("div");
    row.setAttribute("role", "row");
    const openLink = document.createElement("a");
    openLink.setAttribute("href", "https://github.com/repo/issues?state=open");
    openLink.textContent = "Open";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    row.appendChild(openLink);
    row.appendChild(checkbox);
    scope.appendChild(row);
    document.body.appendChild(scope);

    const result = findTableHeader(scope);
    expect(result).not.toBeNull();
    expect(result).toBe(scope);
  });

  it("returns header for issues-style layout (Open/Closed group without .Box-header)", () => {
    const scope = document.createElement("div");
    const wrapper = document.createElement("div");
    const stateGroup = document.createElement("div");
    const openLink = document.createElement("a");
    openLink.setAttribute("href", "https://github.com/repo/issues?state=open");
    openLink.textContent = "Open";
    const closedLink = document.createElement("a");
    closedLink.setAttribute("href", "https://github.com/repo/issues?state=closed");
    closedLink.textContent = "Closed";
    stateGroup.appendChild(openLink);
    stateGroup.appendChild(closedLink);
    wrapper.appendChild(stateGroup);
    scope.appendChild(wrapper);
    document.body.appendChild(scope);

    const result = findTableHeader(scope);
    expect(result).not.toBeNull();
    expect(result).toBe(wrapper);
  });

  it("returns null when scope has no table header structure", () => {
    const scope = document.createElement("div");
    scope.innerHTML = "<p>No header here</p>";
    document.body.appendChild(scope);

    expect(findTableHeader(scope)).toBeNull();
  });

  it("does not match state links outside scope (nav tabs)", () => {
    const nav = document.createElement("nav");
    const navOpen = document.createElement("a");
    navOpen.href = "/repo/issues?state=open";
    navOpen.textContent = "Open";
    nav.appendChild(navOpen);
    document.body.appendChild(nav);

    const scope = document.createElement("div");
    scope.id = "repo-content-pjax-container";
    document.body.appendChild(scope);

    expect(findTableHeader(scope)).toBeNull();
  });

  it("finds header via list row: preceding sibling of list container (issues/PR table section)", () => {
    const scope = document.createElement("div");
    const headerRow = document.createElement("div");
    headerRow.textContent = "Open Closed";
    const listContainer = document.createElement("div");
    const issueRow = document.createElement("div");
    issueRow.setAttribute("data-testid", "issue-row");
    listContainer.appendChild(issueRow);
    scope.appendChild(headerRow);
    scope.appendChild(listContainer);
    document.body.appendChild(scope);

    const result = findTableHeader(scope);
    expect(result).not.toBeNull();
    expect(result).toBe(headerRow);
  });

  it("finds header via list row: first child of list container (header row then rows)", () => {
    const scope = document.createElement("div");
    const listContainer = document.createElement("div");
    const headerRow = document.createElement("div");
    headerRow.textContent = "Open Closed";
    const boxRow = document.createElement("div");
    boxRow.className = "Box-row";
    listContainer.appendChild(headerRow);
    listContainer.appendChild(boxRow);
    scope.appendChild(listContainer);
    document.body.appendChild(scope);

    const result = findTableHeader(scope);
    expect(result).not.toBeNull();
    expect(result).toBe(headerRow);
  });
});
