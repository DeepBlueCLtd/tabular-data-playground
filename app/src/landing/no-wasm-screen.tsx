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
          , which needs WebAssembly. Your current browser context does not expose the{' '}
          <code>WebAssembly</code> global, so the lessons cannot run here.
        </p>
        <h2>Common causes</h2>
        <ul>
          <li>
            A privacy or security extension is stripping WebAssembly. Try an Incognito / Private
            window with extensions disabled.
          </li>
          <li>
            An enterprise policy (visible at <code>chrome://policy</code> or
            <code> edge://policy</code>) is disabling WebAssembly. Ask IT to allow it for this
            origin.
          </li>
          <li>
            The browser is older than 2017 and never shipped WebAssembly. Update to the latest
            stable release.
          </li>
        </ul>
        <p>
          Once <code>typeof WebAssembly</code> returns <code>&quot;object&quot;</code> in this
          browser&apos;s DevTools console, reload this page.
        </p>
      </article>
    </div>
  );
}
