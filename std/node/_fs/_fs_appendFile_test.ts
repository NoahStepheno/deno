// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
const { test } = Deno;
import { assertEquals, assertThrows, fail } from "../../testing/asserts.ts";
import { appendFile, appendFileSync } from "./_fs_appendFile.ts";

const decoder = new TextDecoder("utf-8");

test({
  name: "No callback Fn results in Error",
  fn() {
    assertThrows(
      () => {
        appendFile("some/path", "some data", "utf8");
      },
      Error,
      "No callback function supplied"
    );
  },
});

test({
  name: "Unsupported encoding results in error()",
  fn() {
    assertThrows(
      () => {
        appendFile("some/path", "some data", "made-up-encoding", () => {});
      },
      Error,
      "Only 'utf8' encoding is currently supported"
    );
    assertThrows(
      () => {
        appendFile(
          "some/path",
          "some data",
          { encoding: "made-up-encoding" },
          () => {}
        );
      },
      Error,
      "Only 'utf8' encoding is currently supported"
    );
    assertThrows(
      () => appendFileSync("some/path", "some data", "made-up-encoding"),
      Error,
      "Only 'utf8' encoding is currently supported"
    );
    assertThrows(
      () =>
        appendFileSync("some/path", "some data", {
          encoding: "made-up-encoding",
        }),
      Error,
      "Only 'utf8' encoding is currently supported"
    );
  },
});

test({
  name: "Async: Data is written to passed in rid",
  async fn() {
    const tempFile: string = await Deno.makeTempFile();
    const file: Deno.File = await Deno.open(tempFile, {
      create: true,
      write: true,
      read: true,
    });
    await new Promise((resolve, reject) => {
      appendFile(file.rid, "hello world", (err) => {
        if (err) reject();
        else resolve();
      });
    })
      .then(async () => {
        const data = await Deno.readFile(tempFile);
        assertEquals(decoder.decode(data), "hello world");
      })
      .catch(() => {
        fail("No error expected");
      })
      .finally(async () => {
        Deno.close(file.rid);
        await Deno.remove(tempFile);
      });
  },
});

test({
  name: "Async: Data is written to passed in file path",
  async fn() {
    const openResourcesBeforeAppend: Deno.ResourceMap = Deno.resources();
    await new Promise((resolve, reject) => {
      appendFile("_fs_appendFile_test_file.txt", "hello world", (err) => {
        if (err) reject(err);
        else resolve();
      });
    })
      .then(async () => {
        assertEquals(Deno.resources(), openResourcesBeforeAppend);
        const data = await Deno.readFile("_fs_appendFile_test_file.txt");
        assertEquals(decoder.decode(data), "hello world");
      })
      .catch((err) => {
        fail("No error was expected: " + err);
      })
      .finally(async () => {
        await Deno.remove("_fs_appendFile_test_file.txt");
      });
  },
});

test({
  name:
    "Async: Callback is made with error if attempting to append data to an existing file with 'ax' flag",
  async fn() {
    const openResourcesBeforeAppend: Deno.ResourceMap = Deno.resources();
    const tempFile: string = await Deno.makeTempFile();
    await new Promise((resolve, reject) => {
      appendFile(tempFile, "hello world", { flag: "ax" }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    })
      .then(() => {
        fail("Expected error to be thrown");
      })
      .catch(() => {
        assertEquals(Deno.resources(), openResourcesBeforeAppend);
      })
      .finally(async () => {
        await Deno.remove(tempFile);
      });
  },
});

test({
  name: "Sync: Data is written to passed in rid",
  fn() {
    const tempFile: string = Deno.makeTempFileSync();
    const file: Deno.File = Deno.openSync(tempFile, {
      create: true,
      write: true,
      read: true,
    });
    appendFileSync(file.rid, "hello world");
    Deno.close(file.rid);
    const data = Deno.readFileSync(tempFile);
    assertEquals(decoder.decode(data), "hello world");
    Deno.removeSync(tempFile);
  },
});

test({
  name: "Sync: Data is written to passed in file path",
  fn() {
    const openResourcesBeforeAppend: Deno.ResourceMap = Deno.resources();
    appendFileSync("_fs_appendFile_test_file_sync.txt", "hello world");
    assertEquals(Deno.resources(), openResourcesBeforeAppend);
    const data = Deno.readFileSync("_fs_appendFile_test_file_sync.txt");
    assertEquals(decoder.decode(data), "hello world");
    Deno.removeSync("_fs_appendFile_test_file_sync.txt");
  },
});

test({
  name:
    "Sync: error thrown if attempting to append data to an existing file with 'ax' flag",
  fn() {
    const openResourcesBeforeAppend: Deno.ResourceMap = Deno.resources();
    const tempFile: string = Deno.makeTempFileSync();
    assertThrows(
      () => appendFileSync(tempFile, "hello world", { flag: "ax" }),
      Deno.errors.AlreadyExists,
      ""
    );
    assertEquals(Deno.resources(), openResourcesBeforeAppend);
    Deno.removeSync(tempFile);
  },
});
