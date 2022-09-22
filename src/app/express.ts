import express, { Application } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const createServer = (): Application => {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    return app;
}

export { createServer }