import * as fs from "node:fs";
import * as path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

// Configuration
const API_BASE_URL = "https://4real.ltd/api";
const INPUT_FILE = "./data.json";
const OUTPUT_DIR = "./src/content/blog";
const ASSETS_DIR = "./src/assets/blog";

// Lexical text format flags
const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 4;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;

interface LexicalNode {
  type: string;
  tag?: string;
  text?: string;
  format?: number | string;
  children?: LexicalNode[];
  fields?: {
    url?: string;
    newTab?: boolean;
    code?: string;
    language?: string;
    filename?: string;
    blockType?: string;
  };
  value?: {
    url?: string;
    filename?: string;
    alt?: string;
  };
  listType?: string;
  indent?: number;
}

interface BlogDoc {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  status: string;
  coverImage?: {
    url?: string;
    filename?: string;
    alt?: string;
  };
  content: {
    root: {
      children: LexicalNode[];
    };
  };
}

interface DataJson {
  docs: BlogDoc[];
}

// Track downloaded images to avoid duplicates
const downloadedImages = new Set<string>();

async function downloadImage(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;

  // Extract filename from URL and decode URL-encoded characters (e.g., Chinese)
  const rawFilename = path.basename(imageUrl);
  const filename = decodeURIComponent(rawFilename);

  // Skip if already downloaded
  if (downloadedImages.has(filename)) {
    return filename;
  }

  // Build full URL (keep original encoded URL for fetching)
  const fullUrl = imageUrl.startsWith("http")
    ? imageUrl
    : `${API_BASE_URL}${imageUrl.startsWith("/api") ? imageUrl.slice(4) : imageUrl}`;

  const outputPath = path.join(ASSETS_DIR, filename);

  try {
    console.log(`  Downloading: ${filename}`);
    const response = await fetch(fullUrl);

    if (!response.ok) {
      console.error(`  Failed to download ${fullUrl}: ${response.status}`);
      return null;
    }

    const body = response.body;
    if (!body) {
      console.error(`  No response body for ${fullUrl}`);
      return null;
    }

    await pipeline(Readable.fromWeb(body as any), fs.createWriteStream(outputPath));

    downloadedImages.add(filename);
    return filename;
  } catch (error) {
    console.error(`  Error downloading ${fullUrl}:`, error);
    return null;
  }
}

function formatText(text: string, format: number): string {
  if (!text) return "";

  let result = text;

  // Apply formatting in order (code first to avoid conflicts)
  if (format & FORMAT_CODE) {
    result = `\`${result}\``;
  } else {
    if (format & FORMAT_BOLD && format & FORMAT_ITALIC) {
      result = `***${result}***`;
    } else if (format & FORMAT_BOLD) {
      result = `**${result}**`;
    } else if (format & FORMAT_ITALIC) {
      result = `*${result}*`;
    }

    if (format & FORMAT_STRIKETHROUGH) {
      result = `~~${result}~~`;
    }
  }

  return result;
}

