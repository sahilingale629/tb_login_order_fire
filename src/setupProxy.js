const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'https://uat-api-algo.tradebulls.in',
            changeOrigin: true,
            pathRewrite: { '^/api': '' },
        })
    );
};
