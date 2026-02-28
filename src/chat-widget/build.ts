import * as esbuild from "esbuild"

esbuild.buildSync({
  entryPoints: ["src/chat-widget/index.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  outfile: "src/chat-widget/dist/widget.js",
  platform: "browser",
  target: ["es2020"],
})

console.log("Widget built successfully: src/chat-widget/dist/widget.js")
