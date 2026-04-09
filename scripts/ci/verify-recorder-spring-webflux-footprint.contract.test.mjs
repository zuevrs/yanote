import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import test from "node:test";

const gradlewPath = path.resolve("./gradlew");

async function runGradle(args) {
  return await new Promise((resolve, reject) => {
    const child = spawn(gradlewPath, args, {
      cwd: path.resolve("."),
      env: { ...process.env }
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}

test("yanote-recorder-spring-webflux keeps reactive APIs at compile time without exporting a web runtime at runtime", async () => {
  const [compileClasspath, runtimeClasspath] = await Promise.all([
    runGradle([":yanote-recorder-spring-webflux:dependencies", "--configuration", "compileClasspath", "--console=plain"]),
    runGradle([":yanote-recorder-spring-webflux:dependencies", "--configuration", "runtimeClasspath", "--console=plain"])
  ]);

  assert.equal(compileClasspath.code, 0, `compileClasspath report failed:\n${compileClasspath.stderr || compileClasspath.stdout}`);
  assert.equal(runtimeClasspath.code, 0, `runtimeClasspath report failed:\n${runtimeClasspath.stderr || runtimeClasspath.stdout}`);

  assert.match(compileClasspath.stdout, /org\.springframework\.boot:spring-boot-autoconfigure:3\.2\.2/);
  assert.match(compileClasspath.stdout, /org\.springframework:spring-webflux:6\.1\.3/);

  assert.doesNotMatch(runtimeClasspath.stdout, /org\.springframework\.boot:spring-boot-starter-webflux:/);
  assert.doesNotMatch(runtimeClasspath.stdout, /org\.springframework:spring-webflux:/);
  assert.doesNotMatch(runtimeClasspath.stdout, /io\.projectreactor\.netty:reactor-netty-http:/);
  assert.doesNotMatch(runtimeClasspath.stdout, /org\.springframework\.boot:spring-boot-starter-web:/);
  assert.doesNotMatch(runtimeClasspath.stdout, /org\.springframework:spring-webmvc:/);
  assert.doesNotMatch(runtimeClasspath.stdout, /org\.apache\.tomcat\.embed:tomcat-embed-core:/);
});
