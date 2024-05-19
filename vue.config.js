const { defineConfig } = require('@vue/cli-service')
module.exports = {
  devServer: {
    proxy: {
      '/cooper-user': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        pathRewrite: { '^/cooper-user': '' },
      },
    },
  },
};