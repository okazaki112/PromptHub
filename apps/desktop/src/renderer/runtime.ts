export interface PromptHubRuntimeCapabilities {
  appUpdate: boolean;
  dataRecovery: boolean;
  desktopWindowControls: boolean;
  skillDistribution: boolean;
  skillFileEditing: boolean;
  skillLocalScan: boolean;
  skillPlatformIntegration: boolean;
  skillStore: boolean;
}

export function isWebRuntime(): boolean {
  return (
    typeof window !== "undefined" && window.__PROMPTHUB_WEB__ === true
  );
}

export function getRuntimeCapabilities(): PromptHubRuntimeCapabilities {
  if (isWebRuntime()) {
    return {
      appUpdate: false,
      dataRecovery: false,
      desktopWindowControls: false,
      skillDistribution: false,
      skillFileEditing: false,
      skillLocalScan: false,
      skillPlatformIntegration: false,
      skillStore: false,
    };
  }

  return {
    appUpdate: true,
    dataRecovery: true,
    desktopWindowControls: true,
    skillDistribution: true,
    skillFileEditing: true,
    skillLocalScan: true,
    skillPlatformIntegration: true,
    skillStore: true,
  };
}

export function getWebContext(): PromptHubWebContext | undefined {
  if (!isWebRuntime()) {
    return undefined;
  }

  return window.__PROMPTHUB_WEB_CONTEXT__;
}

export async function logoutWebSession(): Promise<void> {
  const logout = window.__PROMPTHUB_WEB_LOGOUT__;
  if (typeof logout === "function") {
    await logout();
  }
}
