import path from 'path';
import http from 'http';
import { AddressInfo } from 'net';
import { config } from 'dotenv';
config();
import routeGenerator from './app/routeGenerator';
import { createServer } from './app/express';
import { Request, Response, NextFunction } from 'express';

const port = process.env.PORT || 5050;
const host = process.env.HOST || '0.0.0.0';
const mockDir = process.env.MOCK_DIR as string;

const startServer = (): void => {
  const app = createServer();

  app.use('/api', routeGenerator(path.resolve(mockDir)));
  app.use((error: any, _: Request, res: Response, __: NextFunction) => {
    res.status(error.status || 500).json({ error });
  });

  const server = http.createServer(app).listen({ port, host }, () => {
    const info = server.address() as AddressInfo;
    console.log(`\nServer ready at http://${info.address}:${info.port}\n`);
  });
};

startServer();
