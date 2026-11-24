<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## AYRA app rules
- Domain logic (intent classification, Owner gate, stage lines) lives in pure functions in src/lib/ayra/engine.ts so it stays testable; tests in src/test/ayra-engine.test.ts.
- App state is one reducer in src/lib/ayra/store.tsx (AyraProvider in __root), persisted to browser localStorage key `ayra.state.v1`; the live log is session-only. Why: user chose browser-only storage for now.
- The live agent workflow is a client-side simulation (1.1s tick); no real AYRA backend is connected yet. Randomness and ids are generated in event handlers/intervals and passed into the reducer to keep it pure.
- Every editable collection page uses the generic src/components/ayra/EntityManager.tsx (field config → add/edit/delete); new modules should reuse it. Why: user wants every module manually editable in one consistent way.
- Visual system: dark-only teal HUD tokens in src/styles.css (Orbitron display, Exo 2 body, JetBrains Mono logs); panels use HudPanel with teal corner blocks.
