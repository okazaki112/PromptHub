import { runCli } from "@prompthub/core";

void runCli(process.argv.slice(2)).then((exitCode: number) => {
  process.exitCode = exitCode;
});
