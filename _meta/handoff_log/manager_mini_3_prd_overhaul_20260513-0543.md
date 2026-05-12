---
artifact: manager_mini_3_prd_overhaul
authored_by: Manager Mini-Cycle #3 (orches-v1Refactory_2 spawn)
timestamp: 2026-05-13 05:46 WIB Day 2 dini hari
---

# Manager Mini-Cycle #3 Task 3: PRD overhaul (md plus docx plus pdf)

## Verdict: PASS

## Pipeline

```
docs/prd/PRD-codeplex-chronicle-revisi.docx  (Hafiz Day 2 revision baseline, preserved)
       |
       v
pandoc --to=gfm --extract-media=/tmp/prd-media-v2
       |
       v
/tmp/prd-revisi-raw.md  (intermediate, 961 lines)
       |
       v
Polish pipeline (Python regex transform):
   * 59 em dash (U+2014) converted to space-hyphen-space
   * Logo image path normalized to relative project path
   * Double-space collapse
   * Date range compactness (12 - 13 Mei to 12-13 Mei)
       |
       v
docs/prd/PRD-codeplex-chronicle.md  (canonical markdown, 961 lines, em dash zero)
       |
       +-->  pandoc -f markdown-citations  -->  docs/prd/PRD-codeplex-chronicle.docx  (33412 bytes)
       |
       +-->  pandoc -f markdown-citations --pdf-engine=typst  -->  docs/prd/PRD-codeplex-chronicle.pdf  (331213 bytes, 26 pages, PDF v1.7)
```

## Polish scope per Lock 1 plus Lock 2 plus Lock 5 sweep

| Issue category | Count pre-polish | Count post-polish |
|---|---|---|
| Em dash (U+2014) | 59 | 0 |
| En dash (U+2013) | 0 | 0 |
| ASCII double-hyphen | 0 | 0 |
| Emoji | 0 | 0 |
| Multiplication sign (×) | 1 (in "Engineering Productivity × AI", preserved as legitimate mathematical symbol) | 1 |
| AI slop phrases (leverage, synergize, robust framework, cutting-edge, etc.) | 0 detected | 0 |
| Persona juri or hackathon judge | 0 detected (Hafiz revision correctly removed at source) | 0 |
| Before plus After persona structure (Aldo plus Budi) | Present, 5 rows each | Preserved |

Hafiz revision content was already clean of AI slop, emoji, and obsolete persona references. The principal polish action was em dash conversion (Lock 1 compliance) and structural preservation.

## Hafiz casual question response (per Manager directive Section 9)

Q: Kenapa di PRD original ada user persona juri hackathon?

A: PRD-ideaLocked era v1.0 (Council Phase F generation Day 1 morning approximately 10:00 WIB) included a "Secondary Persona: Refactory Hackathon Judge" section as a pitch-lens consideration. The rationale at the time was that the `/council-v1` workflow pattern includes an "evaluator persona" for Q&A defense planning, so the team would know what the judge looks for (Technical Execution lens versus Product Innovation lens et cetera).

Conceptually this was a mistake. A judge is not a user, a judge is an evaluator. The user persona model fits the end-user (Engineer Aldo and Engineering Manager Budi), not the evaluator. Hafiz revision correctly removed the juri persona block.

Manager Mini-Cycle #3 grep verify confirms zero residual mention of "juri", "judge persona", "panitia persona", or "evaluator persona" in the polished PRD output. The Q and A defense lens is preserved in Section 11 Q and A Defense Cards (10 anticipated questions plus prepared answers), which is the correct location for evaluator-targeted content (it is content for evaluator consumption, not a user persona to design for).

## Logo embed

The Hafiz revision docx had an embedded 1080x1080 JPEG product logo at the top of the document. Pandoc extracted the binary to `/tmp/prd-media-v2/media/a81cad0498c69cf36aa90788cf81aae149b6a784.png` (file type confirmed JPEG despite .png extension). Saved as `docs/branding/logo.png` (44KB) as the canonical project branding asset.

The polished markdown image reference at top of file points to `../branding/logo.png` (relative path resolves correctly from `docs/prd/` to `docs/branding/`). DOCX and PDF generation include the logo at the cover position.

## Output file inventory

| File | Size | Format | Purpose |
|---|---|---|---|
| `docs/prd/PRD-codeplex-chronicle.md` | 47KB | Markdown source | Version control plus diff plus future agent re-polish |
| `docs/prd/PRD-codeplex-chronicle.docx` | 33KB | Microsoft Word | Editable maintenance |
| `docs/prd/PRD-codeplex-chronicle.pdf` | 331KB | PDF 1.7, 26 pages | Authoritative submission artifact |
| `docs/prd/PRD-codeplex-chronicle-revisi.docx` | 84KB | Microsoft Word | Hafiz Day 2 revision baseline (preserved for audit trail) |
| `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` | 142KB | Markdown | Wave 0 Council Phase F initial PRD (historical reference) |
| `docs/prd/PRD-ideaLocked_codeplex-chronicle.pdf` | 55KB | PDF | Wave 0 PDF artifact (historical reference) |

## PDF rendering notes

Pandoc with `--pdf-engine=typst` requires `-f markdown-citations` to disable citation parsing, otherwise `@react-three/postprocessing` (npm scoped package name) and `@hafiz` (GitHub mention in narration example) trigger pandoc citation processing and cause typst to fail with "the document does not contain a bibliography" error. Fixed by explicit input format flag.

The PDF is rendered in color (typst default styling). Gracefully rendering monochrome (hitam-putih) would require Ghostscript post-processing which is not installed on this development machine. The current color PDF is acceptable for submission per common hackathon practice. If strict monochrome required, Ghaisan post-wake can run on a machine with Ghostscript installed:

```
gs -sOutputFile=PRD-codeplex-chronicle-bw.pdf -sDEVICE=pdfwrite -sColorConversionStrategy=Gray -dProcessColorModel=/DeviceGray -dCompatibilityLevel=1.4 -dNOPAUSE -dBATCH docs/prd/PRD-codeplex-chronicle.pdf
```

## Anti-pattern compliance

- Lock 1 em dash: zero hits in canonical PRD markdown (verified via grep U+2014)
- Lock 2 emoji: zero hits
- Lock 3 silent scope narrow: PRD content preserved fully from Hafiz revision (no section dropped without explicit ferry approval)
- Lock 5 honest claim: PDF color versus monochrome explicitly documented, Hafiz juri question answered with historical context

## Wall-clock

- 8 min (PRD pipeline end-to-end: extract plus polish plus generate)

## Carry-forward

- Hafiz Day 2 jam 11-13 submission window: PDF at `docs/prd/PRD-codeplex-chronicle.pdf` is the authoritative file to upload.
- Ghaisan post-wake optional review: open the PDF and skim 26 pages for any visual layout artifact (table rendering, image positioning, font fallback). Pandoc plus typst output is generally clean but worth a glance.
- Future PRD edit cycle: edit `docs/prd/PRD-codeplex-chronicle.md` then re-run pandoc to regenerate docx and pdf.
