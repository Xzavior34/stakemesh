import { Connection } from "@solana/web3.js";
import type { Validator, ValidatorDataSnapshot } from "@/lib/types";
import type { ValidatorDataProvider } from "./provider";

/**
 * Live validator data sourced from a Solana RPC endpoint via
 * `getVoteAccounts` and `getVersion`/`getEpochInfo`.
 *
 * HONEST LIMITATION: standard Solana RPC does not expose ASN, datacenter, or
 * geographic location for a validator's gossip endpoint. Producing that data
 * reliably requires either a network crawl (e.g. resolving gossip IPs
 * through an IP-to-ASN database) or a third-party validator-analytics API.
 * This reference implementation does not operate that infrastructure, so
 * live-sourced validators report `asn: 0`, `asnOrg: null`, `datacenter:
 * "unknown"`, and `country: null` rather than inventing plausible-looking
 * values. The UI's data-source indicator reflects this: live mode will show
 * blank ASN/datacenter concentration wherever the underlying data is
 * missing, instead of a fabricated number.
 *
 * A production deployment should replace `resolveInfrastructureMetadata`
 * below with a call to a real IP-intelligence or validator-analytics
 * service, at which point every downstream consumer (allocation,
 * concentration, rebalancing) starts receiving real ASN/datacenter data with
 * no further changes required.
 */
export class LiveValidatorDataProvider implements ValidatorDataProvider {
  readonly kind = "live" as const;
  private readonly connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, "confirmed");
  }

  async getSnapshot(): Promise<ValidatorDataSnapshot> {
    const [voteAccounts, epochInfo, version] = await Promise.all([
      this.connection.getVoteAccounts("confirmed"),
      this.connection.getEpochInfo("confirmed"),
      this.connection.getVersion(),
    ]);

    const all = [...voteAccounts.current, ...voteAccounts.delinquent];
    const delinquentSet = new Set(voteAccounts.delinquent.map((v) => v.votePubkey));

    const validators: Validator[] = all.map((va) => {
      const meta = resolveInfrastructureMetadata();
      return {
        voteAccount: va.votePubkey,
        identity: va.nodePubkey,
        name: null, // requires validator-info account lookups; left null rather than guessed
        commission: va.commission,
        // epochCredits: array of [epoch, credits, prevCredits]. Use the most
        // recent entry to approximate vote/credit performance.
        votePerformance: estimateVotePerformance(va.epochCredits, epochInfo.slotsInEpoch),
        skipRate: 0, // not derivable from getVoteAccounts alone; requires per-slot leader schedule cross-reference
        activeStakeLamports: BigInt(va.activatedStake),
        asn: meta.asn,
        asnOrg: meta.asnOrg,
        datacenter: meta.datacenter,
        country: meta.country,
        version: null, // per-node version requires getClusterNodes, joined by nodePubkey
        delinquent: delinquentSet.has(va.votePubkey),
        estimatedApy: 0, // requires inflation + epoch reward history; left at 0 rather than guessed
        active: true,
      };
    });

    return {
      source: "live",
      epochLabel: `Epoch ${epochInfo.epoch} (agave/solana-labs ${version["solana-core"]})`,
      fetchedAt: new Date().toISOString(),
      validators,
    };
  }
}

function estimateVotePerformance(
  epochCredits: Array<[number, number, number]>,
  slotsInEpoch: number
): number {
  if (!epochCredits.length) return 0;
  const [, credits, prevCredits] = epochCredits[epochCredits.length - 1];
  const earned = credits - prevCredits;
  if (slotsInEpoch <= 0) return 0;
  // Credits roughly track slots voted on; this is an approximation, not an
  // official metric — see /docs/validator-metrics.
  return Math.max(0, Math.min(1, earned / slotsInEpoch));
}

function resolveInfrastructureMetadata(): {
  asn: number;
  asnOrg: string | null;
  datacenter: string;
  country: string | null;
} {
  // See class-level doc comment: no ASN/geo service is wired up in this
  // reference implementation. Returning honest "unknown" values rather than
  // fabricating plausible-looking infrastructure data.
  return { asn: 0, asnOrg: null, datacenter: "unknown", country: null };
}
