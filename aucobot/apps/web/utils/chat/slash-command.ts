export type SlashCommandItem = {
  /** Full command string, including leading slash (e.g. "/github"). */
  command: string;
  /** OpenClaw skill `name` from SKILL.md frontmatter. */
  skillName: string;
  description?: string;
};

const SKILL_COMMAND_MAX_LENGTH = 32;
const SKILL_COMMAND_FALLBACK = "skill";

function sanitizeSkillCommandName(raw: string): string {
  // Port of openclaw-worker/src/skills/discovery/command-specs.ts
  const normalized = String(raw ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const trimmed = normalized.slice(0, SKILL_COMMAND_MAX_LENGTH);
  return trimmed || SKILL_COMMAND_FALLBACK;
}

function resolveUniqueSkillCommandName(base: string, used: Set<string>): string {
  const normalizedBase = base.toLowerCase();
  if (!used.has(normalizedBase)) {
    used.add(normalizedBase);
    return base;
  }

  for (let index = 2; index < 1000; index += 1) {
    const suffix = `_${index}`;
    const maxBaseLength = Math.max(1, SKILL_COMMAND_MAX_LENGTH - suffix.length);
    const trimmedBase = base.slice(0, maxBaseLength);
    const candidate = `${trimmedBase}${suffix}`;
    const candidateKey = candidate.toLowerCase();
    if (!used.has(candidateKey)) {
      used.add(candidateKey);
      return candidate;
    }
  }

  const fallbackIndex = 1000;
  const fallback = `${base.slice(0, Math.max(1, SKILL_COMMAND_MAX_LENGTH - 2))}_x`;
  // Keep behavior close to worker even if we eventually exceed constraints.
  used.add(fallback.toLowerCase() || `${fallbackIndex}`.toLowerCase());
  return fallback;
}

export function resolveSlashCommandsFromAllowedSkills(opts: {
  /**
   * Skill allowlist order as stored in DB (agent formData.skillNames).
   * This order is used to render the UI list in the same sequence.
   */
  allowedSkillNames: string[];
  skillDescriptionsByName?: Record<string, string | undefined>;
}): SlashCommandItem[] {
  const { allowedSkillNames, skillDescriptionsByName } = opts;

  const used = new Set<string>();
  const items: SlashCommandItem[] = [];

  for (const skillName of allowedSkillNames) {
    const base = sanitizeSkillCommandName(skillName);
    const unique = resolveUniqueSkillCommandName(base, used);

    const description = skillDescriptionsByName?.[skillName];
    items.push({
      command: `/${unique}`,
      skillName,
      description: description?.trim() || undefined,
    });
  }

  return items;
}

export function shortenSingleLine(text: string, maxLen: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLen) return normalized;
  if (maxLen <= 1) return normalized.slice(0, maxLen);
  return normalized.slice(0, maxLen - 1) + "…";
}

