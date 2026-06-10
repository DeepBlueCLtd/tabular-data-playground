---
title: Radiated Noise — Mini-Report
---

<!--
MathJax: Livemark ships no math renderer, so we inject one ourselves.
Raw HTML passes straight through Livemark's Markdown. We configure the
$...$ / $$...$$ delimiters BEFORE loading MathJax from the CDN.
-->
<script>
  window.MathJax = {
    tex: { inlineMath: [['$', '$']], displayMath: [['$$', '$$']] },
  };
</script>
<script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

# Radiated Noise — Mini-Report

This document mixes three things Livemark is good at: **narrative** prose, an
**equation**, and **live tables** read at build time from CSV files in a
*sister* folder (`../data/`).

## A simple source-level model

Radiated source level tends to rise with the logarithm of speed. A simplified
single-term model is:

$$
SL = SL_0 + N \cdot \log_{10}\left(\frac{v}{v_0}\right)
$$

where $SL_0$ is the reference source level at reference speed $v_0$, and $N$ is
the slope (often near $20$ for displacement hulls).

## Per-run measurements

The table below is **not** copy-pasted — Livemark reads it from
`../data/measurements.csv` when the document is built:

```yaml table
data: ../data/measurements.csv
```

## Vessel reference

A second resource, from the same sister folder:

```yaml table
data: ../data/vessels.csv
```

Each `vessel_id` above joins back to a run in the measurements table. Both
tables are rendered from CSVs that live entirely outside this Markdown file.
