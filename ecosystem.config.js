module.exports = {
  apps: [
    {
      name: "auto-audition",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
