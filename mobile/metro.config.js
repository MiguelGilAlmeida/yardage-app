const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// Allow Metro to resolve modules from the shared/ folder outside mobile/
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Resolve .js imports to .ts files (shared/ module uses ESM-style .js extensions)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.js')) {
    try {
      return context.resolveRequest(context, moduleName.slice(0, -3) + '.ts', platform)
    } catch {}
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
