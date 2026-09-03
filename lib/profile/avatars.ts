export type Avatar = { id: string; emoji: string; label: string };

export const AVATAR_OPTIONS: Avatar[] = [
  { id: "fox", emoji: "\u{1F98A}", label: "Fox" },
  { id: "owl", emoji: "\u{1F989}", label: "Owl" },
  { id: "robot", emoji: "\u{1F916}", label: "Robot" },
  { id: "astronaut", emoji: "\u{1F9D1}\u200D\u{1F680}", label: "Astronaut" },
  { id: "wizard", emoji: "\u{1F9D9}", label: "Wizard" },
  { id: "ninja", emoji: "\u{1F977}", label: "Ninja" },
  { id: "cat", emoji: "\u{1F431}", label: "Cat" },
  { id: "dragon", emoji: "\u{1F409}", label: "Dragon" },
];

export function getAvatarEmoji(avatarId: string | null | undefined): string {
  return AVATAR_OPTIONS.find((a) => a.id === avatarId)?.emoji ?? AVATAR_OPTIONS[0].emoji;
}
