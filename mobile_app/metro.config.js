const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Force Babel to transform all packages that may use private class fields
// The 'hermes-stable' profile skips this transform causing crashes on Expo Go
config.transformIgnorePatterns = [
  'node_modules/(?!(' + [
    'react-native',
    '@react-native',
    '@react-navigation',
    'expo',
    '@expo',
    '@unimodules',
    'unimodules',
    '@supabase',
    'react-native-url-polyfill',
    'whatwg-url',
    'whatwg-encoding',
    'tr46',
    'webidl-conversions',
  ].join('|') + '))',
]

module.exports = config
