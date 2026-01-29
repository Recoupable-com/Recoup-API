import { describe, it, expect, vi, beforeEach } from "vitest";
import { compactChat } from "../compactChat";

const mockSelectMemories = vi.fn();
const mockGenerateText = vi.fn();

vi.mock("@/lib/supabase/memories/selectMemories", () => ({
  default: (...args: unknown[]) => mockSelectMemories(...args),
}));

vi.mock("@/lib/ai/generateText", () => ({
  default: (...args: unknown[]) => mockGenerateText(...args),
}));

vi.mock("@/lib/const", () => ({
  LIGHTWEIGHT_MODEL: "test-model",
}));

describe("compactChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty compacted string when no memories exist", async () => {
    mockSelectMemories.mockResolvedValue([]);

    const result = await compactChat("chat-123");

    expect(result).toEqual({
      chatId: "chat-123",
      compacted: "",
    });
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("returns empty compacted string when memories is null", async () => {
    mockSelectMemories.mockResolvedValue(null);

    const result = await compactChat("chat-123");

    expect(result).toEqual({
      chatId: "chat-123",
      compacted: "",
    });
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("generates summary from chat memories", async () => {
    const mockMemories = [
      {
        id: "mem-1",
        room_id: "chat-123",
        content: { role: "user", content: "Hello, how are you?" },
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "mem-2",
        room_id: "chat-123",
        content: { role: "assistant", content: "I'm doing well, thank you!" },
        updated_at: "2024-01-01T00:01:00Z",
      },
    ];

    mockSelectMemories.mockResolvedValue(mockMemories);
    mockGenerateText.mockResolvedValue({ text: "A brief greeting exchange." });

    const result = await compactChat("chat-123");

    expect(mockSelectMemories).toHaveBeenCalledWith("chat-123", { ascending: true });
    expect(mockGenerateText).toHaveBeenCalledWith({
      system: expect.stringContaining("conversation summarizer"),
      prompt: expect.stringContaining("user: Hello, how are you?"),
      model: "test-model",
    });
    expect(result).toEqual({
      chatId: "chat-123",
      compacted: "A brief greeting exchange.",
    });
  });

  it("uses custom prompt when provided", async () => {
    const mockMemories = [
      {
        id: "mem-1",
        room_id: "chat-123",
        content: { role: "user", content: "Test message" },
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    mockSelectMemories.mockResolvedValue(mockMemories);
    mockGenerateText.mockResolvedValue({ text: "Custom summary." });

    const customPrompt = "Focus only on action items";
    const result = await compactChat("chat-123", customPrompt);

    expect(mockGenerateText).toHaveBeenCalledWith({
      system: customPrompt,
      prompt: expect.stringContaining("user: Test message"),
      model: "test-model",
    });
    expect(result?.compacted).toBe("Custom summary.");
  });

  it("handles memories with complex content structure", async () => {
    const mockMemories = [
      {
        id: "mem-1",
        room_id: "chat-123",
        content: { nested: { data: "complex" } },
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    mockSelectMemories.mockResolvedValue(mockMemories);
    mockGenerateText.mockResolvedValue({ text: "Summary of complex content." });

    const result = await compactChat("chat-123");

    expect(mockGenerateText).toHaveBeenCalled();
    expect(result?.compacted).toBe("Summary of complex content.");
  });
});
