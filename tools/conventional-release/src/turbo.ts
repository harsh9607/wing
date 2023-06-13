import { spawnSync } from "node:child_process";

import * as colors from "yoctocolors";

const turbo = (arguments_: string[], dryRun: boolean) => {
  if (dryRun) {
    console.log(colors.green("✔"), `running turbo ${arguments_.join(" ")}`);
  } else {
    spawnSync("pnpm", ["exec", "turbo", ...arguments_], {
      stdio: "inherit",
    });
  }
};

export interface TurboBuildOptions {
  // filter: string;
  dryRun: boolean;
}

export const turboCompile = ({
  // filter,
  dryRun,
}: TurboBuildOptions) => {
  turbo(
    [
      "compile", // "--filter", filter
      // "--no-cache",
      // "--force",
    ],
    dryRun,
  );
};

export interface TurboBundleOptions {
  // filter: string;
  dryRun: boolean;
  force: boolean;
}

export const turboBundle = ({
  // filter,
  dryRun,
  force,
}: TurboBundleOptions) => {
  let options = ["bundle"];
  if (force) {
    options.push("--force");
  }
  turbo(options, dryRun);
};
