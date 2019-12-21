// @ts-check
const Herver = require('../'),
    { join } = require('path'),
    PORT = 8080;

const app = new Herver.App(),
    router = new Herver.Router();

router.get('/echo', async context => {
    context.endWithContent('' + context.queries.get('msg'));
});

router.get(/^\//, Herver.createStaticHandler(join(__dirname, 'public')));

app.use(Herver.Utils.requestLogger)
    .use(router.handler)
    .listen(PORT, () => {
        console.log(`Please visit localhost:${PORT}`);
    });
