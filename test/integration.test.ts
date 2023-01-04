import { assert } from "chai";
import { existsSync } from "fs";
import { TASK_CLEAN, TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import path from "path";

import { TASK_GOBIND } from "../src/constants";
import { useEnvironment } from "./helpers";

describe("GoBind x Hardhat", function () {
  useEnvironment("hardhat-project-undefined-config");

  const abigenPath = { _abigenPath: "../../../bin/abigen.wasm" };

  const assertExists = (path: string) => assert.isTrue(existsSync(path), `path ${path} should exist`);
  const assertNotExists = (path: string) => assert.isFalse(existsSync(path), `path ${path} should not exist`);
  const assertContractsGenerated = (outdir: string) => {
    assertExists(outdir);
    assertExists(`${outdir}/contracts`);
    assertExists(`${outdir}/contracts/Lock.go`);
  };

  it("does not generate bindings with --no-compile and no artifacts", async function () {
    const outdir = path.resolve(this.env.config.gobind.outdir);

    await this.env.run(TASK_GOBIND, { noCompile: true, ...abigenPath });
    assertNotExists(outdir);
  });

  it("compiles and generates bindings", async function () {
    const outdir = path.resolve(this.env.config.gobind.outdir);
    assertNotExists(outdir);

    await this.env.run(TASK_GOBIND, abigenPath);
    assertContractsGenerated(outdir);
  });

  it("cleans up generated bindings", async function () {
    const outdir = path.resolve(this.env.config.gobind.outdir);
    assertExists(outdir);

    await this.env.run(TASK_CLEAN);
    assertNotExists(outdir);
  });

  it("generates bindings on compilation with --generate-bindings", async function () {
    const outdir = path.resolve(this.env.config.gobind.outdir);
    assertNotExists(outdir);

    await this.env.run(TASK_COMPILE, { generateBindings: true, ...abigenPath });
    assertContractsGenerated(outdir);

    await this.env.run(TASK_CLEAN);
  });
});
