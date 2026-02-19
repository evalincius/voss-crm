import { describe, expect, it } from "vitest";
import {
  parseTemplateMarkdownFile,
  parseTemplateMarkdownFiles,
} from "@/features/library/templates/services/templateMarkdownImportService";

function createMarkdownFile(content: string, name = "template.md") {
  return new File([content], name, { type: "text/markdown" });
}

describe("templateMarkdownImportService", () => {
  it("parses a valid markdown template file", async () => {
    const file = createMarkdownFile(`---
title: "Reactivation email - Q1"
category: "warm_outreach"
status: "approved"
---
Hello {{first_name}}`);

    const parsed = await parseTemplateMarkdownFile(file, 1);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.row.title).toBe("Reactivation email - Q1");
    expect(parsed.row.category).toBe("warm_outreach");
    expect(parsed.row.status).toBe("approved");
  });

  it("returns an error when required metadata is missing", async () => {
    const file = createMarkdownFile(`---
category: "warm_outreach"
---
Body`);

    const parsed = await parseTemplateMarkdownFile(file, 2);

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }

    expect(parsed.error.messages.join(" ")).toContain("title");
  });

  it("returns an error when category is invalid", async () => {
    const file = createMarkdownFile(`---
title: "Invalid category"
category: "newsletter"
---
Body`);

    const parsed = await parseTemplateMarkdownFile(file, 3);

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }

    expect(parsed.error.messages.join(" ")).toContain("category");
  });

  it("returns an error when body is missing", async () => {
    const file = createMarkdownFile(`---
title: "No body"
category: "content"
---
`);

    const parsed = await parseTemplateMarkdownFile(file, 4);

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }

    expect(parsed.error.messages.join(" ")).toContain("body");
  });

  it("returns an error when linked_product_ids metadata is present", async () => {
    const file = createMarkdownFile(`---
title: "Deprecated product ids"
category: "content"
linked_product_ids:
  - "9e2a9d3b-6b2f-4a6f-9c89-6a0d1d4f7c10"
---
Body`);

    const parsed = await parseTemplateMarkdownFile(file, 5);

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }

    expect(parsed.error.messages.join(" ")).toContain("linked_product_ids");
    expect(parsed.error.messages.join(" ")).toContain("import dialog");
  });

  it("returns an error when linked_product_names metadata is present", async () => {
    const file = createMarkdownFile(`---
title: "Deprecated product names"
category: "content"
linked_product_names:
  - "Starter Plan"
---
Body`);

    const parsed = await parseTemplateMarkdownFile(file, 6);

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }

    expect(parsed.error.messages.join(" ")).toContain("linked_product_names");
  });

  it("parses a batch and returns rows plus row-level errors", async () => {
    const valid = createMarkdownFile(
      `---
title: "Valid"
category: "content"
---
Body`,
      "valid.md",
    );

    const invalid = createMarkdownFile(
      `---
title: "Invalid"
---
Body`,
      "invalid.md",
    );

    const result = await parseTemplateMarkdownFiles([valid, invalid], 10);

    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.rows[0]?.rowIndex).toBe(10);
    expect(result.errors[0]?.rowIndex).toBe(11);
  });
});
