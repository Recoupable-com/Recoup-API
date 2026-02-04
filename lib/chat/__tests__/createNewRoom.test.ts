import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNewRoom } from "../createNewRoom";

vi.mock("@/lib/supabase/rooms/upsertRoom", () => ({
  upsertRoom: vi.fn(),
}));

vi.mock("@/lib/chat/generateChatTitle", () => ({
  generateChatTitle: vi.fn(),
}));

vi.mock("@/lib/telegram/sendNewConversationNotification", () => ({
  sendNewConversationNotification: vi.fn(),
}));

vi.mock("@/lib/supabase/account_emails/selectAccountEmails", () => ({
  default: vi.fn(),
}));

import { upsertRoom } from "@/lib/supabase/rooms/upsertRoom";
import { generateChatTitle } from "@/lib/chat/generateChatTitle";
import { sendNewConversationNotification } from "@/lib/telegram/sendNewConversationNotification";
import selectAccountEmails from "@/lib/supabase/account_emails/selectAccountEmails";

describe("createNewRoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateChatTitle).mockResolvedValue("Generated Title");
    vi.mocked(selectAccountEmails).mockResolvedValue([]);
    vi.mocked(upsertRoom).mockResolvedValue(undefined);
    vi.mocked(sendNewConversationNotification).mockResolvedValue(undefined);
  });

  it("should create room with generated title", async () => {
    const lastMessage = {
      id: "msg-1",
      role: "user" as const,
      parts: [{ type: "text" as const, text: "Hello, how are you?" }],
    };

    await createNewRoom({
      accountId: "account-123",
      roomId: "room-456",
      lastMessage,
    });

    expect(generateChatTitle).toHaveBeenCalledWith("Hello, how are you?");
    expect(upsertRoom).toHaveBeenCalledWith({
      account_id: "account-123",
      topic: "Generated Title",
      artist_id: undefined,
      id: "room-456",
    });
  });

  it("should include artist_id when provided", async () => {
    const lastMessage = {
      id: "msg-1",
      role: "user" as const,
      parts: [{ type: "text" as const, text: "Hello" }],
    };

    await createNewRoom({
      accountId: "account-123",
      roomId: "room-456",
      artistId: "artist-789",
      lastMessage,
    });

    expect(upsertRoom).toHaveBeenCalledWith(
      expect.objectContaining({
        artist_id: "artist-789",
      }),
    );
  });

  it("should send notification with account email when available", async () => {
    vi.mocked(selectAccountEmails).mockResolvedValue([
      { email: "user@example.com" },
    ]);

    const lastMessage = {
      id: "msg-1",
      role: "user" as const,
      parts: [{ type: "text" as const, text: "Hello" }],
    };

    await createNewRoom({
      accountId: "account-123",
      roomId: "room-456",
      lastMessage,
    });

    expect(sendNewConversationNotification).toHaveBeenCalledWith({
      accountId: "account-123",
      email: "user@example.com",
      conversationId: "room-456",
      topic: "Generated Title",
      firstMessage: "Hello",
    });
  });

  it("should send notification with empty email when no account email", async () => {
    vi.mocked(selectAccountEmails).mockResolvedValue([]);

    const lastMessage = {
      id: "msg-1",
      role: "user" as const,
      parts: [{ type: "text" as const, text: "Hello" }],
    };

    await createNewRoom({
      accountId: "account-123",
      roomId: "room-456",
      lastMessage,
    });

    expect(sendNewConversationNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "",
      }),
    );
  });

  it("should handle message with empty text", async () => {
    const lastMessage = {
      id: "msg-1",
      role: "user" as const,
      parts: [],
    };

    await createNewRoom({
      accountId: "account-123",
      roomId: "room-456",
      lastMessage,
    });

    expect(generateChatTitle).toHaveBeenCalledWith("");
  });
});
