import { Bonjour } from "bonjour-service";

export interface DiscoveredPeer {
  hostname: string;
  ip: string;
  port: number;
  packages: number;
}

let bonjourInstance: Bonjour | undefined;

export function startMdnsBroadcast(port: number, packageCount: number): void {
  stopMdnsBroadcast();
  bonjourInstance = new Bonjour();
  bonjourInstance.publish({
    name: `PackVault-${process.env.HOSTNAME ?? "node"}`,
    type: "packvault",
    port,
    txt: { packages: String(packageCount) }
  });
}

export function stopMdnsBroadcast(): void {
  bonjourInstance?.unpublishAll(() => bonjourInstance?.destroy());
  bonjourInstance = undefined;
}

export function discoverPeers(timeoutMs = 3000): Promise<DiscoveredPeer[]> {
  return new Promise((resolve) => {
    const bonjour = new Bonjour();
    const peers: DiscoveredPeer[] = [];
    const browser = bonjour.find({ type: "packvault" });

    browser.on("up", (service) => {
      const ip = service.addresses?.find((a) => a.includes(".")) ?? service.host;
      peers.push({
        hostname: service.name,
        ip,
        port: service.port,
        packages: parseInt(service.txt?.packages ?? "0", 10)
      });
    });

    setTimeout(() => {
      browser.stop();
      bonjour.destroy();
      resolve(peers);
    }, timeoutMs);
  });
}
