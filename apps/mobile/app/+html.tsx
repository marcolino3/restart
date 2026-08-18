import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* PWA: installable web app metadata. The manifest and icons are served
            verbatim from public/, which expo export copies into dist/ as-is. */}
        <link rel="manifest" href="/manifest.json" />
        {/* Salbei's `primary`; themeBootstrap below replaces it with the
            cached theme's before the first paint. */}
        <meta name="theme-color" content="#3a7d44" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Restart" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />

        {/* Repaints the theme-color meta and the body background above from the
            cached theme, so an installed PWA does not flash Salbei at someone
            who picked another one. Runs synchronously and last in <head>, so
            its override wins over the stylesheet before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

// The palettes' `background` and `primary` tokens, mirrored from lib/themes.ts.
// Only these two are needed here: the rest of the palette arrives with the app
// shell, which paints over this the moment it mounts.
const THEME_COLORS: Record<string, [background: string, primary: string]> = {
  salbei: ["#f7f5f0", "#3a7d44"],
  lagune: ["#faf7f2", "#2a9d8f"],
  himmel: ["#f4f7fa", "#2f7bd0"],
  indigo: ["#f4f5fa", "#4f5dd8"],
  flieder: ["#f7f5fa", "#7d55cc"],
  terracotta: ["#faf6f1", "#bb5d3a"],
  ozean: ["#f3f7f8", "#20708d"],
  wald: ["#f5f7f4", "#2d6a4f"],
  beere: ["#faf6f8", "#a34d74"],
  honig: ["#faf7f0", "#a97a24"],
  schiefer: ["#f4f6f8", "#42566b"],
  graphit: ["#f7f7f6", "#1c1c1a"],
};

// Reads the theme AsyncStorage cached under "restart.theme" — on web that is a
// plain, unprefixed localStorage entry — and rewrites the two hardcoded Salbei
// values with it. Wrapped in try/catch because localStorage throws outright in
// a browser with site data blocked; the defaults then simply stay.
const themeBootstrap = `(function(){try{
var c=${JSON.stringify(THEME_COLORS)};
var p=c[localStorage.getItem("restart.theme")||""];
if(!p)return;
var m=document.querySelector('meta[name="theme-color"]');
if(m)m.setAttribute("content",p[1]);
var s=document.createElement("style");
s.textContent="body{background-color:"+p[0]+"}";
document.head.appendChild(s);
}catch(e){}})();`;

// The Salbei `background` token from tailwind.config.js, the default until
// themeBootstrap above overrides it, so the installed PWA does not flash a
// different color before the app shell paints.
//
// The outline rule covers text fields only. On web a RN TextInput renders as a
// real <input>, so the browser draws its own blue focus ring inside the accent
// border our field cards already draw on focus — two rings, one of them off
// palette. Buttons and links keep the browser ring: nothing else here replaces
// it, and removing it would leave keyboard users without a focus indicator.
const responsiveBackground = `
body {
  background-color: #f7f5f0;
}

input:focus,
input:focus-visible,
textarea:focus,
textarea:focus-visible {
  outline: none;
}`;
