import { describe, expect, test } from "bun:test";
import { isCartInteractionTarget, resolveMenuVisibility } from "./nav";

describe("cart dropdown interaction boundary", () => {
  test("treats the portaled cart panel as inside the cart interaction boundary", () => {
    const triggerTarget = {} as EventTarget;
    const panelTarget = {} as EventTarget;
    const outsideTarget = {} as EventTarget;
    const trigger = { contains: (target: Node) => target === triggerTarget };
    const panel = { contains: (target: Node) => target === panelTarget };

    expect(isCartInteractionTarget(triggerTarget, trigger, panel)).toBe(true);
    expect(isCartInteractionTarget(panelTarget, trigger, panel)).toBe(true);
    expect(isCartInteractionTarget(outsideTarget, trigger, panel)).toBe(false);
  });
});

describe("header menu visibility", () => {
  test("inherits the universal menu setting when a page only changes chrome accents", () => {
    expect(resolveMenuVisibility(undefined, true)).toBe(true);
    expect(resolveMenuVisibility(undefined, false)).toBe(false);
  });

  test("honors only the explicit page-level menu visibility override", () => {
    expect(resolveMenuVisibility(false, true)).toBe(false);
    expect(resolveMenuVisibility(true, false)).toBe(true);
  });
});
