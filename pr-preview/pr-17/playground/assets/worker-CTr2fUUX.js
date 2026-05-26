(function(){"use strict";const u="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",_=`${u}pyodide.js`,m="5.19.0",d="/workspace";let i=null;function o(t){self.postMessage(t)}function h(t,e){o({type:"error",stage:t,message:e})}function c(t,e){return new Promise((s,r)=>{t.FS.syncfs(e,n=>n?r(n):s())})}async function E(){if(i)return;let t="pyodide-load";try{self.importScripts(_);const e=self;if(typeof e.loadPyodide!="function")throw new Error("loadPyodide is not exposed on the worker global after importScripts.");i=await e.loadPyodide({indexURL:u}),t="micropip-load",await i.loadPackage("micropip"),t="frictionless-install",await i.runPythonAsync(`
import micropip
await micropip.install("frictionless==${m}")
`);let s=null;try{const r=await i.runPythonAsync(`
import importlib.metadata as _m
_m.version("frictionless")
`);s=typeof r=="string"?r:String(r??"")||null}catch{s=null}t="fs-mount";try{i.FS.mkdir(d)}catch{}i.FS.mount(i.FS.filesystems.IDBFS,{},d),await c(i,!0),await i.runPythonAsync(`
import os
os.chdir("${d}")
`),o({type:"ready",pyodideVersion:i.version,frictionlessVersion:s})}catch(e){h(t,e instanceof Error?e.message:String(e))}}function f(t){const e={stdout:"",stderr:""};return t.setStdout({batched:s=>{e.stdout+=s+`
`}}),t.setStderr({batched:s=>{e.stderr+=s+`
`}}),e}function y(t,e){if(e===void 0){t.setStdin({error:!1,autoEOF:!0,stdin:()=>""});return}let s=!1;t.setStdin({autoEOF:!0,stdin:()=>s?"":(s=!0,e)})}const S=`
import sys, runpy, traceback, os
# __cli_args and __cli_cwd are injected into Python globals by the
# host via pyodide.globals.set before each runPythonAsync call.
_args = [str(a) for a in list(__cli_args)]
_cwd = str(__cli_cwd)
_old_argv = sys.argv
sys.argv = ['frictionless'] + _args
# Honour the shell's cwd so 'cd lesson/' before the CLI works.
try:
    os.chdir(_cwd)
except Exception:
    pass
try:
    try:
        runpy.run_module('frictionless', run_name='__main__', alter_sys=True)
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
`;async function g(t){if(!i){o({type:"run-result",id:t.id,stdout:"",stderr:"Pyodide not ready",exitCode:1});return}const e=f(i);y(i,t.stdin),i.globals.set("__cli_args",t.args),i.globals.set("__cli_cwd",t.cwd??d);let s=1;try{const r=await i.runPythonAsync(S);s=typeof r=="number"?r:Number(r??1),Number.isFinite(s)||(s=1)}catch(r){e.stderr+=(r instanceof Error?r.message:String(r))+`
`,s=1}finally{try{i.globals.delete("__cli_args"),i.globals.delete("__cli_cwd")}catch{}}try{await c(i,!1),o({type:"fs-changed",paths:[d]})}catch{}o({type:"run-result",id:t.id,stdout:e.stdout,stderr:e.stderr,exitCode:s})}async function w(t){if(!i){o({type:"run-python-result",id:t.id,ok:!1,error:"Pyodide not ready",stdout:"",stderr:""});return}const e=f(i);y(i,void 0);try{const s=await i.runPythonAsync(t.code),r=s==null?"":String(s);try{await c(i,!1),o({type:"fs-changed",paths:[d]})}catch{}o({type:"run-python-result",id:t.id,ok:!0,value:r,stdout:e.stdout,stderr:e.stderr})}catch(s){o({type:"run-python-result",id:t.id,ok:!1,error:s instanceof Error?s.message:String(s),stdout:e.stdout,stderr:e.stderr})}}const F={2:"ENOENT",17:"EEXIST",20:"ENOTDIR",21:"EISDIR",39:"ENOTEMPTY",44:"ENOENT",54:"EEXIST",20020:"EISDIR"};function P(t){const e=t,s=(e==null?void 0:e.message)??(t instanceof Error?t.message:String(t)),r=e==null?void 0:e.code;if(r==="ENOENT"||r==="EEXIST"||r==="EISDIR"||r==="ENOTDIR"||r==="EPERM"||r==="ENOTEMPTY")return{code:r,message:s};if(typeof(e==null?void 0:e.errno)=="number"){const n=F[e.errno];if(n)return{code:n,message:s}}return{code:"EUNK",message:s}}async function l(t,e){try{await c(t,!1)}catch{}o({type:"fs-changed",paths:e})}async function v(t){if(!i){o({type:"fs-result",id:t.id,ok:!1,error:{code:"EUNK",message:"Pyodide not ready"}});return}const e=i;try{if(t.type==="fs-readFile"){const s=e.FS.readFile(t.path,{encoding:t.encoding});o({type:"fs-result",id:t.id,ok:!0,value:s});return}if(t.type==="fs-writeFile"){e.FS.writeFile(t.path,t.content),await l(e,[t.path]),o({type:"fs-result",id:t.id,ok:!0});return}if(t.type==="fs-readdir"){const r=e.FS.readdir(t.path).filter(n=>n!=="."&&n!=="..").map(n=>{try{const a=e.FS.stat(`${t.path==="/"?"":t.path}/${n}`);return{name:n,kind:e.FS.isDir(a.mode)?"dir":"file"}}catch{return{name:n,kind:"file"}}});r.sort((n,a)=>n.name.localeCompare(a.name)),o({type:"fs-result",id:t.id,ok:!0,value:r});return}if(t.type==="fs-mkdir"){t.recursive?e.FS.mkdirTree(t.path):e.FS.mkdir(t.path),await l(e,[t.path]),o({type:"fs-result",id:t.id,ok:!0});return}if(t.type==="fs-remove"){p(e,t.path,t.recursive),await l(e,[t.path]),o({type:"fs-result",id:t.id,ok:!0});return}if(t.type==="fs-stat"){const s=e.FS.stat(t.path);o({type:"fs-result",id:t.id,ok:!0,value:{kind:e.FS.isDir(s.mode)?"dir":"file",size:s.size,mtimeMs:s.mtime.getTime()}});return}if(t.type==="fs-exists"){const s=e.FS.analyzePath(t.path);o({type:"fs-result",id:t.id,ok:!0,value:s.exists});return}}catch(s){o({type:"fs-result",id:t.id,ok:!1,error:P(s)})}}function p(t,e,s){const r=t.FS.stat(e);if(t.FS.isDir(r.mode)){const n=t.FS.readdir(e).filter(a=>a!=="."&&a!=="..");if(n.length>0&&!s){const a=new Error(`directory not empty: ${e}`);throw a.code="ENOTEMPTY",a}for(const a of n)p(t,`${e==="/"?"":e}/${a}`,!0);t.FS.rmdir(e)}else t.FS.unlink(e)}self.addEventListener("message",t=>{const e=t.data;e&&(e.type==="load"?E():e.type==="run"?g(e):e.type==="run-python"?w(e):(e.type==="fs-readFile"||e.type==="fs-writeFile"||e.type==="fs-readdir"||e.type==="fs-mkdir"||e.type==="fs-remove"||e.type==="fs-stat"||e.type==="fs-exists")&&v(e))})})();
