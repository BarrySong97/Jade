import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { URL } from "node:url";

type DownloadResult = {
  slug: string;
  url: string;
  filePath: string;
  skipped: boolean;
};

const repoRoot = path.resolve(__dirname, "..");
const blogDir = path.join(repoRoot, "src", "content", "blog");
const outputDir = path.join(repoRoot, "public", "blog-hero");

async function listMdxFiles(dirPath: string): Promise<string[]> {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMdxFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractHeroImage(content: string): string | null {
  if (!content.startsWith("---")) {
    return null;
  }

  const endIndex = content.indexOf("\n---", 3);
  if (endIndex === -1) {
    return null;
  }

  const frontmatter = content.slice(3, endIndex).trim();
  const lines = frontmatter.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^heroImage\s*:\s*(.+)\s*$/);
    if (match) {
      return match[1].replace(/^['"]|['"]$/g, "");
    }
  }

  return null;
}

function getOutputExtension(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    const ext = path.extname(parsed.pathname);
    if (ext) {
      return ext;
    }
  } catch {
    return ".jpg";
  }

  return ".jpg";
}

async function downloadToFile(urlString: string, filePath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const handler = urlString.startsWith("https") ? https : http;
    const request = handler.get(urlString, (response) => {
      if (response.statusCode && response.statusCode >= 400) {
        reject(new Error(`Failed ${response.statusCode} for ${urlString}`));
        return;
      }

      if (response.statusCode && response.statusCode >= 300 && response.headers.location) {
        downloadToFile(response.headers.location, filePath).then(resolve).catch(reject);
        return;
      }

      const stream = fs.createWriteStream(filePath);
      response.pipe(stream);
      stream.on("finish", () => {
        stream.close();
        resolve();
      });
      stream.on("error", reject);
    });

    request.on("error", reject);
  });
}

async function run(): Promise<void> {
  await fsp.mkdir(outputDir, { recursive: true });

  const files = await listMdxFiles(blogDir);
  const results: DownloadResult[] = [];

  for (const filePath of files) {
    const slug = path.basename(filePath, path.extname(filePath));
    const content = await fsp.readFile(filePath, "utf8");
    const heroImage = extractHeroImage(content);

    if (!heroImage) {
      continue;
    }

    if (!heroImage.startsWith("http://") && !heroImage.startsWith("https://")) {
      console.warn(`Skip non-url heroImage for ${slug}: ${heroImage}`);
      continue;
    }

    const extension = getOutputExtension(heroImage);
    const targetPath = path.join(outputDir, `${slug}${extension}`);

    if (fs.existsSync(targetPath)) {
      results.push({ slug, url: heroImage, filePath: targetPath, skipped: true });
      continue;
    }

    console.log(`Downloading ${slug} -> ${targetPath}`);
    await downloadToFile(heroImage, targetPath);
    results.push({ slug, url: heroImage, filePath: targetPath, skipped: false });
  }

  const downloaded = results.filter((item) => !item.skipped).length;
  const skipped = results.filter((item) => item.skipped).length;

  console.log(`Done. downloaded=${downloaded} skipped=${skipped}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
