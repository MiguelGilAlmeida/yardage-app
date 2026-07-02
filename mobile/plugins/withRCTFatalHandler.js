const { withAppDelegate } = require('@expo/config-plugins')

// The default RCTFatal handler throws an NSException. When called from within
// a TurboModule C++ invocation block, that exception propagates through C++
// and calls terminate(). This plugin replaces it with abort() so the crash
// path is direct and doesn't go through the C++ exception handling.
module.exports = function withRCTFatalHandler(config) {
  return withAppDelegate(config, (mod) => {
    let contents = mod.modResults.contents

    if (contents.includes('RCTSetFatalHandler')) {
      return mod
    }

    // Add the import to the bridging header via AppDelegate import block
    // and install the handler before React Native starts
    contents = contents.replace(
      'internal import Expo\nimport React\nimport ReactAppDependencyProvider',
      'internal import Expo\nimport React\nimport ReactAppDependencyProvider'
    )

    // Insert handler call before the factory/delegate setup
    contents = contents.replace(
      '    let delegate = ReactNativeDelegate()',
      `    RCTSetFatalHandler { error in
      let desc = error?.localizedDescription ?? "unknown fatal error"
      NSLog("[ClothChalk] Fatal RN error: %@", desc)
      abort()
    }

    let delegate = ReactNativeDelegate()`
    )

    mod.modResults.contents = contents
    return mod
  })
}
