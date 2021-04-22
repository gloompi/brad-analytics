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
const clsFile = path.resolve(logDir, "perf.cls.csv");
const fidFile = path.resolve(logDir, "perf.fid.csv");
const lcpFile = path.resolve(logDir, "perf.lcp.csv");

const fileNames = { LCP: lcpFile, CLS: clsFile, FID: fidFile };

// Setup logfile
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
if (!fs.existsSync(clsFile)) {
  fs.writeFileSync(clsFile, "time,agent,url,val,delta,id\n", { flag: "wx" });
}
if (!fs.existsSync(fidFile)) {
  fs.writeFileSync(fidFile, "time,agent,url,val,delta,id\n", { flag: "wx" });
}
if (!fs.existsSync(lcpFile)) {
  fs.writeFileSync(lcpFile, "time,agent,url,val,delta,id\n", { flag: "wx" });
}

// Server Basic Setup
const server = express();
server.use(cors());

if (config["server-compress"]) {
  server.use(compression({ filter: () => true }));
}

// Disable Asset Caching
server.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

server.get("/", (req, res) => {
  console.log('GET: /')
  res.json({ message: "Ok" });
});

// Performance API
server.post("/analytics", bodyParser.json({ type: "*/*" }), (req, res, next) => {
  const now = new Date().getTime() / 1000;
  const record = `${now},${req.body.agent},${req.body.url},${req.body.value},${req.body.delta},${req.body.id}`;
  console.log(record);

  const fileName = fileNames[(req.body.name || "").toUpperCase()];

  if (!fileName) {
    res.json({ message: "No such metric", value: req.body.name });
    return
  }

  fs.appendFile(fileName, `${record}\n`, (err) => {
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
const port = parseInt(process.env.PORT, 10);
server.listen(port, () => {
  console.log(`Server is listening on port: ${port}/`);
});
server.listen(port+1, () => {
  console.log(`Server is listening on port: ${port+1}/`);
});
