import { describe, expect, it } from "vitest";
import { invitationKeys, memberKeys, organizationKeys } from "@/lib/queryKeys";

describe("query keys", () => {
  it("includes organization_id in organization detail keys", () => {
    const key = organizationKeys.detail("org-123").queryKey;
    expect(key).toContain("organization_id:org-123");
  });

  it("includes organization_id in members list keys", () => {
    const key = memberKeys.list("org-abc").queryKey;
    expect(key).toContain("organization_id:org-abc");
  });

  it("includes organization_id in invitations list keys", () => {
    const key = invitationKeys.list("org-xyz").queryKey;
    expect(key).toContain("organization_id:org-xyz");
  });
});
