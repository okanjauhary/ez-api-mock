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

type RouteList = {
  url: string;
  filePath: string;
};

const generateRouteList = (
  rootMockPath: string,
  prevUrl: string = '',
): RouteList[] => {
  const dirs = getDirs(rootMockPath) as Dirent[];
  let list: RouteList[] = [];

  dirs.forEach((dir: Dirent) => {
    if (dir.isDirectory()) {
      const url = `${prevUrl}/${dir.name}`;
      const filePath = path.join(rootMockPath, dir.name);
      const nestedRouteList = generateRouteList(filePath, url);
      list = [...list, { url, filePath }, ...nestedRouteList];
    }
  });

  return list;
};

const generateRoute = (rootMockPath: string): Router => {
  const router: Router = Router();
  const routeList = generateRouteList(rootMockPath);

  routeList.forEach(async (list) => {
    const config = await getConfig(list.filePath);

    if (config) {
      const methods = Object.values(Methods);
      const availableMethods = unique([
        ...Object.keys(config),
        'get',
      ]) as typeof methods;

      availableMethods.forEach((method) => {
        if (!methods.includes(method)) return;

        (router as any)[method](
          list.url,
          async (req: Request, res: Response, next: NextFunction) => {
            const { code, timeout } = getEzHeader(req.headers);
            const currentConfig = config[method][code];
            const reqQuery = req.query as any;

            if (!currentConfig) {
              return next(createError(500, 'The config is invalid'));
            }

            let responsePath = path.join(list.filePath, currentConfig.file);

            if (currentConfig.queries) {
              for (const query of currentConfig.queries) {
                const availableQuery = { ...query };
                delete availableQuery.file;
                const queryKeys = [...Object.keys(availableQuery)] as any;

                if (
                  queryKeys.every((key: any) => query[key] == reqQuery[key])
                ) {
                  responsePath = path.join(list.filePath, (query as any).file);
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
      router.get(
        list.url,
        async (req: Request, res: Response, next: NextFunction) => {
          const { code = 200, timeout } = getEzHeader(req.headers);
          try {
            const response = await getFileContent(
              path.join(list.filePath, 'index.json'),
              'utf-8',
            );
            setTimeout(() => {
              res.status(code).json(JSON.parse(response));
            }, timeout);
          } catch (error: any) {
            next(createError(error));
          }
        },
      );
    }
  });

  return router;
};

export default generateRoute;
