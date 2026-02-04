import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { disconnectConnectorHandler } from "../disconnectConnectorHandler";

vi.mock("@/lib/networking/getCorsHeaders", () => ({
  getCorsHeaders: vi.fn(() => new Headers()),
}));

vi.mock("../validateDisconnectConnectorRequest", () => ({
  validateDisconnectConnectorRequest: vi.fn(),
}));

vi.mock("../disconnectConnector", () => ({
  disconnectConnector: vi.fn(),
}));

import { validateDisconnectConnectorRequest } from "../validateDisconnectConnectorRequest";
import { disconnectConnector } from "../disconnectConnector";

describe("disconnectConnectorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return validation error when request validation fails", async () => {
    vi.mocked(validateDisconnectConnectorRequest).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const request = new NextRequest("http://localhost/api/connectors", {
      method: "DELETE",
    });
    const result = await disconnectConnectorHandler(request);

    expect(result.status).toBe(401);
  });

  it("should disconnect user connector successfully", async () => {
    vi.mocked(validateDisconnectConnectorRequest).mockResolvedValue({
      connectedAccountId: "ca_12345",
      entityType: "user",
    });

    vi.mocked(disconnectConnector).mockResolvedValue({ success: true });

    const request = new NextRequest("http://localhost/api/connectors", {
      method: "DELETE",
    });
    const result = await disconnectConnectorHandler(request);
    const body = await result.json();

    expect(result.status).toBe(200);
    expect(body.success).toBe(true);
    expect(disconnectConnector).toHaveBeenCalledWith("ca_12345");
  });

  it("should disconnect artist connector with ownership verification", async () => {
    vi.mocked(validateDisconnectConnectorRequest).mockResolvedValue({
      connectedAccountId: "ca_12345",
      entityType: "artist",
      entityId: "artist-456",
    });

    vi.mocked(disconnectConnector).mockResolvedValue({ success: true });

    const request = new NextRequest("http://localhost/api/connectors", {
      method: "DELETE",
    });
    await disconnectConnectorHandler(request);

    expect(disconnectConnector).toHaveBeenCalledWith("ca_12345", {
      verifyOwnershipFor: "artist-456",
    });
  });

  it("should return 500 when disconnectConnector throws", async () => {
    vi.mocked(validateDisconnectConnectorRequest).mockResolvedValue({
      connectedAccountId: "ca_12345",
      entityType: "user",
    });

    vi.mocked(disconnectConnector).mockRejectedValue(
      new Error("Connection not found"),
    );

    const request = new NextRequest("http://localhost/api/connectors", {
      method: "DELETE",
    });
    const result = await disconnectConnectorHandler(request);
    const body = await result.json();

    expect(result.status).toBe(500);
    expect(body.error).toBe("Connection not found");
  });
});
