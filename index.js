// Copyright 2025 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict'

/** @typedef {import('./src/wdk-worklet.js').WdkModuleMetadata} WdkModuleMetadata */
/** @typedef {import('./src/wdk-worklet.js').WdkWorkletInit} WdkWorkletInit */

// Export a react-native-bare-kit compatible bundle that generates on postinstall.
export { default as bundle } from './bundle/worklet.bundle.mjs'
export { COMMANDS, MODULES } from './src/rpc-commands.mjs'
