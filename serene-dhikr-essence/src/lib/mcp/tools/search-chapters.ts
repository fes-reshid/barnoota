import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { searchChapters } from "@/data/hisnul";

export default defineTool({
  name: "search_chapters",
  title: "Search chapters",
  description:
    "Search Hisnul Muslim chapters and du'as by keyword (matches Oromo, Arabic, or chapter number). Returns matching chapters with their du'as.",
  inputSchema: {
    query: z.string().min(1).describe("Search term in Oromo, Arabic, or a chapter number."),
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Optional maximum number of matching chapters to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, limit }) => {
    const results = searchChapters(query);
    const trimmed = limit ? results.slice(0, limit) : results;
    return {
      content: [{ type: "text", text: JSON.stringify(trimmed) }],
      structuredContent: { total: results.length, results: trimmed },
    };
  },
});
