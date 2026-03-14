import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const parsed = {
    outputPath: "",
    inputPaths: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--out") {
      parsed.outputPath = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (token === "--help") {
      return { help: true, outputPath: "", inputPaths: [] };
    }
    parsed.inputPaths.push(token);
  }

  if (!parsed.outputPath) {
    throw new Error("Missing required --out <path> argument.");
  }
  if (parsed.inputPaths.length === 0) {
    throw new Error("Provide at least one input events file path to merge.");
  }

  return parsed;
}

function sortInputPaths(inputPaths) {
  return inputPaths.map((inputPath) => path.resolve(inputPath)).sort((left, right) => left.localeCompare(right));
}

export async function mergeAsyncEventsJsonl({ outputPath, inputPaths }) {
  const orderedInputPaths = sortInputPaths(inputPaths);
  let merged = "";

  for (const inputPath of orderedInputPaths) {
    const content = await readFile(inputPath, "utf8");
    if (!content) {
      continue;
    }
    if (merged.length > 0 && !merged.endsWith("\n")) {
      merged += "\n";
    }
    merged += content;
  }

  const resolvedOutputPath = path.resolve(outputPath);
  await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, merged, "utf8");

  return {
    outputPath: resolvedOutputPath,
    orderedInputPaths,
    mergedBytes: Buffer.byteLength(merged, "utf8")
  };
}

async function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    process.stdout.write(
      "Usage: node scripts/ci/merge-async-events-jsonl.mjs --out <merged.jsonl> <events-a.jsonl> [events-b.jsonl ...]\n"
    );
    return;
  }

  const result = await mergeAsyncEventsJsonl(parsed);
  process.stdout.write(
    `merged_files=${result.orderedInputPaths.length} output=${result.outputPath} ordered_inputs=${result.orderedInputPaths.join(",")} bytes=${result.mergedBytes}\n`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`merge-async-events-jsonl: ${error?.message ?? "Unknown merge error"}\n`);
    process.exitCode = 1;
  });
}

export { parseArgs, sortInputPaths };
