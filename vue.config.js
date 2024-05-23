const webpack = require('webpack');

module.exports = {
  devServer: {
    proxy: {
      '/cooper-user': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        pathRewrite: { '^/cooper-user': '/cooper-user' },
      },
    },
    configureWebpack: {
      plugins: [
        new webpack.DefinePlugin({
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(true),
        }),
      ],
    },
  },
};
