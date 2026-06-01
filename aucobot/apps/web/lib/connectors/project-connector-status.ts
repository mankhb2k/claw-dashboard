import type { ProjectConnector } from "@/schemas/project.schema";

/** Connector đã OAuth / test thành công ở tab Connect. */
export function isProjectConnectorConnected(connector: ProjectConnector): boolean {
  return connector.connectionStatus === "connected";
}
