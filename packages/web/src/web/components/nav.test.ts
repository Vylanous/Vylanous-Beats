import { describe, expect, test } from "bun:test";
import { isCartInteractionTarget } from "./nav";

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
