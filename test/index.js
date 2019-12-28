// @ts-check
const Herver = require('../'),
    { join } = require('path'),
    PORT = 8080;

const app = new Herver.App(),
    router = new Herver.Router();

router.post('/echo', async context => {
    context.endWithContent('' + context.queries.get('msg'));
});

router.get(/^\/public(.+)/, async context => {
    context.redirect(context.store[router.storeKey][1]);
});

router.get(/^\//, Herver.createStaticHandler(join(__dirname, 'public')));

app.use(Herver.Utils.requestLogger)
    .use(router.handler)
    .listen(PORT, () => {
        console.log(`Please visit localhost:${PORT}`);
    });
