/**
 * CONVERSION SCRIPT
 * Run this with Node.js to process your TXT files.
 *
 * Usage: node scripts/convert.js
 *
 * Logic:
 * - Scans 'raw_subtitles' directory.
 * - Files in root -> Standalone Books.
 * - Folders in root -> Series (Collections). Files inside folders -> Books in that Series.
 */

const fs = require("fs");
const path = require("path");

const RAW_DIR = path.join(__dirname, "../raw_subtitles");
const OUT_DIR = path.join(__dirname, "../assets/subtitles");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Ensure raw directory exists (or warn)
if (!fs.existsSync(RAW_DIR)) {
  console.log(
    `Creating raw_subtitles folder... please add your .txt files there and run again.`
  );
  fs.mkdirSync(RAW_DIR);
  process.exit(0);
}

const parseFile = (filename, content) => {
  const text = content.replace(/\r\n/g, "\n");
  const blocks = text.split(/\n\s*\n/);
  const segments = [];

  blocks.forEach((block) => {
    const lines = block.trim().split("\n");
    if (lines.length < 2) return;
    const idMatch = lines[0].match(/^(\d+)$/);
    if (idMatch) {
      const id = parseInt(idMatch[1]);
      if (lines.length >= 3) {
        segments.push({
          id: id,
          en: lines[1].trim(),
          cn: lines[2].trim(),
        });
      }
    }
  });

  return segments;
};

const createId = (name) =>
  name
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, "-");
const createTitle = (name) => name.replace(/\.[^/.]+$/, "").replace(/-/g, " ");

const processDirectory = () => {
  const entries = fs.readdirSync(RAW_DIR, { withFileTypes: true });

  // 按名称排序（字母顺序）
  entries.sort((a, b) => a.name.localeCompare(b.name));

  // 或者按数字顺序排序（如果文件名包含数字）
  entries.sort((a, b) => {
    const aNum = parseInt(a.name.match(/\d+/)?.[0] || "0");
    const bNum = parseInt(b.name.match(/\d+/)?.[0] || "0");
    return aNum - bNum;
  });

  const manifest = []; // Can contain Book or Series

  console.log(`Scanning ${RAW_DIR}...`);

  entries.forEach((entry) => {
    if (entry.isDirectory()) {
      // HANDLE SERIES (Folder)
      const seriesId = createId(entry.name);
      const seriesTitle = createTitle(entry.name);
      const seriesPath = path.join(RAW_DIR, entry.name);

      const seriesFiles = fs
        .readdirSync(seriesPath)
        .filter((f) => f.endsWith(".txt"));
      if (seriesFiles.length === 0) return;

      // 对系列内的文件进行排序
      seriesFiles.sort((a, b) => {
        // 按文件名中的数字排序
        const aNum = parseInt(a.match(/\d+/)?.[0] || "0");
        const bNum = parseInt(b.match(/\d+/)?.[0] || "0");
        return aNum - bNum;
      });

      const seriesObj = {
        type: "series",
        id: seriesId,
        title: seriesTitle,
        description: `${seriesFiles.length} lessons in this collection.`,
        books: [],
      };

      console.log(
        `Processing Series: ${seriesTitle} (${seriesFiles.length} files)`
      );

      seriesFiles.forEach((file) => {
        const content = fs.readFileSync(path.join(seriesPath, file), "utf-8");
        const segments = parseFile(file, content);
        if (segments.length === 0) return;

        const bookId = `${seriesId}-${createId(file)}`;
        const bookTitle = createTitle(file);

        const bookData = {
          type: "book",
          id: bookId,
          title: bookTitle,
          totalSegments: segments.length,
          seriesId: seriesId,
          segments,
        };

        // Write individual JSON
        fs.writeFileSync(
          path.join(OUT_DIR, `${bookId}.json`),
          JSON.stringify(bookData, null, 2)
        );

        // Add lightweight ref to Series object
        seriesObj.books.push({
          type: "book",
          id: bookId,
          title: bookTitle,
          totalSegments: segments.length,
          seriesId: seriesId,
        });
      });

      if (seriesObj.books.length > 0) {
        manifest.push(seriesObj);
      }
    } else if (entry.isFile() && entry.name.endsWith(".txt")) {
      // HANDLE STANDALONE BOOK
      const content = fs.readFileSync(path.join(RAW_DIR, entry.name), "utf-8");
      const segments = parseFile(entry.name, content);

      if (segments.length > 0) {
        const bookId = createId(entry.name);
        const bookTitle = createTitle(entry.name);

        const bookData = {
          type: "book",
          id: bookId,
          title: bookTitle,
          totalSegments: segments.length,
          segments,
        };

        fs.writeFileSync(
          path.join(OUT_DIR, `${bookId}.json`),
          JSON.stringify(bookData, null, 2)
        );
        console.log(`Generated Standalone Book: ${bookId}.json`);

        manifest.push({
          type: "book",
          id: bookId,
          title: bookTitle,
          description: "Standalone reading.",
          totalSegments: segments.length,
        });
      }
    }
  });

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Manifest updated: ${manifest.length} items (Series/Books).`);
};

processDirectory();
