import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
)

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm"
const result = spawnSync(
  pnpmCommand,
  ["--silent", "--recursive", "list", "--depth", "-1", "--json"],
  {
    cwd: repositoryRoot,
    encoding: "utf-8",
  }
)

if (result.error || result.status !== 0) {
  console.error("Workspace tag check failed: unable to list pnpm workspaces.")

  if (result.error) console.error(result.error.message)
  if (result.stderr?.trim()) console.error(result.stderr.trim())

  process.exit(1)
}

let projects

try {
  projects = JSON.parse(result.stdout)
} catch {
  console.error("Workspace tag check failed: pnpm returned invalid JSON.")
  process.exit(1)
}

if (!Array.isArray(projects)) {
  console.error("Workspace tag check failed: pnpm returned an invalid result.")
  process.exit(1)
}

const errors = []
const seenPaths = new Set()
const workspaces = []

for (const project of projects) {
  if (!project || typeof project.path !== "string") {
    errors.push("pnpm returned a workspace without a valid path.")
    continue
  }

  const absolutePath = path.resolve(repositoryRoot, project.path)

  if (absolutePath === repositoryRoot) continue

  const relativePath = path.relative(repositoryRoot, absolutePath)
  const portablePath = relativePath.split(path.sep).join("/")

  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    errors.push(`${project.path}: workspace is outside the repository.`)
    continue
  }

  if (seenPaths.has(portablePath)) {
    errors.push(`${portablePath}: duplicate workspace path.`)
    continue
  }

  seenPaths.add(portablePath)
  workspaces.push({ absolutePath, portablePath })
}

if (workspaces.length === 0) {
  errors.push("No workspaces were discovered.")
}

workspaces.sort((left, right) =>
  left.portablePath.localeCompare(right.portablePath)
)

const isExactArray = (actual, expected) =>
  Array.isArray(actual) &&
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index])

for (const workspace of workspaces) {
  const parts = workspace.portablePath.split("/")

  if (parts.length !== 2 || (parts[0] !== "apps" && parts[0] !== "packages")) {
    errors.push(
      `${workspace.portablePath}: workspace must be directly under apps/ or packages/.`
    )
    continue
  }

  const expectedTag = parts[0] === "apps" ? "layer-app" : "layer-package"
  const turboPath = path.join(workspace.absolutePath, "turbo.json")

  let config

  try {
    config = JSON.parse(readFileSync(turboPath, "utf-8"))
  } catch (error) {
    if (error?.code === "ENOENT") {
      errors.push(`${workspace.portablePath}: missing turbo.json.`)
    } else {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${workspace.portablePath}: invalid turbo.json (${message}).`)
    }
    continue
  }

  if (!config || typeof config !== "object" || Array.isArray(config)) {
    errors.push(`${workspace.portablePath}: turbo.json must contain an object.`)
    continue
  }

  if (!isExactArray(config.extends, ["//"])) {
    errors.push(`${workspace.portablePath}: "extends" must be exactly ["//"].`)
  }

  if (!isExactArray(config.tags, [expectedTag])) {
    errors.push(
      `${workspace.portablePath}: "tags" must be exactly ["${expectedTag}"].`
    )
  }
}

if (errors.length > 0) {
  console.error(`Workspace tag check failed (${errors.length} issue(s)):`)

  for (const error of errors) {
    console.error(`- ${error}`)
  }

  process.exitCode = 1
} else {
  console.log(
    `Workspace tag check passed: ${workspaces.length} workspaces checked.`
  )
}
