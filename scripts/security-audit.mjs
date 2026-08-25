import { spawnSync } from "node:child_process";

const acceptedNonWebHighPackages = new Set([
  "brace-expansion",
  "extract-zip",
  "image-size",
  "js-yaml",
  "nanoid",
  "undici",
  "ws",
]);

const audit = spawnSync("bun", ["audit", "--json"], { encoding: "utf8" });
if (!audit.stdout.trim()) {
  console.error("Dependency audit did not return JSON output.");
  process.exit(1);
}

let findings;
try {
  findings = JSON.parse(audit.stdout);
} catch (error) {
  console.error("Dependency audit returned invalid JSON.", error);
  process.exit(1);
}

const unreviewedReachable = Object.entries(findings).flatMap(([packageName, advisories]) =>
  advisories
    .filter((advisory) => advisory.severity === "high" || advisory.severity === "critical")
    .filter(() => !acceptedNonWebHighPackages.has(packageName))
    .map((advisory) => ({ packageName, advisory })),
);

if (unreviewedReachable.length > 0) {
  console.error("New or unclassified reachable high/critical dependency advisories detected:");
  for (const { packageName, advisory } of unreviewedReachable) {
    console.error(`- ${packageName}: ${advisory.id} (${advisory.severity}) ${advisory.title}`);
  }
  console.error("Classify and remediate the package before adding a narrowly justified exception.");
  process.exit(1);
}

const acceptedCount = Object.entries(findings).reduce(
  (count, [packageName, advisories]) =>
    count +
    advisories.filter(
      (advisory) =>
        acceptedNonWebHighPackages.has(packageName) &&
        (advisory.severity === "high" || advisory.severity === "critical"),
    ).length,
  0,
);

console.log(
  `Reachable dependency audit passed; ${acceptedCount} documented non-web high advisories remain under upstream ownership.`,
);
