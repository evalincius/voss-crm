import { describe, expect, it } from "vitest";
import { dealFormSchema } from "@/features/deals/schemas/deals.schema";

describe("dealFormSchema", () => {
  it("passes with valid required fields", () => {
    const result = dealFormSchema.safeParse({
      person_id: "person-1",
      product_id: "product-1",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.person_id).toBe("person-1");
      expect(result.data.product_id).toBe("product-1");
      expect(result.data.stage).toBe("prospect");
      expect(result.data.value).toBeNull();
      expect(result.data.campaign_id).toBeNull();
    }
  });

  it("fails when person_id is missing", () => {
    const result = dealFormSchema.safeParse({
      product_id: "product-1",
    });

    expect(result.success).toBe(false);
  });

  it("fails when product_id is missing", () => {
    const result = dealFormSchema.safeParse({
      person_id: "person-1",
    });

    expect(result.success).toBe(false);
  });

  it("fails when person_id is empty string", () => {
    const result = dealFormSchema.safeParse({
      person_id: "",
      product_id: "product-1",
    });

    expect(result.success).toBe(false);
  });

  it("converts empty string value to null", () => {
    const result = dealFormSchema.safeParse({
      person_id: "person-1",
      product_id: "product-1",
      value: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBeNull();
    }
  });

  it("converts numeric string value to number", () => {
    const result = dealFormSchema.safeParse({
      person_id: "person-1",
      product_id: "product-1",
      value: "1500.50",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(1500.5);
    }
  });

  it("rejects negative value", () => {
    const result = dealFormSchema.safeParse({
      person_id: "person-1",
      product_id: "product-1",
      value: "-100",
    });

    expect(result.success).toBe(false);
  });

  it("converts empty string campaign_id to null", () => {
    const result = dealFormSchema.safeParse({
      person_id: "person-1",
      product_id: "product-1",
      campaign_id: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.campaign_id).toBeNull();
    }
  });

  it("converts empty string notes to null", () => {
    const result = dealFormSchema.safeParse({
      person_id: "person-1",
      product_id: "product-1",
      notes: "  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeNull();
    }
  });

  it("accepts a valid stage override", () => {
    const result = dealFormSchema.safeParse({
      person_id: "person-1",
      product_id: "product-1",
      stage: "validated",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stage).toBe("validated");
    }
  });

  it("defaults stage to prospect", () => {
    const result = dealFormSchema.safeParse({
      person_id: "person-1",
      product_id: "product-1",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stage).toBe("prospect");
    }
  });
});
