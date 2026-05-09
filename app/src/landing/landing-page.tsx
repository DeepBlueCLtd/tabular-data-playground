interface Props {
  onStart: () => void;
}

export function LandingPage({ onStart }: Props) {
  return (
    <div className="landing-page" role="dialog" aria-labelledby="landing-title">
      <article className="landing-card">
        <h1 id="landing-title">Frictionless Data Explorer</h1>
        <p className="landing-lede">
          A small in-browser playground for exploring the{' '}
          <a href="https://frictionlessdata.io" target="_blank" rel="noopener noreferrer">
            Frictionless Data
          </a>{' '}
          ecosystem — schemas, validation, packages — without installing anything.
        </p>
        <h2>What is this?</h2>
        <p>
          A research artefact: an IDE-style page that runs Python via Pyodide so you can try{' '}
          <code>frictionless</code> commands against sample data, edit JSON Schemas with live
          validation, and follow eight short lessons covering the ecosystem end-to-end. Everything
          runs in your browser; nothing is sent to a server.
        </p>
        <h2>Who&apos;s it for?</h2>
        <p>
          People kicking the tyres on Frictionless before adopting it, or learning it for the first
          time. Best on a desktop browser; the layout assumes a wider screen.
        </p>
        <button type="button" className="landing-start" onClick={onStart} autoFocus>
          Start
        </button>
      </article>
    </div>
  );
}
