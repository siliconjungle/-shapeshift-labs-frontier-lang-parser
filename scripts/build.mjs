import { copyFile, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await copyFile("src/constraint-space.js", "dist/constraint-space.js");
await copyFile("src/conversion.js", "dist/conversion.js");
await copyFile("src/decision-graph.js", "dist/decision-graph.js");
await copyFile("src/index.js", "dist/index.js");
await copyFile("src/index.d.ts", "dist/index.d.ts");
await copyFile("src/metadata.js", "dist/metadata.js");
await copyFile("src/operations.js", "dist/operations.js");
await copyFile("src/paradigm.js", "dist/paradigm.js");
await copyFile("src/proof.js", "dist/proof.js");
await copyFile("src/source-evidence.js", "dist/source-evidence.js");
await copyFile("src/view.js", "dist/view.js");
