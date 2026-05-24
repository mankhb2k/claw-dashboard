export const enSkills = {
  page: {
    headerSkill: "Skill",
    titleWithProject: "{{name}} · Skill",
    leadPart1:
      "A skill folder contains SKILL.md with YAML frontmatter and agent instructions. See ",
    leadPart2: " for format and where to place files.",
    docsLinkLabel: "Creating skills",
    tabBuilder: "Builder",
    tabMarkdown: "Markdown",
    markdownHint:
      "Edit the full file directly. Switching back to Builder will not sync into the form fields.",
    fieldName: "Skill id (name)",
    fieldNameHint:
      "Lowercase letters, digits, hyphens — e.g. my-telegram-notify",
    fieldDescription: "One-line description",
    fieldDescriptionHint:
      "The agent uses this line to decide when to apply the skill.",
    fieldHeading: "In-file heading (optional)",
    fieldHeadingHint:
      "If empty, a title is derived from the id (e.g. my-skill → My skill).",
    fieldWhenToUse: "When to use",
    fieldWorkflow: "Workflow",
    fieldNotes: "Notes",
    placeholderWhenToUse:
      "One line per bullet; each non-empty line becomes a list item.",
    placeholderWorkflow: "Steps the agent should follow, one per line.",
    placeholderNotes: "Warnings, edge cases…",
    placeholderMarkdown: "---\\nname: ...\\n---\\n\\n# ...",
    sectionWhenToUse: "When to use",
    sectionWorkflow: "Workflow",
    sectionNotes: "Notes",
    previewTitle: "SKILL.md preview",
    copyButton: "Copy",
    downloadButton: "Download SKILL.md",
    copySuccess: "Copied.",
    copyFail: "Could not copy.",
    downloadFilename: "SKILL.md",
    errNameFormat:
      "Use lowercase letters, digits, and hyphens only; 3–64 characters; must start with a letter or digit.",
    errDescription: "Description is required (max 500 characters).",
    errGeneric: "Please check the fields.",
    loading: "Loading…",
    notFoundTitle: "Not found",
    backToList: "← Back to list",
    projectNotFound: "Project not found.",
    invalidProject: "Invalid project id",
  },
} as const;
