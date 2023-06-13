import { writeFile, readFile } from "node:fs/promises";

const json = JSON.parse(await readFile("package.json", "utf8"));
json.scripts.postinstall = undefined;
await writeFile("package.json", `${JSON.stringify(json, undefined, 2)}\n`);
