import { defineConfig } from '@farmfe/core'

import farmPluginPostcss from '@farmfe/js-plugin-postcss'

export default defineConfig({
  // ... ignore other fields
  plugins: ['@farmfe/plugin-react', farmPluginPostcss()],
})
