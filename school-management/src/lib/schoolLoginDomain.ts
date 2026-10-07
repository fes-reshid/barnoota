/**
 * A short, readable "login domain" derived from the school's name, used only
 * for display (e.g. on a printed student ID card as `S-2001@<domain>`) so a
 * student's login identifier is recognizable as "theirs". It is not a real,
 * receivable email address/domain — actual sign-in still goes through
 * whatever account the school admin has set up for that student.
 */
export function schoolLoginDomain(schoolName: string): string {
  const slug = schoolName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);
  return `${slug || 'school'}.edu`;
}
