/** Inline fallback when Tailwind chunk fails to load (OneDrive / stale dev server). */
export const CRITICAL_CSS = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#F4F6F5;color:#1F2421;font-family:var(--font-jakarta),system-ui,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
a{color:#0E6E6E}
.kg-shell{max-width:28rem;margin:0 auto;min-height:100vh;background:#F4F6F5;padding-bottom:5rem}
.kg-header{position:sticky;top:0;z-index:40;background:#fff;border-bottom:1px solid #E2E8E6;padding:.75rem 1rem}
.kg-brand{font-size:1.125rem;font-weight:700;color:#0E6E6E}
.kg-page-title{font-size:1.5rem;font-weight:700;color:#0E6E6E;margin:0}
.kg-subtitle{font-size:.875rem;color:#5c6560;margin:.25rem 0 0}
.kg-card-pad{background:#fff;border:1px solid #E2E8E6;border-radius:16px;padding:1rem;margin:1rem;box-shadow:0 2px 8px rgba(31,36,33,.06)}
.kg-card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(14,110,110,.08)}
.btn-primary{display:block;width:100%;margin-top:.75rem;padding:.875rem 1rem;border:none;border-radius:9999px;background:#EBA33D;color:#1F2421;font-size:.875rem;font-weight:600;cursor:pointer;text-align:center}
.btn-secondary{display:block;width:100%;margin-top:.5rem;padding:.75rem 1rem;border:1px solid #E2E8E6;border-radius:9999px;background:#fff;font-size:.875rem;cursor:pointer;text-align:center}
.chip{display:inline-block;margin:.125rem;padding:.375rem .75rem;border-radius:9999px;font-size:.875rem;border:1px solid #E2E8E6;background:#fff;cursor:pointer}
.chip-active{background:#0E6E6E;color:#fff;border-color:#0E6E6E}
.input-kg{display:block;width:100%;margin-top:.5rem;padding:.625rem 1rem;border:1px solid #E2E8E6;border-radius:16px;font-size:.875rem;background:#fff}
textarea.input-kg{min-height:5rem;border-radius:16px;resize:vertical}
nav.fixed{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #E2E8E6;z-index:50}
nav.fixed>div{max-width:28rem;margin:0 auto;display:flex;justify-content:space-around;padding:.5rem}
nav.fixed a{text-decoration:none;font-size:10px;color:#5c6560}
.space-y-4>*+*{margin-top:1rem}
.flex{display:flex}.flex-wrap{flex-wrap:wrap}.gap-2{gap:.5rem}.mt-3{margin-top:.75rem}.p-4{padding:1rem}
`;
