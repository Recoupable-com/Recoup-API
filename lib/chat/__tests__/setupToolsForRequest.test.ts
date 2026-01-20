import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatRequestBody } from "../validateChatRequest";

// Mock external dependencies
vi.mock("@/lib/mcp/getMcpTools", () => ({
  getMcpTools: vi.fn(),
}));

vi.mock("@/lib/agents/googleSheetsAgent", () => ({
  getGoogleSheetsTools: vi.fn(),
}));

// Import after mocks
import { setupToolsForRequest } from "../setupToolsForRequest";
import { getMcpTools } from "@/lib/mcp/getMcpTools";
import { getGoogleSheetsTools } from "@/lib/agents/googleSheetsAgent";

const mockGetMcpTools = vi.mocked(getMcpTools);
const mockGetGoogleSheetsTools = vi.mocked(getGoogleSheetsTools);

describe("setupToolsForRequest", () => {
  const mockMcpTools = {
    tool1: { description: "Tool 1", parameters: {} },
    tool2: { description: "Tool 2", parameters: {} },
  };

  const mockGoogleSheetsTools = {
    googlesheets_create: { description: "Create sheet", parameters: {} },
    googlesheets_read: { description: "Read sheet", parameters: {} },
  };

  const mockGoogleSheetsLoginTool = {
    google_sheets_login: { description: "Login to Google Sheets", parameters: {} },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for MCP tools
    mockGetMcpTools.mockResolvedValue(mockMcpTools);

    // Default mock for Google Sheets tools - returns login tool (not authenticated)
    mockGetGoogleSheetsTools.mockResolvedValue(mockGoogleSheetsLoginTool);
  });

  describe("MCP tools integration", () => {
    it("calls getMcpTools with authToken", async () => {
      const body: ChatRequestBody = {
        accountId: "account-123",
        orgId: null,
        authToken: "test-token-123",
        messages: [{ id: "1", role: "user", content: "Hello" }],
      };

      await setupToolsForRequest(body);

      expect(mockGetMcpTools).toHaveBeenCalledWith("test-token-123");
    });

    it("fetches tools from MCP client", async () => {
      const body: ChatRequestBody = {
        accountId: "account-123",
        orgId: null,
        authToken: "test-token-123",
        messages: [{ id: "1", role: "user", content: "Hello" }],
      };

      const result = await setupToolsForRequest(body);

      expect(result).toHaveProperty("tool1");
      expect(result).toHaveProperty("tool2");
    });

    it("skips MCP tools when authToken is not provided", async () => {
      const body: ChatRequestBody = {
        accountId: "account-123",
        orgId: null,
        messages: [{ id: "1", role: "user", content: "Hello" }],
      };

      await setupToolsForRequest(body);

      expect(mockGetMcpTools).not.toHaveBeenCalled();
    });
  });

  describe("Google Sheets tools integration", () => {
    it("calls getGoogleSheetsTools with request body", async () => {
      const body: ChatRequestBody = {
        accountId: "account-123",
        orgId: null,
        authToken: "test-token-123",
        messages: [{ id: "1", role: "user", content: "Create a spreadsheet" }],
      };

      await setupToolsForRequest(body);

      expect(mockGetGoogleSheetsTools).toHaveBeenCalledWith(body);
    });

    it("includes Google Sheets tools when user is authenticated", async () => {
      mockGetGoogleSheetsTools.mockResolvedValue(mockGoogleSheetsTools);

      const body: ChatRequestBody = {
        accountId: "account-123",
        orgId: null,
        authToken: "test-token-123",
        messages: [{ id: "1", role: "user", content: "Create a spreadsheet" }],
      };

      const result = await setupToolsForRequest(body);

      expect(result).toHaveProperty("googlesheets_create");
      expect(result).toHaveProperty("googlesheets_read");
    });

    it("includes googleSheetsLoginTool when user is not authenticated", async () => {
      mockGetGoogleSheetsTools.mockResolvedValue(mockGoogleSheetsLoginTool);

      const body: ChatRequestBody = {
        accountId: "account-123",
        orgId: null,
        authToken: "test-token-123",
        messages: [{ id: "1", role: "user", content: "Create a spreadsheet" }],
      };

      const result = await setupToolsForRequest(body);

      expect(result).toHaveProperty("google_sheets_login");
    });
  });

  describe("tool aggregation", () => {
    it("merges MCP tools and Google Sheets tools", async () => {
      mockGetGoogleSheetsTools.mockResolvedValue(mockGoogleSheetsTools);

      const body: ChatRequestBody = {
        accountId: "account-123",
        orgId: null,
        authToken: "test-token-123",
        messages: [{ id: "1", role: "user", content: "Hello" }],
      };

      const result = await setupToolsForRequest(body);

      // Should have both MCP and Google Sheets tools
      expect(result).toHaveProperty("tool1");
      expect(result).toHaveProperty("tool2");
      expect(result).toHaveProperty("googlesheets_create");
      expect(result).toHaveProperty("googlesheets_read");
    });

    it("Google Sheets tools take precedence over MCP tools with same name", async () => {
      mockGetMcpTools.mockResolvedValue({
        googlesheets_create: { description: "MCP version", parameters: {} },
      });

      mockGetGoogleSheetsTools.mockResolvedValue({
        googlesheets_create: { description: "Composio version", parameters: {} },
      });

      const body: ChatRequestBody = {
        accountId: "account-123",
        orgId: null,
        authToken: "test-token-123",
        messages: [{ id: "1", role: "user", content: "Hello" }],
      };

      const result = await setupToolsForRequest(body);

      // Google Sheets (Composio) version should win
      expect(result.googlesheets_create).toEqual(
        expect.objectContaining({ description: "Composio version" }),
      );
    });
  });

  describe("tool filtering", () => {
    it("excludes tools specified in excludeTools array", async () => {
      const body: ChatRequestBody = {
        accountId: "account-123",
        orgId: null,
        authToken: "test-token-123",
        messages: [{ id: "1", role: "user", content: "Hello" }],
        excludeTools: ["tool1"],
      };

      const result = await setupToolsForRequest(body);

      expect(result).not.toHaveProperty("tool1");
      expect(result).toHaveProperty("tool2");
    });

    it("excludes multiple tools", async () => {
      mockGetGoogleSheetsTools.mockResolvedValue(mockGoogleSheetsTools);

      const body: ChatRequestBody = {
        accountId: "account-123",
        orgId: null,
        authToken: "test-token-123",
        messages: [{ id: "1", role: "user", content: "Hello" }],
        excludeTools: ["tool1", "googlesheets_create"],
      };

      const result = await setupToolsForRequest(body);

      expect(result).not.toHaveProperty("tool1");
      expect(result).not.toHaveProperty("googlesheets_create");
      expect(result).toHaveProperty("tool2");
      expect(result).toHaveProperty("googlesheets_read");
    });

    it("returns all tools when excludeTools is undefined", async () => {
      const body: ChatRequestBody = {
        accountId: "account-123",
        orgId: null,
        authToken: "test-token-123",
        messages: [{ id: "1", role: "user", content: "Hello" }],
      };

      const result = await setupToolsForRequest(body);

      expect(result).toHaveProperty("tool1");
      expect(result).toHaveProperty("tool2");
    });

    it("returns all tools when excludeTools is empty array", async () => {
      const body: ChatRequestBody = {
        accountId: "account-123",
        orgId: null,
        authToken: "test-token-123",
        messages: [{ id: "1", role: "user", content: "Hello" }],
        excludeTools: [],
      };

      const result = await setupToolsForRequest(body);

      expect(result).toHaveProperty("tool1");
      expect(result).toHaveProperty("tool2");
    });
  });
});
