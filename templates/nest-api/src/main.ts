import "reflect-metadata";
import { Controller, Get, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

@Controller()
class AppController {
  @Get("/health")
  health() {
    return { ok: true, service: "__PROJECT_NAME__" };
  }
}

@Module({
  controllers: [AppController]
})
class AppModule {}

const app = await NestFactory.create(AppModule);
await app.listen(Number(process.env.PORT ?? 3000));
