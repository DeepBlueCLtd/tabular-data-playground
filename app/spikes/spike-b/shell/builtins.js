// Builtins for Spike B. Each takes { argv, stdin, vfs } and returns
// { stdout: AsyncIterable<Uint8Array>, exit_code: number, stderr?: string }.
//
// stdin is a Uint8Array (already buffered by the executor).

const enc = new TextEncoder();
const dec = new TextDecoder("utf-8", { fatal: false });

function* singleChunk(bytes) { yield bytes; }

export const builtins = {
  echo({ argv }) {
    const text = argv.slice(1).join(" ") + "\n";
    return { stdout: singleChunk(enc.encode(text)), exit_code: 0 };
  },

  cat({ argv, stdin, vfs }) {
    if (argv.length === 1) {
      // Read from stdin.
      return { stdout: singleChunk(stdin || new Uint8Array()), exit_code: 0 };
    }
    const chunks = [];
    let exit_code = 0;
    let stderr = "";
    for (const path of argv.slice(1)) {
      try {
        chunks.push(vfs.read(path));
      } catch (err) {
        exit_code = 1;
        stderr += `cat: ${err.message}\n`;
      }
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) { out.set(c, off); off += c.length; }
    return { stdout: singleChunk(out), exit_code, stderr };
  },

  ls({ argv, vfs }) {
    const path = argv[1];
    const items = vfs.list(path);
    const text = items.length ? items.join("\n") + "\n" : "";
    return { stdout: singleChunk(enc.encode(text)), exit_code: 0 };
  },

  pwd({ vfs }) {
    return { stdout: singleChunk(enc.encode(vfs.cwd + "\n")), exit_code: 0 };
  },
};

export function isBuiltin(name) { return Object.hasOwn(builtins, name); }

export function decodeUtf8(bytes) { return dec.decode(bytes); }
