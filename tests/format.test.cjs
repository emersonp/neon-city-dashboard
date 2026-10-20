// Run with: node --test tests/format.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../shared.js");
require("../format.js");

const F = () => globalThis.NCD_FORMAT;
// Stands in for NCD_ICONS.svg, so the output shows which icon each token picked.
const icon = (n) => `<i:${n}>`;

test("format: paragraphs split on blank lines; single newlines become spaces", () => {
  assert.equal(F().formatDescription("One\ntwo\n\n  Three  ", icon), "<p>One two</p><p>Three</p>");
});

test("format: bold and italic", () => {
  assert.equal(F().formatDescription("the **Exhausted** condition, *once*", icon),
    "<p>the <strong>Exhausted</strong> condition, <em>once</em></p>");
});

test("format: lists, with or without a blank line before them", () => {
  const html = "<p>Pick one:</p><ul><li>a <strong>b</strong></li><li>c</li></ul>";
  assert.equal(F().formatDescription("Pick one:\n- a **b**\n- c", icon), html);
  assert.equal(F().formatDescription("Pick one:\n\n- a **b**\n- c", icon), html);
});

test("format: icon tokens", () => {
  assert.equal(F().formatDescription("add [challenge][challenge] or [advantage], [boon] [drawback] [heat] [influence]", icon),
    "<p>add <i:challenge-die><i:challenge-die> or <i:advantage-die>, <i:boon> <i:drawback> <i:heat> <i:influence></p>");
});

test("format: unknown tokens, lone asterisks, and HTML stay literal", () => {
  assert.equal(F().formatDescription(`[foo] 5 * 2 <b>&"'`, icon), "<p>[foo] 5 * 2 &#60;b&#62;&#38;&#34;&#39;</p>");
});

test("format: empty text", () => {
  assert.equal(F().formatDescription("", icon), "");
  assert.equal(F().formatDescription(undefined, icon), "");
});
