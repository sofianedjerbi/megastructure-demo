// The line under the game's name on the first screen: a different one each time the page opens, as some games do
// with a word of welcome that is never twice the same. All of them are ours, short, and true of the game.

const SPLASH = [
  "Build your world. Open a door.",
  "Every world has a door.",
  "Knock knock. Whose world is this?",
  "Make a world. Meet the neighbours.",
  "So many worlds. Bring a snack.",
  "Come in, the world's open.",
  "One door away from everywhere.",
  "Now with 100% more bunnies.",
  "The boar started it.",
  "Do not pet the boar. (You will anyway.)",
  "Step aside. No, further.",
  "WRITE IN CAPITALS TO SHOUT.",
  "Swimming is slow. Eating is slow. Eating while swimming is art.",
  "Cats, bunnies, bears, frogs and ducks welcome.",
  "Some of your neighbours are robots. Be nice.",
  "The frog was here first.",
  "A duck with a sword. What could go wrong?",
  "Bread: the answer to most problems.",
  "Mind the old tree. It minds you.",
  "Hold Tab to see who's awake.",
  "It's always morning somewhere.",
  "Night music sold separately. (It's free.)",
  "Dig down. Regret it. Dig up.",
  "Your pickaxe believes in you.",
  "Somebody's chickens got out again.",
  "Wake up, the shore is waiting.",
  "Hats are a personality.",
  "Please knock before entering a burrow.",
  "Made of pixels and good intentions.",
  "Nobody knows where the wisp goes.",
];
(() => {                                                    // (a phone has no Tab to hold)
  const el = document.getElementById("splash"), all = SPLASH.filter((t) => !/\bTab\b/.test(t) || !document.body.classList.contains("touch"));
  if (el) el.textContent = all[Math.floor(Math.random() * all.length)];
})();
