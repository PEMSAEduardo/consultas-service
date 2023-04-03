import { ClientOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

export const grpcClientOptions: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    url: '0.0.0.0:7000',
    package: 'db', // ['hero', 'hero2']
    protoPath: join(__dirname, './db.proto'), // ['./hero/hero.proto', './hero/hero2.proto']
  },
};