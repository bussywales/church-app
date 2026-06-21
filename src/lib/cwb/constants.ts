import "server-only";

export const CWB_CODE = "CWB" as const;
export const CWB_LABEL = "CWB Internal Preview" as const;
export const CWB_DISPLAY_STATUS = "First Draft - Review Required" as const;
export const CWB_FULL_WARNING =
  "Internal preview only. Not reviewed, approved, final, published, or released." as const;

export const CWB_EXPECTED_COUNTS = {
  books: 66,
  chapters: 1189,
  verses: 31102,
} as const;

export const CWB_SOURCE_SCHEMA_PROFILE = "legacy-cwb-alpha-v1" as const;
export const CWB_CONSUMER_SCHEMA_VERSION = "church-app-cwb-preview-v1" as const;
