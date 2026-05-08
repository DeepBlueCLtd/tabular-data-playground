# Quickstart — Measurement C

```sh
cd app/spikes/measurement-c
python3 -m http.server 8002
# Open http://localhost:8002/ in a fresh browser tab.
```

Click **Run**. Wait for the verdict. Click **Copy results** and
paste into `docs/architecture.md`.

The verification harness at
`specs/003-measurement-c-latency/verify/run-measurement.mjs`
automates Chromium + Firefox runs and writes records to
`verify/results/<browser>.{md,json}`.
