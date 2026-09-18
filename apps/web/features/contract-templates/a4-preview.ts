/**
 * Builds a self-contained HTML document that paginates template content onto
 * A4 sheets — header on top and footer at the bottom of every page, body
 * flowing across as many pages as it needs. Rendered inside a sandboxed
 * iframe (`allow-scripts` only, no same-origin access), so the pagination
 * script runs isolated from the app.
 */
export function buildA4PreviewDoc(parts: {
  headerHtml: string;
  bodyHtml: string;
  footerHtml: string;
}): string {
  const { headerHtml, bodyHtml, footerHtml } = parts;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #e5e7eb; }
  body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; line-height: 1.45; color: #111; }
  #src { position: absolute; visibility: hidden; width: 170mm; }
  #pages { padding: 12px 0 24px; }
  .page {
    width: 210mm;
    height: 297mm;
    margin: 12px auto 0;
    padding: 15mm 20mm;
    background: #fff;
    box-shadow: 0 1px 6px rgba(0,0,0,.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .page .hdr { flex: none; font-size: 9pt; color: #444; }
  .page .hdr:not(:empty) { padding-bottom: 4mm; border-bottom: 1px solid #ddd; margin-bottom: 6mm; }
  .page .content { flex: 1 1 auto; overflow: hidden; }
  .page .ftr { flex: none; font-size: 9pt; color: #444; }
  .page .ftr:not(:empty) { padding-top: 4mm; border-top: 1px solid #ddd; margin-top: 6mm; }
  p { margin: 0 0 0.6em; }
  /* Tiptap serialises blank lines as empty <p> — keep their height like the editor does. */
  p:empty::before { content: "\\00a0"; }
  h1, h2, h3, h4 { margin: 0.8em 0 0.4em; }
  ul, ol { margin: 0 0 0.6em; padding-left: 1.4em; }
  blockquote { margin: 0.6em 0; padding-left: 0.8em; border-left: 2px solid #ccc; color: #444; }
  hr { border: none; border-top: 1px solid #bbb; margin: 0.8em 0; }
</style>
</head>
<body>
<div id="hdr-src" hidden>${headerHtml}</div>
<div id="ftr-src" hidden>${footerHtml}</div>
<div id="src">${bodyHtml}</div>
<div id="pages"></div>
<script>
(function () {
  var hdr = document.getElementById("hdr-src").innerHTML;
  var ftr = document.getElementById("ftr-src").innerHTML;
  var src = document.getElementById("src");
  var pages = document.getElementById("pages");

  function newPage() {
    var page = document.createElement("div");
    page.className = "page";
    var h = document.createElement("div");
    h.className = "hdr";
    h.innerHTML = hdr;
    var c = document.createElement("div");
    c.className = "content";
    var f = document.createElement("div");
    f.className = "ftr";
    f.innerHTML = ftr;
    page.appendChild(h);
    page.appendChild(c);
    page.appendChild(f);
    pages.appendChild(page);
    return c;
  }

  var content = newPage();
  var nodes = Array.prototype.slice.call(src.childNodes);
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    content.appendChild(node);
    if (content.scrollHeight > content.clientHeight + 1 && content.childNodes.length > 1) {
      content.removeChild(node);
      content = newPage();
      content.appendChild(node);
    }
  }
  src.remove();

  // Scale sheets down to the iframe width.
  function fit() {
    var page = pages.querySelector(".page");
    if (!page) return;
    var scale = Math.min(1, (document.documentElement.clientWidth - 16) / page.offsetWidth);
    document.body.style.zoom = String(scale);
  }
  fit();
  window.addEventListener("resize", fit);
})();
</script>
</body>
</html>`;
}
