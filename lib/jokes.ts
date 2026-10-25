export const JOKES = [
  "I’m reading a book about anti-gravity. It’s impossible to put down.",
  "I used to hate facial hair, but then it grew on me.",
  "Why don’t skeletons fight each other? They don’t have the guts.",
  "I only know 25 letters of the alphabet. I don’t know y.",
  "What do you call a fake noodle? An impasta.",
  "I’m afraid for the calendar. Its days are numbered.",
  "Why couldn’t the bicycle stand up by itself? It was two tired.",
  "Did you hear about the claustrophobic astronaut? He just needed a little space.",
  "What do you call a fish with no eyes? A fsh.",
  "I would tell you a construction joke, but I’m still working on it.",
  "Why did the scarecrow win an award? He was outstanding in his field.",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "What’s brown and sticky? A stick.",
  "How do you organize a space party? You planet.",
  "I don’t trust stairs. They’re always up to something.",
  "Why do fathers take an extra pair of socks when they go golfing? In case they get a hole in one.",
  "What did the ocean say to the beach? Nothing, it just waved.",
  "Want to hear a joke about paper? Never mind, it’s tearable.",
  "Why did the coffee file a police report? It got mugged.",
  "What do you call a factory that makes okay products? A satisfactory.",
];

/** Where the recorded mp3 for a joke is served from */
export function jokeAudioPath(index: number) {
  return `/jokes/${String(index).padStart(2, "0")}.mp3`;
}

/** Index of a random joke, never the same as the last one told */
export function randomJoke(last?: string) {
  const choices = JOKES.map((_, i) => i).filter((i) => JOKES[i] !== last);
  return choices[Math.floor(Math.random() * choices.length)];
}
