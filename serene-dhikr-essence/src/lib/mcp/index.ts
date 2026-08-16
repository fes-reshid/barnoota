import { defineMcp } from "@lovable.dev/mcp-js";
import listChapters from "./tools/list-chapters";
import getChapter from "./tools/get-chapter";
import searchChapters from "./tools/search-chapters";

export default defineMcp({
  name: "hisnul-muslim-mcp",
  title: "Hisnul Muslim MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Hisnul Muslim (Fortress of the Muslim) app — browse and search authentic adhkar and du'as with Arabic text and Afaan Oromoo translations. Use `list_chapters` to browse, `get_chapter` to fetch a chapter by number, and `search_chapters` to find du'as by keyword.",
  tools: [listChapters, getChapter, searchChapters],
});
