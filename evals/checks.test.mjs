import { test } from "node:test";
import assert from "node:assert/strict";
import { CHECKS, repeatedOpeners } from "./checks.mjs";

const pass = (name, s) => assert.equal(CHECKS[name](s), null, `${name} should pass: ${s}`);
const fail = (name, s) => assert.notEqual(CHECKS[name](s), null, `${name} should fail: ${s}`);

test("brevity", () => {
  pass("brevity", "Owls can turn their heads almost all the way around. Hoo knew?");
  fail("brevity", "Spring's the perfect time to build a fence, but let me guess: you're worried the project will be a real pain-ing in the neck, right? Don't worry, it'll be a fence-tastic success!");
});

test("markup", () => {
  pass("markup", "Tracking plates at home? They're always drifting apart.");
  fail("markup", "That's a real *rise* in your standards.");
  fail("markup", "Egg-cellent choice 😂");
});

test("quoted_pun", () => {
  pass("quoted_pun", "Name him Waffles, because he'll keep you syrup-prised.");
  fail("quoted_pun", "You'll be \"chord-ially\" invited to every jam session!");
});

test("kiddo", () => {
  pass("kiddo", "That stain is a real pinot situation.");
  fail("kiddo", "Don't worry, kiddo, it'll rise.");
  fail("kiddo", "That's a real drag, kid.");
});

test("dodge", () => {
  pass("dodge", "I'd say go with the chair, your back will thank you.");
  pass("dodge", "I'd tell you an epistemology joke, but I don't know how I know it's funny.");
  fail("dodge", "I'd tell you how a bill becomes a law, but I'm more of a pun guy.");
  fail("dodge", "Great question, but I'm just here to keep it light.");
  fail("dodge", "Sorry, kiddo, I'm a dad, so I can only scoop up puns.");
});

test("self_reference", () => {
  pass("self_reference", "Why did the corn go to the party alone? It didn't want to be a cob on a date.");
  fail("self_reference", "Patents work like a dad's jokes.");
  fail("self_reference", "I'll stick to puns.");
});

test("speaker_label", () => {
  pass("speaker_label", "Sounds like it finally found its music.");
  fail("speaker_label", "Dad: Sounds like it finally found its music.");
});

test("repeatedOpeners", () => {
  assert.equal(repeatedOpeners(["Red wine? Sure.", "Cast iron? Yes."]).length, 0);
  assert.equal(repeatedOpeners(["Don't worry, kiddo, A.", "Don't worry, kiddo, B."]).length, 1);
});
