const webpack = require('webpack');

module.exports = {
  devServer: {
    proxy: {
      '/cooper-docs': {
        target: "http://221.144.190.76:8000",
        changeOrigin: true,
        ws: false,
      },

      '/cooper-user': {
        target: 'http://221.144.190.76:8000',
        changeOrigin: true,
        pathRewrite: { '^/cooper-user': '/cooper-user' },
      },
    },
  },
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(true),
      }),
    ],
  },
};
