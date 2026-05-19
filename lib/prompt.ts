import { readFile } from "fs/promises";
import { join } from "path";

const PROMPTS_DIR = join(process.cwd(), "prompts");

export async function loadPrompt(name: string): Promise<string> {
  const filePath = join(PROMPTS_DIR, `${name}.md`);
  return readFile(filePath, "utf-8");
}
