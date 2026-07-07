import type { ProjectConnector } from "@/schemas/project.schema";

/** Connector with successful OAuth / test on the Connect tab. */
export function isProjectConnectorConnected(connector: ProjectConnector): boolean {
  return connector.connectionStatus === "connected";
}
