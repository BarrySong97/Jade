import fs from "fs";
import path from "path";

const R2_PREFIX = "https://pub-6fcfe1e3fe954d73917791d34e36c699.r2.dev";
const OLD_R2_PREFIX =
  "https://c587a55482894f651efe60dbf5bdcc36.r2.cloudflarestorage.com/blogs";
const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

async function replaceImageUrls() {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  console.log(`Found ${files.length} MDX files to process`);

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    let content = fs.readFileSync(filePath, "utf-8");
    let modified = false;

    // Replace old R2 URL with new one
    if (content.includes(OLD_R2_PREFIX)) {
      content = content.replaceAll(OLD_R2_PREFIX, R2_PREFIX);
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated: ${file}`);
    } else {
      console.log(`No changes: ${file}`);
    }
  }

  console.log("\nDone!");
}

replaceImageUrls().catch(console.error);
