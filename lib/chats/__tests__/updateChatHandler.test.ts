import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { updateChatHandler } from "../updateChatHandler";

vi.mock("@/lib/networking/getCorsHeaders", () => ({
  getCorsHeaders: vi.fn(() => ({ "Access-Control-Allow-Origin": "*" })),
}));

vi.mock("@/lib/chats/validateUpdateChatBody", () => ({
  validateUpdateChatBody: vi.fn(),
}));

vi.mock("@/lib/supabase/rooms/updateRoom", () => ({
  updateRoom: vi.fn(),
}));

vi.mock("@/lib/chats/buildGetChatsParams", () => ({
  buildGetChatsParams: vi.fn(),
}));

import { validateUpdateChatBody } from "@/lib/chats/validateUpdateChatBody";
import { updateRoom } from "@/lib/supabase/rooms/updateRoom";
import { buildGetChatsParams } from "@/lib/chats/buildGetChatsParams";

describe("updateChatHandler", () => {
  const mockRequest = () => {
    return new NextRequest("http://localhost/api/chats", {
      method: "PATCH",
      headers: { "x-api-key": "test-key", "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful update", () => {
    it("updates chat topic when user owns the chat (personal key)", async () => {
      const accountId = "123e4567-e89b-12d3-a456-426614174000";
      const chatId = "123e4567-e89b-12d3-a456-426614174001";
      const newTopic = "My Updated Chat";
      const room = {
        id: chatId,
        account_id: accountId,
        artist_id: null,
        topic: "Old Topic",
        updated_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(validateUpdateChatBody).mockResolvedValue({
        chatId,
        topic: newTopic,
        room,
        accountId,
        orgId: null,
      });

      vi.mocked(buildGetChatsParams).mockResolvedValue({
        params: { account_ids: [accountId] },
        error: null,
      });

      vi.mocked(updateRoom).mockResolvedValue({
        id: chatId,
        account_id: accountId,
        artist_id: null,
        topic: newTopic,
        updated_at: "2024-01-02T00:00:00Z",
      });

      const request = mockRequest();
      const response = await updateChatHandler(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        status: "success",
        chat: {
          id: chatId,
          account_id: accountId,
          topic: newTopic,
          updated_at: "2024-01-02T00:00:00Z",
          artist_id: null,
        },
      });

      // Verify buildGetChatsParams was called with correct params
      expect(buildGetChatsParams).toHaveBeenCalledWith({
        account_id: accountId,
        org_id: null,
      });
    });

    it("updates chat topic when org key has access to member's chat", async () => {
      const orgId = "123e4567-e89b-12d3-a456-426614174002";
      const memberAccountId = "123e4567-e89b-12d3-a456-426614174003";
      const chatId = "123e4567-e89b-12d3-a456-426614174004";
      const newTopic = "Org Chat Updated";
      const room = {
        id: chatId,
        account_id: memberAccountId,
        artist_id: null,
        topic: "Old Topic",
        updated_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(validateUpdateChatBody).mockResolvedValue({
        chatId,
        topic: newTopic,
        room,
        accountId: orgId,
        orgId,
      });

      vi.mocked(buildGetChatsParams).mockResolvedValue({
        params: { account_ids: [memberAccountId, "other-member"] },
        error: null,
      });

      vi.mocked(updateRoom).mockResolvedValue({
        id: chatId,
        account_id: memberAccountId,
        artist_id: null,
        topic: newTopic,
        updated_at: "2024-01-02T00:00:00Z",
      });

      const request = mockRequest();
      const response = await updateChatHandler(request);

      expect(response.status).toBe(200);
    });
  });

  describe("validation errors", () => {
    it("returns error response from validation", async () => {
      vi.mocked(validateUpdateChatBody).mockResolvedValue(
        NextResponse.json(
          { status: "error", error: "chatId must be a valid UUID" },
          { status: 400 },
        ),
      );

      const request = mockRequest();
      const response = await updateChatHandler(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.status).toBe("error");
    });

    it("returns 401 from validation when auth fails", async () => {
      vi.mocked(validateUpdateChatBody).mockResolvedValue(
        NextResponse.json(
          { status: "error", error: "Unauthorized" },
          { status: 401 },
        ),
      );

      const request = mockRequest();
      const response = await updateChatHandler(request);

      expect(response.status).toBe(401);
    });

    it("returns 404 from validation when chat not found", async () => {
      vi.mocked(validateUpdateChatBody).mockResolvedValue(
        NextResponse.json(
          { status: "error", error: "Chat room not found" },
          { status: 404 },
        ),
      );

      const request = mockRequest();
      const response = await updateChatHandler(request);

      expect(response.status).toBe(404);
    });
  });

  describe("access denied errors", () => {
    it("returns 403 when user tries to update another user's chat", async () => {
      const userAccountId = "123e4567-e89b-12d3-a456-426614174005";
      const otherAccountId = "123e4567-e89b-12d3-a456-426614174006";
      const chatId = "123e4567-e89b-12d3-a456-426614174007";
      const room = {
        id: chatId,
        account_id: otherAccountId,
        artist_id: null,
        topic: "Old Topic",
        updated_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(validateUpdateChatBody).mockResolvedValue({
        chatId,
        topic: "Valid Topic",
        room,
        accountId: userAccountId,
        orgId: null,
      });

      vi.mocked(buildGetChatsParams).mockResolvedValue({
        params: { account_ids: [userAccountId] },
        error: null,
      });

      const request = mockRequest();
      const response = await updateChatHandler(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain("Access denied");
    });
  });

  describe("update errors", () => {
    it("returns 500 when updateRoom fails", async () => {
      const accountId = "123e4567-e89b-12d3-a456-426614174000";
      const chatId = "123e4567-e89b-12d3-a456-426614174001";
      const room = {
        id: chatId,
        account_id: accountId,
        artist_id: null,
        topic: "Old Topic",
        updated_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(validateUpdateChatBody).mockResolvedValue({
        chatId,
        topic: "New Topic",
        room,
        accountId,
        orgId: null,
      });

      vi.mocked(buildGetChatsParams).mockResolvedValue({
        params: { account_ids: [accountId] },
        error: null,
      });

      vi.mocked(updateRoom).mockResolvedValue(null);

      const request = mockRequest();
      const response = await updateChatHandler(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toContain("Failed to update");
    });
  });
});
