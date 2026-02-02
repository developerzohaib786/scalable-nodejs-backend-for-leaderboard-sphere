module.exports = {
  apps : [{
    name: "app-instance-1",
    script: "./src/index.ts",
    interpreter: "ts-node",
    env: { PORT: 3001 }
  },
  {
    name: "app-instance-2",
    script: "./src/index.ts",
    interpreter: "ts-node",
    env: { PORT: 3002 }
  }]
};