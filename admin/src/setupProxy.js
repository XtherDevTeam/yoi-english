const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://192.168.1.26:62100',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '' //remove /api
      }
    })
  );
};