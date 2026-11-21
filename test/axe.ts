import axe from "axe-core";
import { expect } from "vitest";

const options: axe.RunOptions = { rules: { "color-contrast": { enabled: false } } };

export async function expectNoAxeViolations(container: Element) {
  const { violations } = await axe.run(container, options);
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(", ")}`)).toEqual([]);
}
