const { readdirSync, readFile } = require("fs");
const path = require("path");
const unique = require("array-unique");
const util = require("util");
const { Router } = require("express");

const getFileContent = util.promisify(readFile);
const getDirs = source => readdirSync(source, { withFileTypes: true });
const METHODS = ["get", "post", "put", "patch", "delete"];

function generateRoute(targetPath) {
  const mockDirContents = getDirs(targetPath);
  const router = Router();

  mockDirContents.forEach(function (mockContent) {
    if (mockContent.isDirectory()) {
      const mockFiles = getDirs(path.join(targetPath, mockContent.name)).filter(
        file => !file.isDirectory() && path.extname(file.name) === ".json"
      );

      const availableMethods = unique(
        mockFiles.map(file => file.name.split(".")[0])
      );

      availableMethods.forEach(method => {
        if (METHODS.includes(method)) {
          router[method](`/${mockContent.name}`, (req, res) => {
            const statusCode = Number(req.query.status_code || 200);
            const fileName = `${method}.${statusCode}.json`;

            getFileContent(
              path.join(targetPath, mockContent.name, fileName),
              "utf8"
            )
              .then(response => {
                res.status(statusCode).send(JSON.parse(response));
              })
              .catch(() => {
                res.status(500).send({
                  status: false,
                  message: `Unknown file name ${fileName}`,
                });
              });
          });
        }
      });
    }
  });

  return router;
}

module.exports = generateRoute;
