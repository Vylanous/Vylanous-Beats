# Dependency Risk Register

**Last reviewed:** 2026-08-25

This register records the remaining `bun audit` findings after production web dependencies were pinned to their available patched releases. The application’s web server and browser bundle do not directly execute the high-severity packages listed below. They remain visible in the lockfile through native mobile tooling, desktop packaging, or development/build dependency trees.

| Advisory package  | Current reachability classification       | Ownership and remediation path                                                                                                                           |
| ----------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `brace-expansion` | Mobile/desktop/build tooling              | Wait for parent tooling packages to support a patched compatible major release; do not force an incompatible transitive major into the production build. |
| `extract-zip`     | Desktop packaging                         | Upgrade the Electron packaging chain when the parent release adopts a patched dependency.                                                                |
| `image-size`      | Desktop packaging                         | Upgrade the Electron packaging chain when the parent release adopts a patched dependency.                                                                |
| `js-yaml`         | Desktop packaging/build tooling           | Keep the root patched override and update the upstream packaging chain when it permits a compatible patched version.                                     |
| `nanoid`          | Expo/mobile tooling                       | Upgrade with a compatible Expo dependency update; the production web application does not import this vulnerable branch.                                 |
| `undici`          | Web test tooling and desktop packaging    | The deployed web runtime is pinned to `7.29.0`; remaining paths are test/desktop tooling. Recheck when upstream tooling updates.                         |
| `ws`              | Expo/mobile tooling and desktop packaging | Root/runtime WebSocket versions are pinned to patched releases; remaining legacy paths require upstream mobile or desktop updates.                       |

| Remaining lower-severity package | Classification            |
| -------------------------------- | ------------------------- |
| `@babel/core`, `esbuild`, `uuid` | Build/development tooling |
| `@tootallnate/once`              | Desktop/build tooling     |

The `audit:reachable` CI command fails for any **new or unclassified high/critical** package. It does not hide the documented backlog: `bun audit` remains available for the full inventory. Review this register monthly and after every Expo, Electron, or build-toolchain upgrade.
