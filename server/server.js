/**
 * server.js
 * Webserver simulation. You shouldn't need to modify this as part of the
 * training
 */
const fs = require("fs");
const path = require("path");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const compression = require("compression");

const config = JSON.parse(fs.readFileSync("package.json")).config;

const publicDir = path.resolve(__dirname, "../public");
const logDir = path.resolve(__dirname, "../logs");
const logFile = path.resolve(logDir, "perf.log.csv");

// Setup logfile
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, "time,url,dcl,load,fcp,lcp,cls,fid\n", { flag: "wx" });
}

// Server Basic Setup
const server = express();
server.use(cors);

if (config["server-compress"]) {
  server.use(compression({ filter: () => true }));
}

// Disable Asset Caching
server.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Performance API
server.post("/analytics", bodyParser.json({ type: "*/*" }), (req, res, next) => {
  const now = new Date().getTime() / 1000;
  const record = `${now},${req.body.url},${req.body.dcl},${req.body.load},${req.body.fcp},${req.body.lcp},${req.body.cls},${req.body.fid}`;
  console.log(record);

  fs.appendFile(logFile, `${record}\n`, (err) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    }
    else {
      res.sendStatus(200);
    }
    next();
  });

});

// Public file hosting
server.use(express.static(publicDir, { etag: false }));

// Start Server
const port = parseInt(config["server-port"], 10);
server.listen(port, () => {
  console.log(`Server is listening on port: ${port}/`);
});
server.listen(port+1, () => {
  console.log(`Server is listening on port: ${port+1}/`);
});
