import { spawn } from "node:child_process";

const port = process.env.PORT || "4173";
const args = [
  "./node_modules/serve/build/main.js",
  "-s",
  "dist",
  "-l",
  `tcp://0.0.0.0:${port}`,
];

const child = spawn(process.execPath, args, { stdio: "inherit" });

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