async function convertNode(node: LexicalNode, indent = 0): Promise<string> {
  const indentStr = "  ".repeat(indent);

  switch (node.type) {
    case "root":
      if (node.children) {
        const parts = await Promise.all(node.children.map((child) => convertNode(child)));
        return parts.join("\n\n");
      }
      return "";

    case "heading": {
      const level = node.tag ? parseInt(node.tag.slice(1)) : 2;
      const hashes = "#".repeat(level);
      const content = node.children
        ? (await Promise.all(node.children.map((child) => convertNode(child)))).join("")
        : "";
      return `${hashes} ${content}`;
    }

    case "paragraph": {
      if (!node.children || node.children.length === 0) {
        return "";
      }
      const content = (
        await Promise.all(node.children.map((child) => convertNode(child)))
      ).join("");
      return content;
    }

    case "text": {
      const format = typeof node.format === "number" ? node.format : 0;
      return formatText(node.text || "", format);
    }

    case "linebreak":
      return "  \n"; // Markdown line break (two spaces + newline)

    case "link": {
      const url = node.fields?.url || "";
      const content = node.children
        ? (await Promise.all(node.children.map((child) => convertNode(child)))).join("")
        : "";
      return `[${content}](${url})`;
    }

    case "list": {
      const isOrdered = node.tag === "ol" || node.listType === "number";
      if (!node.children) return "";

      const items = await Promise.all(
        node.children.map(async (item, index) => {
          const prefix = isOrdered ? `${index + 1}. ` : "- ";
          const content = await convertNode(item, indent);
          return `${indentStr}${prefix}${content}`;
        })
      );
      return items.join("\n");
    }

    case "listitem": {
      if (!node.children) return "";
      // Check for nested list
      const hasNestedList = node.children.some((c) => c.type === "list");

      if (hasNestedList) {
        const parts: string[] = [];
        for (const child of node.children) {
          if (child.type === "list") {
            parts.push("\n" + (await convertNode(child, indent + 1)));
          } else {
            parts.push(await convertNode(child));
          }
        }
        return parts.join("");
      }

      return (await Promise.all(node.children.map((child) => convertNode(child)))).join(
        ""
      );
    }

    case "quote": {
      const content = node.children
        ? (await Promise.all(node.children.map((child) => convertNode(child)))).join("")
        : "";
      // Handle multi-line quotes
      return content
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    }

    case "upload": {
      const imageUrl = node.value?.url;
      if (!imageUrl) return "";

      const filename = await downloadImage(imageUrl);
      if (!filename) return "";

      const alt = node.value?.alt || "";
      return `![${alt}](../../assets/blog/${filename})`;
    }

    case "block": {
      if (node.fields?.blockType === "code") {
        const code = node.fields.code || "";
        const language = node.fields.language || "";
        // Clean up \r\n to \n
        const cleanCode = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        return `\`\`\`${language}\n${cleanCode}\n\`\`\``;
      }
      return "";
    }

    default:
      // For unknown types, try to process children
      if (node.children) {
        return (
          await Promise.all(node.children.map((child) => convertNode(child)))
        ).join("");
      }
      return "";
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

function escapeYamlString(str: string): string {
  // Escape quotes and handle special characters
  if (str.includes('"') || str.includes("\n") || str.includes(":")) {
    return `"${str.replace(/"/g, '\\"').replace(/\n/g, " ")}"`;
  }
  return `"${str}"`;
}

async function convertBlogPost(doc: BlogDoc): Promise<void> {
  console.log(`\nConverting: ${doc.title}`);

  // Download cover image if exists
  let heroImage = "";
  if (doc.coverImage?.url) {
    const filename = await downloadImage(doc.coverImage.url);
    if (filename) {
      heroImage = `../../assets/blog/${filename}`;
    }
  }

  // Convert Lexical content to Markdown
  const markdown = await convertNode(doc.content.root);

  // Build frontmatter
  const frontmatter = [
    "---",
    `title: ${escapeYamlString(doc.title)}`,
    `description: ${escapeYamlString(doc.excerpt || "")}`,
    `pubDate: "${formatDate(doc.date)}"`,
  ];

  if (heroImage) {
    frontmatter.push(`heroImage: "${heroImage}"`);
  }

  frontmatter.push("---");

  // Combine frontmatter and content
  const mdxContent = `${frontmatter.join("\n")}\n\n${markdown}\n`;

  // Write MDX file
  const outputPath = path.join(OUTPUT_DIR, `${doc.slug}.mdx`);
  fs.writeFileSync(outputPath, mdxContent, "utf-8");
  console.log(`  Written: ${outputPath}`);
}

async function main(): Promise<void> {
  console.log("Lexical to MDX Converter");
  console.log("========================\n");

  // Ensure output directories exist
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  // Read input data
  console.log(`Reading ${INPUT_FILE}...`);
  const data: DataJson = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));

  // Filter published posts
  const publishedDocs = data.docs.filter((doc) => doc.status === "published");
  console.log(`Found ${publishedDocs.length} published posts out of ${data.docs.length} total`);

  // Convert each post
  let successCount = 0;
  let errorCount = 0;

  for (const doc of publishedDocs) {
    try {
      await convertBlogPost(doc);
      successCount++;
    } catch (error) {
      console.error(`Error converting ${doc.title}:`, error);
      errorCount++;
    }
  }

  console.log("\n========================");
  console.log(`Conversion complete!`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Images downloaded: ${downloadedImages.size}`);
}

main().catch(console.error);
