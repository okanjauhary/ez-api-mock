const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const routeGenerator = require("./lib/routeGenerator");
const path = require("path");

const app = express();
const PORT = 5050;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", routeGenerator(path.join(__dirname, "example")));

app.listen(PORT, () => console.log(`App running on port ${PORT}`));
