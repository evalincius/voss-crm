import { describe, expect, it } from "vitest";
import {
  campaignKeys,
  interactionKeys,
  invitationKeys,
  memberKeys,
  organizationKeys,
  peopleKeys,
  productKeys,
  templateKeys,
} from "@/lib/queryKeys";

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

  it("includes organization_id in people list keys", () => {
    const key = peopleKeys.list("org-people", {
      search: "",
      lifecycle: "all",
      archiveFilter: "active",
      sort: "updated_desc",
      page: 1,
      pageSize: 20,
    }).queryKey;
    expect(key).toContain("organization_id:org-people");
  });

  it("includes organization_id in interaction keys", () => {
    const key = interactionKeys.byPerson("org-i", "person-1").queryKey;
    expect(key).toContain("organization_id:org-i");
  });

  it("includes organization_id in product list keys", () => {
    const key = productKeys.list("org-products", {
      search: "",
      archiveFilter: "active",
      sort: "updated_desc",
    }).queryKey;
    expect(key).toContain("organization_id:org-products");
  });

  it("includes organization_id in template list keys", () => {
    const key = templateKeys.list("org-templates", {
      search: "",
      statusFilter: "active",
      sort: "updated_desc",
      productId: null,
    }).queryKey;
    expect(key).toContain("organization_id:org-templates");
  });

  it("includes organization_id in campaign list keys", () => {
    const key = campaignKeys.list("org-campaigns", {
      search: "",
      archiveFilter: "active",
      typeFilter: "all",
      sort: "updated_desc",
    }).queryKey;
    expect(key).toContain("organization_id:org-campaigns");
  });

  it("includes campaign_id in campaign detail keys", () => {
    const key = campaignKeys.detail("org-1", "camp-1").queryKey;
    expect(key).toContain("campaign_id:camp-1");
  });

  it("includes campaign_id in campaign members keys", () => {
    const key = campaignKeys.members("org-1", "camp-1").queryKey;
    expect(key).toContain("campaign_id:camp-1");
    expect(key).toContain("members");
  });

  it("includes person_id in campaign byPerson keys", () => {
    const key = campaignKeys.byPerson("org-1", "person-1").queryKey;
    expect(key).toContain("person_id:person-1");
    expect(key).toContain("campaign-memberships");
  });
});
