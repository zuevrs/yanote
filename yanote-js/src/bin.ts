import { runCli } from "./cli.js";

runCli(process.argv.slice(2)).then((res) => {
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  process.exitCode = res.code;
});

