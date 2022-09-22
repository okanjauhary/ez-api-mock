// const { readdirSync, readFile } = require("fs");
// const path = require("path");
// const unique = require("array-unique");
// const util = require("util");
// const { Router } = require("express");

import { readdirSync, readFile } from "fs";
import path from "path";
import unique from "array-unique";
import util from "util";
import { Router, Request, Response } from "express";

const getFileContent = util.promisify(readFile);
const getDirs = (source: any) => readdirSync(source, { withFileTypes: true });

const METHODS = ["get", "post", "put", "patch", "delete"];

function generateRoute(targetPath: any) {
  const mockDirContents = getDirs(targetPath);
  const router = Router();

  mockDirContents.forEach(function (mockContent) {
    if (mockContent.isDirectory()) {
      const mockContentItems = getDirs(path.join(targetPath, mockContent.name));
      const mockFiles = mockContentItems.filter(
        file => !file.isDirectory() && path.extname(file.name) === ".json"
      );

      const hasPagination = mockContentItems.find(
        item => item.isDirectory() && item.name === "pagination"
      );

      const availableMethods = unique(
        mockFiles.map(file => file.name.split(".")[0]).concat(["get"])
      );

      availableMethods.forEach(method => {
        if (METHODS.includes(method)) {
          (router as any)[method](`/${mockContent.name}`, (req: Request, res: Response) => {
            const statusCode = Number(req.query.ez_status_code || 200);
            const timeout = Number(req.query.ez_timeout || 0);
            const offset = Number(req.query.offset || 0);

            const responseFilePath =
              hasPagination && statusCode === 200
                ? path.join(
                    targetPath,
                    mockContent.name,
                    "pagination",
                    `${offset}.json`
                  )
                : path.join(
                    targetPath,
                    mockContent.name,
                    `${method}.${statusCode}.json`
                  );

            getFileContent(responseFilePath, "utf8")
              .then(response => {
                setTimeout(() => {
                  res.status(statusCode).send(JSON.parse(response));
                }, timeout);
              })
              .catch(() => {
                res.status(500).send({
                  status: false,
                  message: `Unknown file name ${responseFilePath}`,
                });
              });
          });
        }
      });
    }
  });

  return router;
}

export default generateRoute;
