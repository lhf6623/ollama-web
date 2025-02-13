import { Command } from "@tauri-apps/plugin-shell";

export async function openOllamaServe<T>(fn: () => Promise<T>) {
  let data: T | null = null;
  try {
    data = await fn!();
  } catch (e) {
    await Command.create("ollama-shell", ["serve"]).execute();
    data = await fn!();
  }
  return data;
}

export function stopOllama(model: string) {
  return Command.create("ollama-shell", ["stop", model]).execute();
}
