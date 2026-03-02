import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/bin.ts"],
  outfile: "dist/yanote.cjs",
  bundle: true,
  packages: "external",
  platform: "node",
  format: "cjs",
  sourcemap: false,
  banner: {
    js: "#!/usr/bin/env node"
  },
  target: "node22"
});

