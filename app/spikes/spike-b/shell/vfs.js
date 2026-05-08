// Spike B virtual filesystem. Map<absolute-path, Uint8Array>.

const ROOT = "/workspace";

export function createVFS() {
  const files = new Map();
  let cwd = ROOT;
  const enc = new TextEncoder();
  return {
    get cwd() { return cwd; },
    setCwd(path) { cwd = normaliseAbs(path); },
    resolve(name) {
      if (!name) return cwd;
      if (name.startsWith("/")) return normaliseAbs(name);
      return normaliseAbs(cwd + "/" + name);
    },
    has(path) { return files.has(this.resolve(path)); },
    read(path) {
      const abs = this.resolve(path);
      if (!files.has(abs)) {
        throw new VFSError(`no such file: ${path}`);
      }
      return files.get(abs);
    },
    write(path, data) {
      const abs = this.resolve(path);
      const bytes = data instanceof Uint8Array ? data : enc.encode(String(data));
      files.set(abs, bytes);
    },
    list(path) {
      const dir = (path ? this.resolve(path) : cwd).replace(/\/+$/, "") || "/";
      const prefix = dir === "/" ? "/" : dir + "/";
      const out = new Set();
      for (const key of files.keys()) {
        if (!key.startsWith(prefix)) continue;
        const rest = key.slice(prefix.length);
        if (!rest) continue;
        const slash = rest.indexOf("/");
        out.add(slash === -1 ? rest : rest.slice(0, slash) + "/");
      }
      return [...out].sort();
    },
    keys() { return [...files.keys()].sort(); },
  };
}

function normaliseAbs(p) {
  const parts = [];
  for (const seg of p.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return "/" + parts.join("/");
}

export class VFSError extends Error {
  constructor(msg) { super(msg); this.name = "VFSError"; }
}
