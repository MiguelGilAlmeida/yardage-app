const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// shared/ modules use ESM-style .js extensions — resolve them to .ts files
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.js')) {
    try {
      return context.resolveRequest(context, moduleName.slice(0, -3) + '.ts', platform)
    } catch {}
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
