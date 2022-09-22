import path from 'path';
import http from 'http';
import { AddressInfo } from 'net';
import { config } from 'dotenv';
config();
import routeGenerator from './app/routeGenerator';
import { createServer } from './app/express';

const port = process.env.PORT || 5050;
const host = process.env.HOST || '0.0.0.0';
const mockDir = process.env.MOCK_DIR as string;


const startServer = (): void => {

    const app = createServer();
    
    app.use("/api", routeGenerator(path.resolve(mockDir)));
    
    const server = http.createServer(app).listen({ port, host }, () => {
        const info = server.address() as AddressInfo;
        console.log(`\nServer ready at http://${info.address}:${info.port}\n`)
    })
}


startServer();