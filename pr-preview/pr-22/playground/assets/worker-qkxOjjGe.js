(function(){"use strict";const p="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",g=`${p}pyodide.js`,E="5.19.0",y="0.110.8",f="1.3.1",d="/workspace";let r=null;function a(t){self.postMessage(t)}function S(t,e){a({type:"error",stage:t,message:e})}function c(t,e){return new Promise((s,i)=>{t.FS.syncfs(e,o=>o?i(o):s())})}async function v(){if(r)return;let t="pyodide-load";try{self.importScripts(g);const e=self;if(typeof e.loadPyodide!="function")throw new Error("loadPyodide is not exposed on the worker global after importScripts.");r=await e.loadPyodide({indexURL:p}),t="micropip-load",await r.loadPackage("micropip"),t="frictionless-install",await r.runPythonAsync(`
import micropip
# Pin marko 1.x BEFORE frictionless resolves it. frictionless needs marko>=1.0
# (alone resolves to 2.x) but the Livemark lesson needs marko==1.*; marko
# ${f} satisfies both and cannot be downgraded in place later
# (micropip 0.9 has no reinstall). See docs/limitations.md.
await micropip.install("marko==${f}")
await micropip.install("frictionless==${E}")
`);let s=null;try{const i=await r.runPythonAsync(`
import importlib.metadata as _m
_m.version("frictionless")
`);s=typeof i=="string"?i:String(i??"")||null}catch{s=null}t="fs-mount";try{r.FS.mkdir(d)}catch{}r.FS.mount(r.FS.filesystems.IDBFS,{},d),await c(r,!0),await r.runPythonAsync(`
import os
os.chdir("${d}")
`),a({type:"ready",pyodideVersion:r.version,frictionlessVersion:s})}catch(e){S(t,e instanceof Error?e.message:String(e))}}function m(t){const e={stdout:"",stderr:""};return t.setStdout({batched:s=>{e.stdout+=s+`
`}}),t.setStderr({batched:s=>{e.stderr+=s+`
`}}),e}function _(t,e){if(e===void 0){t.setStdin({error:!1,autoEOF:!0,stdin:()=>""});return}let s=!1;t.setStdin({autoEOF:!0,stdin:()=>s?"":(s=!0,e)})}const w=`
import sys, runpy, traceback, os
# __cli_args, __cli_cwd and __cli_prog are injected into Python globals by the
# host via pyodide.globals.set before each runPythonAsync call. Both the
# frictionless and livemark CLIs expose a __main__ that reads sys.argv, so the
# same wrapper drives either by module name.
_args = [str(a) for a in list(__cli_args)]
_cwd = str(__cli_cwd)
_prog = str(__cli_prog)
_old_argv = sys.argv
sys.argv = [_prog] + _args
# Honour the shell's cwd so 'cd lesson/' before the CLI works.
try:
    os.chdir(_cwd)
except Exception:
    pass
try:
    try:
        runpy.run_module(_prog, run_name='__main__', alter_sys=True)
        _exit_code = 0
    except SystemExit as _e:
        if _e.code is None:
            _exit_code = 0
        elif isinstance(_e.code, int):
            _exit_code = _e.code
        else:
            sys.stderr.write(str(_e.code) + '\\n')
            _exit_code = 1
    except BaseException:
        sys.stderr.write(traceback.format_exc())
        _exit_code = 1
finally:
    sys.argv = _old_argv
_exit_code
`;let l=!1;async function k(t){l||(await t.runPythonAsync(`
import micropip, sys, types, os
await micropip.install([
    "pyyaml", "jinja2", "pyquery==1.*", "deepmerge", "gitpython",
    "jsonschema", "typer", "giturlparse", "cached-property",
    "docstring-parser", "attrs",
])
await micropip.install("livemark==${y}", deps=False)
for _n in ["tornado", "tornado.ioloop", "tornado.web", "tornado.websocket", "livereload"]:
    sys.modules.setdefault(_n, types.ModuleType(_n))
sys.modules["livereload"].Server = type("Server", (), {})
os.environ.setdefault("GIT_PYTHON_REFRESH", "quiet")  # no git binary under Pyodide
`),l=!0)}async function F(t){if(!r){a({type:"run-result",id:t.id,stdout:"",stderr:"Pyodide not ready",exitCode:1});return}const e=t.program??"frictionless";let s="";if(e==="livemark"&&!l)try{await k(r),s=`livemark: installed on first use (livemark ${y}); cached for this session
`}catch(n){a({type:"run-result",id:t.id,stdout:"",stderr:`livemark: install failed: ${n instanceof Error?n.message:String(n)}
`,exitCode:1});return}const i=m(r);_(r,t.stdin),r.globals.set("__cli_args",t.args),r.globals.set("__cli_cwd",t.cwd??d),r.globals.set("__cli_prog",e);let o=1;try{const n=await r.runPythonAsync(w);o=typeof n=="number"?n:Number(n??1),Number.isFinite(o)||(o=1)}catch(n){i.stderr+=(n instanceof Error?n.message:String(n))+`
`,o=1}finally{try{r.globals.delete("__cli_args"),r.globals.delete("__cli_cwd"),r.globals.delete("__cli_prog")}catch{}}s&&(i.stderr=s+i.stderr);try{await c(r,!1),a({type:"fs-changed",paths:[d]})}catch{}a({type:"run-result",id:t.id,stdout:i.stdout,stderr:i.stderr,exitCode:o})}async function P(t){if(!r){a({type:"run-python-result",id:t.id,ok:!1,error:"Pyodide not ready",stdout:"",stderr:""});return}const e=m(r);_(r,void 0);try{const s=await r.runPythonAsync(t.code),i=s==null?"":String(s);try{await c(r,!1),a({type:"fs-changed",paths:[d]})}catch{}a({type:"run-python-result",id:t.id,ok:!0,value:i,stdout:e.stdout,stderr:e.stderr})}catch(s){a({type:"run-python-result",id:t.id,ok:!1,error:s instanceof Error?s.message:String(s),stdout:e.stdout,stderr:e.stderr})}}const I={2:"ENOENT",17:"EEXIST",20:"ENOTDIR",21:"EISDIR",39:"ENOTEMPTY",44:"ENOENT",54:"EEXIST",20020:"EISDIR"};function b(t){const e=t,s=(e==null?void 0:e.message)??(t instanceof Error?t.message:String(t)),i=e==null?void 0:e.code;if(i==="ENOENT"||i==="EEXIST"||i==="EISDIR"||i==="ENOTDIR"||i==="EPERM"||i==="ENOTEMPTY")return{code:i,message:s};if(typeof(e==null?void 0:e.errno)=="number"){const o=I[e.errno];if(o)return{code:o,message:s}}return{code:"EUNK",message:s}}async function u(t,e){try{await c(t,!1)}catch{}a({type:"fs-changed",paths:e})}async function O(t){if(!r){a({type:"fs-result",id:t.id,ok:!1,error:{code:"EUNK",message:"Pyodide not ready"}});return}const e=r;try{if(t.type==="fs-readFile"){const s=e.FS.readFile(t.path,{encoding:t.encoding});a({type:"fs-result",id:t.id,ok:!0,value:s});return}if(t.type==="fs-writeFile"){e.FS.writeFile(t.path,t.content),await u(e,[t.path]),a({type:"fs-result",id:t.id,ok:!0});return}if(t.type==="fs-readdir"){const i=e.FS.readdir(t.path).filter(o=>o!=="."&&o!=="..").map(o=>{try{const n=e.FS.stat(`${t.path==="/"?"":t.path}/${o}`);return{name:o,kind:e.FS.isDir(n.mode)?"dir":"file"}}catch{return{name:o,kind:"file"}}});i.sort((o,n)=>o.name.localeCompare(n.name)),a({type:"fs-result",id:t.id,ok:!0,value:i});return}if(t.type==="fs-mkdir"){t.recursive?e.FS.mkdirTree(t.path):e.FS.mkdir(t.path),await u(e,[t.path]),a({type:"fs-result",id:t.id,ok:!0});return}if(t.type==="fs-remove"){h(e,t.path,t.recursive),await u(e,[t.path]),a({type:"fs-result",id:t.id,ok:!0});return}if(t.type==="fs-stat"){const s=e.FS.stat(t.path);a({type:"fs-result",id:t.id,ok:!0,value:{kind:e.FS.isDir(s.mode)?"dir":"file",size:s.size,mtimeMs:s.mtime.getTime()}});return}if(t.type==="fs-exists"){const s=e.FS.analyzePath(t.path);a({type:"fs-result",id:t.id,ok:!0,value:s.exists});return}}catch(s){a({type:"fs-result",id:t.id,ok:!1,error:b(s)})}}function h(t,e,s){const i=t.FS.stat(e);if(t.FS.isDir(i.mode)){const o=t.FS.readdir(e).filter(n=>n!=="."&&n!=="..");if(o.length>0&&!s){const n=new Error(`directory not empty: ${e}`);throw n.code="ENOTEMPTY",n}for(const n of o)h(t,`${e==="/"?"":e}/${n}`,!0);t.FS.rmdir(e)}else t.FS.unlink(e)}self.addEventListener("message",t=>{const e=t.data;e&&(e.type==="load"?v():e.type==="run"?F(e):e.type==="run-python"?P(e):(e.type==="fs-readFile"||e.type==="fs-writeFile"||e.type==="fs-readdir"||e.type==="fs-mkdir"||e.type==="fs-remove"||e.type==="fs-stat"||e.type==="fs-exists")&&O(e))})})();
