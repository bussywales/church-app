import "server-only";

const FEATURE_GATE_ENV = "CWB_INTERNAL_PREVIEW_ENABLED";

export function resolveCwbInternalPreviewEnabled(value: string | undefined = process.env[FEATURE_GATE_ENV]) {
  return value === "true";
}

export function isCwbInternalPreviewEnabled() {
  return resolveCwbInternalPreviewEnabled();
}

export function assertCwbInternalPreviewEnabled() {
  if (!isCwbInternalPreviewEnabled()) {
    throw new Error("CWB internal preview is disabled.");
  }
}

export function getCwbFeatureGateDiagnostics() {
  return {
    name: FEATURE_GATE_ENV,
    enabled: isCwbInternalPreviewEnabled(),
    exposedToClient: false,
  };
}
