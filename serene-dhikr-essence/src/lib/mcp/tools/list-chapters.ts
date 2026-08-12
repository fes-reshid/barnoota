import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { chapters } from "@/data/hisnul";

export default defineTool({
  name: "list_chapters",
  title: "List chapters",
  description:
    "List Hisnul Muslim chapters (adhkar/du'a categories) with their number, Arabic title, Oromo title, and du'a count.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Optional maximum number of chapters to return."),
    offset: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Optional number of chapters to skip."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ limit, offset }) => {
    const start = offset ?? 0;
    const end = limit ? start + limit : undefined;
    const slice = chapters.slice(start, end).map((c) => ({
      num: c.num,
      arabicTitle: c.arabicTitle,
      oromoTitle: c.oromoTitle,
      duaCount: c.duas.length,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(slice) }],
      structuredContent: { total: chapters.length, chapters: slice },
    };
  },
});
