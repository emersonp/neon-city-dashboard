// Avatars: the character's presence in the Network, overlaid on whatever body they're in (characters.js keeps the
// saved avatar on the mind and works out what's in effect while they're in the Network). The avatar sheet (the sheet
// pack's Anonymous Avatar, called Quick Avatar as the perks do), the New Avatar choices, and entering and leaving.
// No page code here, so it can be tested in Node (avatar-ui.js is the New Avatar dialog). Needs characters.js.
(function (root) {
  const C = root.NCD_CHARACTERS;

  const ABOUT = "This shell only exists in the virtual reality network, and represents your digital manifestation in the virtual world. Copy your Initiative in the Network to this avatar.";

  // ---- Appearance: choose one; each marks 1 intrinsic challenge die on one Gossip skill ----
  const APPEARANCES = {
    featureless: { name: "Featureless Humanoid", chal: "gossip-with-criminals",
      text: "Your avatar is the basic default, humanoid in shape but smooth and featureless. Mark 1 intrinsic challenge die [challenge] for the Gossip with Criminals skill." },
    "x-bit": { name: "X-Bit Character", chal: "gossip-with-corporates",
      text: "Your avatar looks like a video game character from the 8-bit or 16-bit era. Mark 1 intrinsic challenge die [challenge] for the Gossip with Corporates skill." },
    immaculate: { name: "Immaculate Detail", chal: "gossip-with-ai",
      text: "Your avatar, while mostly humanoid, appears to be lovingly crafted, with high resolution details that make it seem hyperrealistic. Mark 1 intrinsic challenge die [challenge] for the Gossip with AI skill." },
    abstract: { name: "Abstract Form", chal: "gossip-with-citizens",
      text: "Your avatar is strange and does not adhere to humanoid constraints, such as a tornado full of monkeys or a talking pie. Mark 1 intrinsic challenge die [challenge] for the Gossip with Citizens skill." },
  };

  // ---- Installed Software: "Do not check any of the boxes below unless you are directed to by a perk." ----
  const SOFTWARE = {
    "vpn-tunnel": { name: "VPN Tunnel", text: "Digital attacks against you add 2 challenge dice [challenge][challenge] to the roll." },
    keychain: { name: "Keychain", text: "You always succeed on initiative rolls." },
    "sudo-commands": { name: "SUDO Commands", text: "When you roll any number of advantage dice, if none of the dice show a boon [boon] symbol, change 1 die to show a boon symbol." },
    "async-attack-processes": { name: "Async Attack Processes", text: "You do not add challenge dice to a roll due to pushing your luck." },
    "chmod-access": { name: "CHMOD Access", text: "You add 2 advantage dice [advantage][advantage] to any roll you make to deal with an obstacle." },
    "icebreaker-suite": { name: "Icebreaker Suite", text: "You can push your luck on digital attacks." },
    daemon: { name: "Daemon", text: "If you are reduced to 0 luck and forced to exit the scene, you can take 1 montage action immediately following the conclusion of the scene. This montage action must be something that a piece of software could reasonably accomplish for you." },
    "co-op-mode": { name: "Co-Op Mode", text: "Do not add challenge dice to rolls for helping a crew member." },
    "emulation-software": { name: "Emulation Software", text: "You can use the skill chance of success of any crew member in the same scene for any roll you would make with that skill." },
  };
  const SOFTWARE_TEXT = "Do not check any of the boxes below unless you are directed to by a perk.";

  // ---- the kinds: a Quick Avatar for anyone, an Enhanced Avatar with the Enhanced Avatars perk ----
  // Enhanced Avatars: 2 different skills with 2 advantage dice, 2 others with 1, and (kept for yourself) 2 software.
  // Only mental skills: physical ones can't be used in the Network.
  const ENHANCED_AVATARS = "enhanced-avatars";
  const INSTALLATION_WIZARD = "installation-wizard";
  const ENHANCEMENTS = { major: { count: 2, adv: 2 }, minor: { count: 2, adv: 1 } };
  const ENHANCEMENTS_TEXT = "Choose 2 different skills and mark 2 intrinsic advantage dice [advantage][advantage] for those skills. Then, choose 2 other different skills and mark 1 intrinsic advantage die [advantage] for those skills. These intrinsic advantage dice represent software upgrades you have installed for that avatar.";
  const ENHANCEABLE = C.SKILLS.filter((s) => s.type === "mental");
  const KINDS = {
    quick: { name: "Quick Avatar", about: "A quick avatar can represent a wide variety of forms." },
    enhanced: { name: "Enhanced Avatar", about: "Enhanced Avatars: a unique avatar you created for yourself, with software upgrades installed." },
  };
  const has = (character, id) => C.abilityIds(C.withoutShell(character)).includes(id);
  const kindsFor = (character) => Object.keys(KINDS).filter((k) => k === "quick" || has(character, ENHANCED_AVATARS));
  // How many software boxes the avatar gets: 2 for an Enhanced Avatar you keep; a Quick Avatar has none, or 1 with
  // Installation Wizard (an Enhanced one already has boxes checked, so the Wizard adds nothing to it).
  const softwareCount = (character, kind) => (kind === "enhanced" ? 2 : kind === "quick" && has(character, INSTALLATION_WIZARD) ? 1 : 0);

  // ---- the choices: { kind, username, appearance, description, major: [2 ids], minor: [2 ids], software: [ids] } ----
  const filled = (list, n) => Array.isArray(list) && list.length === n && list.every((x) => typeof x === "string" && x);
  const distinct = (list) => new Set(list).size === list.length;
  // What's still missing ("kind", "appearance", "major", "minor", "software"), or null. The username is optional.
  function missing(character, choices = {}) {
    if (!kindsFor(character).includes(choices.kind)) return "kind";
    if (!APPEARANCES[choices.appearance]) return "appearance";
    if (choices.kind === "enhanced") {
      const ids = ENHANCEABLE.map((s) => s.id);
      const { major, minor } = choices;
      if (!filled(major, ENHANCEMENTS.major.count) || !distinct(major) || !major.every((id) => ids.includes(id))) return "major";
      if (!filled(minor, ENHANCEMENTS.minor.count) || !distinct([...major, ...minor]) || !minor.every((id) => ids.includes(id))) return "minor";
    }
    const software = choices.software ?? [];
    if (!filled(software, softwareCount(character, choices.kind)) || !distinct(software) || !software.every((id) => SOFTWARE[id])) return "software";
    return null;
  }

  // The avatar, from the choices (which must be complete). skills holds its mental dice ({ id: { adv, chal } }).
  function build(character, choices) {
    const skills = {};
    const add = (id, kind, n) => {
      const s = skills[id] ?? { adv: 0, chal: 0 };
      skills[id] = { ...s, [kind]: Math.min(C.MAX_INTRINSIC, s[kind] + n) };
    };
    add(APPEARANCES[choices.appearance].chal, "chal", 1);
    const enhanced = choices.kind === "enhanced";
    if (enhanced) for (const [key, rule] of Object.entries(ENHANCEMENTS)) for (const id of choices[key]) add(id, "adv", rule.adv);
    return {
      kind: choices.kind,
      username: String(choices.username ?? "").trim(),
      appearance: choices.appearance,
      description: String(choices.description ?? "").trim(),
      major: enhanced ? [...choices.major] : [],
      minor: enhanced ? [...choices.minor] : [],
      software: [...(choices.software ?? [])],
      skills,
    };
  }

  // ---- making one, entering and leaving ----
  // New Avatar: replaces the saved one. The character with it, or null when a choice is missing.
  const create = (character, choices) => (missing(character, choices) ? null : { ...character, avatar: build(character, choices) });
  // Entering needs an avatar; leaving keeps it.
  const enter = (character) => (C.hasAvatar(character) ? { ...character, inNetwork: true } : null);
  const leave = (character) => C.withoutNetwork(character);
  // The New Avatar dialog's starting description: the character's Network Default appearance.
  const defaultDescription = (character) => C.appearance(character).network;

  // ---- reading the saved avatar ----
  // Its username, or the character's handle when it has none.
  const label = (character) => (C.hasAvatar(character) && character.avatar.username) || C.label(character);
  // "Quick Avatar · Abstract Form"
  const kindLabel = (avatar) => [KINDS[avatar?.kind]?.name, APPEARANCES[avatar?.appearance]?.name].filter(Boolean).join(" · ");
  const softwareOf = (avatar) => (Array.isArray(avatar?.software) ? avatar.software : []).filter((id) => SOFTWARE[id]);

  root.NCD_AVATARS = {
    ABOUT, APPEARANCES, SOFTWARE, SOFTWARE_TEXT, KINDS, ENHANCEMENTS, ENHANCEMENTS_TEXT, ENHANCEABLE, ENHANCED_AVATARS, INSTALLATION_WIZARD,
    kindsFor, softwareCount, missing, build, create, enter, leave, defaultDescription, label, kindLabel, softwareOf,
  };
})(globalThis);
