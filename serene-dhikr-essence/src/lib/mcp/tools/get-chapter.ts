import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { chapterById } from "@/data/hisnul";

export default defineTool({
  name: "get_chapter",
  title: "Get chapter",
  description:
    "Get a single Hisnul Muslim chapter by its number, including all Arabic du'as and their Oromo (Afaan Oromoo) translations.",
  inputSchema: {
    num: z.number().int().positive().describe("Chapter number (1-based)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ num }) => {
    const chapter = chapterById(num);
    if (!chapter) {
      return {
        content: [{ type: "text", text: `No chapter found with number ${num}.` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(chapter) }],
      structuredContent: { chapter },
    };
  },
});
