import { afterEach } from "vitest";

import { installDom } from "./dom";
import { installVitestCompat, resetAfterTest, wantsDom } from "./vitest-compat";

installVitestCompat();
const resetDom = (await wantsDom(Bun.main)) ? await installDom() : undefined;

afterEach(() => {
  resetAfterTest();
  resetDom?.();
});
