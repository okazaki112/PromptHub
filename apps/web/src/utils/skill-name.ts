export function toSkillSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ensureSkillName(value: string, fallback: string): string {
  const slug = toSkillSlug(value);
  if (slug) {
    return slug;
  }

  const fallbackSlug = toSkillSlug(fallback);
  if (fallbackSlug) {
    return fallbackSlug;
  }

  return `skill-${Date.now()}`;
}
