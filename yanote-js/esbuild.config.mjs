import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/cli.ts"],
  outfile: "dist/cli.js",
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  sourcemap: false,
  banner: {
    js: "#!/usr/bin/env node"
  }
});

