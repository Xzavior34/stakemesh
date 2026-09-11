import type { MetadataRoute } from "next";

const routes = [
  "",
  "/about",
  "/docs",
  "/docs/architecture",
  "/docs/strategy-engine",
  "/docs/rebalancing",
  "/docs/security",
  "/docs/validator-metrics",
  "/app/overview",
  "/app/validators",
  "/app/strategy",
  "/app/allocation",
  "/app/rebalancing",
  "/app/stake-accounts",
  "/app/history",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://stakemesh.example";
  return routes.map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));
}
