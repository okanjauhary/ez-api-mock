const routeGenerator = require("./lib/routeGenerator");
const path = require("path");

routeGenerator(path.join(__dirname, "mocks"));
