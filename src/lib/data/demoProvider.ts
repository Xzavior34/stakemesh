import type { Validator, ValidatorDataSnapshot } from "@/lib/types";
import type { ValidatorDataProvider } from "./provider";

/**
 * Deterministic pseudo-random generator (mulberry32) so the demo dataset is
 * stable across renders/builds instead of re-randomizing on every request.
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ASN_ORGS: Array<{ asn: number; org: string; datacenters: string[] }> = [
  { asn: 16509, org: "Amazon AWS", datacenters: ["aws-us-east-1", "aws-us-west-2", "aws-eu-west-1"] },
  { asn: 14061, org: "DigitalOcean", datacenters: ["do-nyc1", "do-fra1", "do-sgp1"] },
  { asn: 24940, org: "Hetzner Online", datacenters: ["hetzner-fsn1", "hetzner-hel1"] },
  { asn: 20473, org: "Choopa/Vultr", datacenters: ["vultr-ewr", "vultr-lax"] },
  { asn: 63949, org: "Akamai/Linode", datacenters: ["linode-us-east", "linode-eu-west"] },
  { asn: 396982, org: "Google Cloud", datacenters: ["gcp-us-central1", "gcp-europe-west4"] },
  { asn: 8075, org: "Microsoft Azure", datacenters: ["azure-eastus", "azure-westeurope"] },
  { asn: 60068, org: "CDN77 / Datacamp", datacenters: ["cdn77-ams"] },
  { asn: 51167, org: "Contabo", datacenters: ["contabo-nue1"] },
  { asn: 212238, org: "Latitude.sh", datacenters: ["latitude-sao"] },
  { asn: 174, org: "Cogent Communications", datacenters: ["cogent-dal"] },
  { asn: 3223, org: "Voxility", datacenters: ["voxility-lon"] },
];

const COUNTRIES = ["US", "DE", "SG", "NL", "FR", "JP", "CA", "GB", "AU", "BR"];

const ADJECTIVES = [
  "North",
  "South",
  "East",
  "West",
  "Summit",
  "Harbor",
  "Ridge",
  "Delta",
  "Granite",
  "Cobalt",
  "Ember",
  "Lattice",
  "Meridian",
  "Vector",
  "Anchor",
  "Beacon",
  "Cascade",
  "Horizon",
  "Onyx",
  "Prairie",
];
const NOUNS = ["Stake", "Nodes", "Relay", "Validate", "Point", "Chain", "Path", "Guard", "Peak", "Works"];

function randomIdentity(rand: () => number, i: number): string {
  // Not a real base58 address — clearly a demo identity string.
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let out = "Demo";
  for (let n = 0; n < 20; n++) out += chars[Math.floor(rand() * chars.length)];
  return `${out}${i}`;
}

/** Build the deterministic demo validator directory. */
function buildDemoValidators(): Validator[] {
  const rand = mulberry32(1337);
  const count = 64;
  const validators: Validator[] = [];

  for (let i = 0; i < count; i++) {
    const asnGroup = ASN_ORGS[i % ASN_ORGS.length];
    const datacenter = asnGroup.datacenters[Math.floor(rand() * asnGroup.datacenters.length)];
    const name = `${ADJECTIVES[i % ADJECTIVES.length]} ${NOUNS[Math.floor(rand() * NOUNS.length)]} (Demo)`;
    const votePerformance = clamp(0.88 + rand() * 0.115, 0.5, 0.999);
    const skipRate = clamp(rand() * 0.06, 0, 0.5);
    const commission = Math.round(rand() * 10);
    const activeStake = BigInt(Math.floor(5_000 + rand() * 495_000)) * 1_000_000_000n; // 5k-500k SOL
    const version = rand() > 0.15 ? "1.18.11" : rand() > 0.5 ? "1.18.9" : "1.17.34";

    validators.push({
      voteAccount: `DemoVote${i.toString().padStart(3, "0")}${randomIdentity(rand, i).slice(0, 10)}`,
      identity: randomIdentity(rand, i),
      name,
      commission,
      votePerformance,
      skipRate,
      activeStakeLamports: activeStake,
      asn: asnGroup.asn,
      asnOrg: asnGroup.org,
      datacenter,
      country: COUNTRIES[i % COUNTRIES.length],
      version,
      delinquent: rand() > 0.97,
      estimatedApy: clamp(0.055 + rand() * 0.02 - commission * 0.0006, 0.02, 0.09),
      active: rand() > 0.03,
    });
  }

  // A handful of hand-authored validators to make the five documented demo
  // scenarios (see /docs/architecture) reachable deterministically:
  // one dominant-ASN cluster, one clean high performer, one degrading
  // performer, one over-commission validator.
  validators.push(
    {
      voteAccount: "DemoVoteScenarioAsnHeavy1",
      identity: "DemoIdentityAsnHeavy1",
      name: "Cobalt Stake Heavy (Demo)",
      commission: 4,
      votePerformance: 0.98,
      skipRate: 0.01,
      activeStakeLamports: 300_000_000_000_000n,
      asn: 16509,
      asnOrg: "Amazon AWS",
      datacenter: "aws-us-east-1",
      country: "US",
      version: "1.18.11",
      delinquent: false,
      estimatedApy: 0.071,
      active: true,
    },
    {
      voteAccount: "DemoVoteScenarioDegraded1",
      identity: "DemoIdentityDegraded1",
      name: "Ember Relay Legacy (Demo)",
      commission: 5,
      votePerformance: 0.83, // below a typical 90% policy minimum — triggers rebalance
      skipRate: 0.09,
      activeStakeLamports: 40_000_000_000_000n,
      asn: 174,
      asnOrg: "Cogent Communications",
      datacenter: "cogent-dal",
      country: "US",
      version: "1.17.34",
      delinquent: false,
      estimatedApy: 0.058,
      active: true,
    }
  );

  return validators;
}

const DEMO_VALIDATORS = buildDemoValidators();

function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}

export class DemoValidatorDataProvider implements ValidatorDataProvider {
  readonly kind = "demo" as const;

  async getSnapshot(): Promise<ValidatorDataSnapshot> {
    return {
      source: "demo",
      epochLabel: "Demo Epoch 642",
      fetchedAt: new Date().toISOString(),
      validators: DEMO_VALIDATORS,
    };
  }
}
