// Pipeline executor. Stages run serialised; each stage's stdout is
// fully materialised (capped at MAX_BUFFER bytes) before the next
// stage starts. The redirect (if any) writes the last stage's
// buffered stdout into the VFS.

import { builtins, isBuiltin } from "./builtins.js";

const MAX_BUFFER = 1 * 1024 * 1024; // 1 MiB

export async function execute(pipeline, vfs) {
  const transcript = { stdout: new Uint8Array(), stderr: "", exit_code: 0 };
  if (pipeline.stages.length === 0) return transcript;

  let stdin = new Uint8Array();
  for (let i = 0; i < pipeline.stages.length; i++) {
    const cmd = pipeline.stages[i];
    const name = cmd.argv[0];
    if (!isBuiltin(name)) {
      transcript.stderr += `command not found: ${name}\n`;
      transcript.exit_code = 127;
      return transcript;
    }
    const result = builtins[name]({ argv: cmd.argv, stdin, vfs });
    if (result.stderr) transcript.stderr += result.stderr;
    const buffered = await materialise(result.stdout);
    if (i === pipeline.stages.length - 1) {
      transcript.stdout = buffered;
      transcript.exit_code = result.exit_code | 0;
    } else {
      stdin = buffered;
    }
  }

  if (pipeline.redirect && pipeline.redirect.op === ">") {
    vfs.write(pipeline.redirect.target, transcript.stdout);
    // After redirect, terminal sees no stdout — bytes went to file.
    transcript.stdout = new Uint8Array();
  }
  return transcript;
}

async function materialise(asyncIter) {
  const chunks = [];
  let total = 0;
  for await (const chunk of asyncIter) {
    if (!(chunk instanceof Uint8Array)) {
      throw new Error("pipe stage emitted non-Uint8Array chunk");
    }
    total += chunk.length;
    if (total > MAX_BUFFER) {
      throw new Error(`pipe buffer exceeded ${MAX_BUFFER} bytes (research-mode cap)`);
    }
    chunks.push(chunk);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}
