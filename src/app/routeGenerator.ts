import { Dirent, readdirSync, readFile } from 'fs';
import path from 'path';
import unique from 'array-unique';
import util from 'util';
import { Router, Request, Response, NextFunction } from 'express';
import getEzHeader from '../utils/getEzHeader';
import createError from 'http-errors';

const getFileContent = util.promisify(readFile);
const getDirs = (source: string) =>
  readdirSync(source, { withFileTypes: true });

enum Methods {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  PATCH = 'patch',
  DELETE = 'delete',
}

const getConfig = async (apiDir: string): Promise<any> => {
  let config = null;
  try {
    config = await getFileContent(path.join(apiDir, 'config.json'), 'utf-8');
  } catch {
    config = null;
  }

  return config ? JSON.parse(config) : null;
};

const generateRoute = (rootMockPath: string): any => {
  const endpointDirs = getDirs(rootMockPath) as Dirent[];
  const router: Router = Router();

  endpointDirs.forEach(async (endpointDir: Dirent) => {
    if (endpointDir.isDirectory()) {
      const endpointDirPath = path.join(rootMockPath, endpointDir.name);
      const config = await getConfig(endpointDirPath);

      if (config) {
        const methods = Object.values(Methods);
        const availableMethods = unique([
          ...Object.keys(config),
          'get',
        ]) as typeof methods;

        availableMethods.forEach((method) => {
          if (!methods.includes(method)) return;

          (router as any)[method](
            `/${endpointDir.name}`,
            async (req: Request, res: Response, next: NextFunction) => {
              const { code, timeout } = getEzHeader(req.headers);
              const currentConfig = config[method][code];
              const reqQuery = req.query as any;

              if (!currentConfig) {
                return next(createError(500, 'The config is invalid'));
              }

              let responsePath = path.join(
                rootMockPath,
                endpointDir.name,
                currentConfig.file,
              );

              if (currentConfig.queries) {
                for (const query of currentConfig.queries) {
                  const availableQuery = { ...query };
                  delete availableQuery.file;
                  const queryKeys = [...Object.keys(availableQuery)] as any;

                  if (
                    queryKeys.every((key: any) => query[key] == reqQuery[key])
                  ) {
                    responsePath = path.join(
                      rootMockPath,
                      endpointDir.name,
                      (query as any).file,
                    );
                  }
                }
              }

              try {
                const response = await getFileContent(responsePath, 'utf-8');
                setTimeout(() => {
                  res.status(code).json(JSON.parse(response));
                }, timeout);
              } catch (error: any) {
                next(createError(error));
              }
            },
          );
        });
      } else {
        console.warn(
          `\nThe ${endpointDirPath}\n should have the config.json file`,
        );
      }
    }
  });

  return router;
};

export default generateRoute;
