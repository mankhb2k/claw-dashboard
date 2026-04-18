"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter());
    const port = Number(process.env.PORT ?? 3001);
    await app.listen(port);
    try {
        const url = await app.getUrl();
        common_1.Logger.log(`Listening on ${url}`, 'Bootstrap');
    }
    catch (err) {
        common_1.Logger.log(`Listening on port ${port}`, 'Bootstrap');
    }
}
bootstrap();
//# sourceMappingURL=main.js.map