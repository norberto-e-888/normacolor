/* eslint-disable @typescript-eslint/no-require-imports */
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { exit } = require("process");

const envFilePath = path.join(__dirname, "/../.env.local");

require("dotenv").config({
  path: envFilePath,
});

// Function to run shell commands
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${stderr}`);
      } else {
        resolve(stdout);
      }
    });
  });
};

const runNgrokCommand = (command) => {
  return new Promise((resolve, reject) => {
    const process = exec(command, { shell: true });

    process.stdout.on("data", (data) => {
      const { url } = data.split(" ").reduce((obj, pair) => {
        const [key, value] = pair.split("=");

        return {
          ...obj,
          [key]: value,
        };
      }, {});

      if (url) {
        resolve(url.trim()); // remove trailing newline char
      }
    });

    process.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(`ngrok process exited with code ${code}`);
      }
    });
  });
};

// Function to update the .env file
const updateEnvFile = (tunnelUrl) => {
  // Read the current .env file
  const envContent = fs.readFileSync(envFilePath, "utf-8");
  const lines = envContent.split("\n");
  const updatedLines = lines.map((line) => {
    // Update the NGROK_TUNNEL variable
    if (line.startsWith("NGROK_TUNNEL=")) {
      return `NGROK_TUNNEL="${tunnelUrl}"`;
    }
    return line; // return unchanged line
  });
  // Write back to the .env file
  fs.writeFileSync(envFilePath, updatedLines.join("\n"));
};

(async () => {
  try {
    if (!process.env.NGROK_TOKEN) {
      console.error("Missing process.env.NGROK_TOKEN");
      exit(1);
    }

    // Run docker compose up
    await runCommand("docker compose up -d");
    console.log("Docker containers are up.");

    // Authenticate with ngrok (you may need to replace YOUR_AUTH_TOKEN with your actual auth token)
    await runCommand(`ngrok config add-authtoken ${process.env.NGROK_TOKEN}`);
    console.log("Authenticated with ngrok.");

    // Create a new ngrok tunnel
    const ngrokUrl = await runNgrokCommand("ngrok http 3000 --log=stdout");

    console.log(`Ngrok tunnel created: ${ngrokUrl}`);
    updateEnvFile(ngrokUrl);
    console.log("Updated NGROK_TUNNEL in .env file.");
  } catch (error) {
    console.error(error);
  }
})();
