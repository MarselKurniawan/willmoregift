<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Lucky draw data is accessed only via server functions in src/lib/draw.functions.ts using the admin client; tables have RLS with no policies so the browser cannot read prizes directly.
- The repeatable WL import uses the canonical client-safe code dataset and server-side upserts without prize or existing announcement-date fields, so refilling preserves draw outcomes and promo scheduling.
- Public result classification is a pure helper shared by the server checker and rule tests, so visibility changes are tested without database access.
- Permanent prize protection uses a database trigger plus server-side allocation exclusions; reset, refill and deletion must preserve locked winners. Prize allocation remains a pure tested helper.
- Admin lookup filters the authenticated overview across every day without exposing new public reads; printed-code OCR lazily loads a browser-only Tesseract worker on capture/upload, validates matches with the tested pure extractor, and releases workers/media on close or success to keep photos local and avoid SSR overhead.
- Public and admin pages share CodeScanner; public scan results call the existing public checker with the detected value directly, avoiding stale form state and keeping privileged lookup separate.
