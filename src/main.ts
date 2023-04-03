import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      logger: ['warn'],
      transport: Transport.GRPC,
      options: {
        url: '0.0.0.0:7000',
        package: 'db', // ['hero', 'hero2']
        protoPath: join(__dirname, './db.proto'), // ['./hero/hero.proto', './hero/hero2.proto']
      },
    },
  );
  app.listen();
  
  console.log(`App running `);
}
bootstrap();
