import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateCcReplyExpected } from "../validateCcReplyExpected";
import type { ResendEmailData } from "@/lib/emails/validateInboundEmailEvent";

// Mock the generateText function
vi.mock("@/lib/ai/generateText", () => ({
  default: vi.fn(),
}));

import generateText from "@/lib/ai/generateText";

const mockGenerateText = vi.mocked(generateText);

describe("validateCcReplyExpected", () => {
  const baseEmailData: ResendEmailData = {
    email_id: "test-123",
    created_at: "2024-01-01T00:00:00Z",
    from: "sender@example.com",
    to: [],
    cc: [],
    bcc: [],
    message_id: "<test@example.com>",
    subject: "Test Subject",
    attachments: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when Recoup is in TO array", () => {
    it("returns null (should reply) without calling LLM", async () => {
      const emailData: ResendEmailData = {
        ...baseEmailData,
        to: ["hi@mail.recoupable.com"],
        cc: [],
      };

      const result = await validateCcReplyExpected(emailData, "Hello");

      expect(result).toBeNull();
      expect(mockGenerateText).not.toHaveBeenCalled();
    });

    it("returns null when Recoup is in both TO and CC", async () => {
      const emailData: ResendEmailData = {
        ...baseEmailData,
        to: ["hi@mail.recoupable.com"],
        cc: ["hi@mail.recoupable.com"],
      };

      const result = await validateCcReplyExpected(emailData, "Hello");

      expect(result).toBeNull();
      expect(mockGenerateText).not.toHaveBeenCalled();
    });
  });

  describe("when Recoup is only in CC array", () => {
    it("calls LLM and returns null when reply is expected", async () => {
      mockGenerateText.mockResolvedValue({ text: "true" } as never);

      const emailData: ResendEmailData = {
        ...baseEmailData,
        to: ["someone@example.com"],
        cc: ["hi@mail.recoupable.com"],
      };

      const result = await validateCcReplyExpected(emailData, "Hey Recoup, can you help?");

      expect(result).toBeNull();
      expect(mockGenerateText).toHaveBeenCalledTimes(1);
    });

    it("calls LLM and returns response when no reply expected", async () => {
      mockGenerateText.mockResolvedValue({ text: "false" } as never);

      const emailData: ResendEmailData = {
        ...baseEmailData,
        to: ["someone@example.com"],
        cc: ["hi@mail.recoupable.com"],
      };

      const result = await validateCcReplyExpected(emailData, "FYI - keeping you in the loop");

      expect(result).not.toBeNull();
      expect(result?.response).toBeDefined();
      expect(mockGenerateText).toHaveBeenCalledTimes(1);
    });
  });

  describe("when Recoup is not in TO or CC", () => {
    it("returns response (no reply) without calling LLM", async () => {
      const emailData: ResendEmailData = {
        ...baseEmailData,
        to: ["someone@example.com"],
        cc: ["another@example.com"],
      };

      const result = await validateCcReplyExpected(emailData, "Hello");

      expect(result).not.toBeNull();
      expect(mockGenerateText).not.toHaveBeenCalled();
    });
  });
});
