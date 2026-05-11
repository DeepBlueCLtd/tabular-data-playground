export function NoWasmScreen() {
  return (
    <div className="landing-page" role="dialog" aria-labelledby="no-wasm-title">
      <article className="landing-card">
        <h1 id="no-wasm-title">WebAssembly is required</h1>
        <p className="landing-lede">
          This site runs Python in your browser via{' '}
          <a href="https://pyodide.org" target="_blank" rel="noopener noreferrer">
            Pyodide
          </a>
          , which loads inside a Web Worker and needs WebAssembly there. Your current browser
          stripped <code>WebAssembly</code> from the worker context, so the lessons cannot run here.
        </p>
        <h2>Quickest fix: try a different browser</h2>
        <p>
          <strong>Microsoft Edge</strong> or <strong>Firefox</strong> on the same machine almost
          always works. The most common cause (see below) is an enterprise security extension that
          is installed in Chrome but not in Edge, so switching browsers sidesteps the issue
          entirely.
        </p>
        <h2>Common causes</h2>
        <ul>
          <li>
            <strong>
              An enterprise DLP / security extension is stripping WebAssembly inside Web Workers.
            </strong>{' '}
            Open <code>chrome://policy</code> — if you see
            <code> ExtensionInstallBlocklist: [&quot;*&quot;]</code> with an
            <code> ExtensionInstallAllowlist</code>, your Chrome is managed and a force-allowed
            extension is the likely cause. Ask IT to allowlist this origin for that extension.
          </li>
          <li>
            <strong>A personal privacy / anti-fingerprinting extension</strong> is doing the same
            thing. Try an Incognito / Private window with extensions disabled.
          </li>
          <li>
            The browser is older than 2017 and never shipped WebAssembly. Update to the latest
            stable release.
          </li>
        </ul>
        <p>
          Note: <code>typeof WebAssembly</code> in the main-thread DevTools console may print
          <code> &quot;object&quot;</code> even when this page fails — the stripping often only
          targets Web Workers. To verify, run this in DevTools:
        </p>
        <pre>
          <code>
            new Worker(URL.createObjectURL(new Blob([&quot;postMessage(typeof
            WebAssembly)&quot;]))).onmessage = (e) =&gt; console.log(&quot;worker says&quot;,
            e.data);
          </code>
        </pre>
        <p>
          If that prints <code>worker says undefined</code>, the worker context is the one being
          stripped.
        </p>
      </article>
    </div>
  );
}
