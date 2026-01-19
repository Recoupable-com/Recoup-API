import { describe, it, expect } from "vitest";
import { UIMessage } from "ai";
import getUiMessageText from "../getUiMessageText";

describe("getUiMessageText", () => {
  it("extracts text from a UIMessage with text part", () => {
    const message: UIMessage = {
      id: "msg-1",
      role: "assistant",
      parts: [{ type: "text", text: "Hello, world!" }],
    };

    expect(getUiMessageText(message)).toBe("Hello, world!");
  });

  it("returns first text part when multiple parts exist", () => {
    const message: UIMessage = {
      id: "msg-2",
      role: "assistant",
      parts: [
        { type: "text", text: "First text" },
        { type: "text", text: "Second text" },
      ],
    };

    expect(getUiMessageText(message)).toBe("First text");
  });

  it("returns empty string when no text parts exist", () => {
    const message: UIMessage = {
      id: "msg-3",
      role: "assistant",
      parts: [],
    };

    expect(getUiMessageText(message)).toBe("");
  });

  it("returns empty string when parts array only has non-text parts", () => {
    const message = {
      id: "msg-4",
      role: "assistant",
      parts: [{ type: "tool-invocation", toolInvocationId: "123", toolName: "test", state: "result" }],
    } as UIMessage;

    expect(getUiMessageText(message)).toBe("");
  });

  it("works with user messages", () => {
    const message: UIMessage = {
      id: "msg-5",
      role: "user",
      parts: [{ type: "text", text: "User question" }],
    };

    expect(getUiMessageText(message)).toBe("User question");
  });

  it("works with system messages", () => {
    const message: UIMessage = {
      id: "msg-6",
      role: "system",
      parts: [{ type: "text", text: "System prompt" }],
    };

    expect(getUiMessageText(message)).toBe("System prompt");
  });
});
