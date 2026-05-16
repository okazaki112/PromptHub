function normalizeVersionLabel(rawValue) {
  if (typeof rawValue !== "string") {
    return null;
  }

  const normalized = rawValue
    .trim()
    .replace(/[`'"\u2018\u2019\u201c\u201d]/g, "")
    .replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  return `version: ${normalized}`;
}

function extractIssueFormValue(body, fieldLabel) {
  if (typeof body !== "string" || typeof fieldLabel !== "string") {
    return null;
  }

  const escapedLabel = fieldLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?:^|\\n)###\\s+${escapedLabel}\\s*\\n([\\s\\S]*?)(?=\\n###\\s+|$)`,
    "i",
  );
  const match = body.match(pattern);
  if (!match) {
    return null;
  }

  const value = match[1]
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line !== "_No response_")
    .join(" ")
    .trim();

  return value || null;
}

function getVersionLabelFromIssueBody(body) {
  const versionValue =
    extractIssueFormValue(body, "Version") ||
    extractIssueFormValue(body, "Target version");
  return normalizeVersionLabel(versionValue);
}

module.exports = {
  extractIssueFormValue,
  getVersionLabelFromIssueBody,
  normalizeVersionLabel,
};
