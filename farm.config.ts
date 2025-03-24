import { defineConfig } from '@farmfe/core'

import farmPluginPostcss from '@farmfe/js-plugin-postcss'

export default defineConfig({
  compilation: {
    external: ['d3'],
    output: {
      format: 'esm',
    },
  },
  // ... ignore other fields
  plugins: ['@farmfe/plugin-react', farmPluginPostcss()],
})
