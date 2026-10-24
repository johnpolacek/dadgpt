import { INSTRUCTIONS } from "./voice.ts";

export const LAB_JOKE = "Why don't skeletons fight each other? They don't have the guts.";

// The OpenAI voices that read most like a dad
export const LAB_VOICES = ["ash", "ballad", "cedar", "echo", "fable", "onyx", "verse"];

export type LabStyle = { id: string; name: string; instructions: string; text?: string };

export const LAB_STYLES: LabStyle[] = [
  { id: "current", name: "Current", instructions: INSTRUCTIONS },
  {
    id: "proud",
    name: "Proud of himself",
    text: `Okay, okay, I got one. ${LAB_JOKE} Heh heh. Get it? The guts!`,
    instructions:
      "Voice: a middle-aged American dad who thinks he is the funniest man alive. " +
      "Tone: barely holding in laughter during the setup, then a smug, triumphant punchline. " +
      "Delivery: a long dramatic pause before the punchline. Chuckle out loud after it, wheezing a little, and say 'get it?' like he is nudging you with his elbow. " +
      "Emotion: delighted, very pleased with himself.",
  },
  {
    id: "sitcom",
    name: "Sitcom dad",
    instructions:
      "Voice: a big, booming, theatrical TV sitcom dad playing to a live studio audience. " +
      "Tone: over the top, like a game show host announcing a grand prize. " +
      "Pacing: build suspense on the question, stretch the words out, then a huge pause. " +
      "Delivery: hit the punchline loud and proud, like you expect a laugh track. Big grin in the voice.",
  },
  {
    id: "deadpan",
    name: "Deadpan",
    instructions:
      "Voice: a dry, tired dad with zero enthusiasm. " +
      "Tone: completely flat and monotone, as if reading a tax form. " +
      "Pacing: slow. An awkwardly long silence before the punchline. " +
      "Delivery: deliver the punchline with no emphasis at all, then a tiny satisfied exhale through the nose. The joke lands because he refuses to sell it.",
  },
  {
    id: "grill",
    name: "Backyard grill dad",
    instructions:
      "Voice: a loud, folksy, warm Midwestern dad flipping burgers at a cookout. " +
      "Tone: hearty and friendly, like talking to the whole backyard. " +
      "Pacing: relaxed and rolling, with a little 'heh' before the punchline. " +
      "Delivery: belly laugh right after the punchline, a big 'HA!' Emotion: pure joy.",
  },
];

export function labAudioPath(style: string, voice: string) {
  return `/voices/${style}-${voice}.mp3`;
}
