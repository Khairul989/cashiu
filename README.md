# Cashback App

## Tech Stack

This project utilizes the following technologies:

- **[AdonisJS](https://adonisjs.com/)**: A Node.js web framework for building scalable applications. The version used is 6.17.2.
- **[MySQL](https://www.mysql.com/)**: A robust relational database management system.
- **[Redis](https://redis.io/)**: An in-memory data structure store used for caching and message brokering.

## Pre-requisites (Not needed if using Docker)

To set up the project locally, ensure the following software is installed on your system:

- Node.js v22
- Redis (latest version)
- MySQL (latest version)

## Installation Guide

Follow these steps to set up the project on your local environment:

1. **Clone the Repository**:

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install Dependencies (Ignore if using Docker)**:
   Install the required Node.js packages:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:

   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Edit the `.env` file to match your local setup (e.g., database credentials, Redis configuration).

4. **Build and Start Docker Containers (Ignore if using local)**:
   Run the following command to build and start the Docker containers:

   ```bash
   docker compose up -d --build
   ```

5. **Run Migrations**:
   Execute database migrations to set up the schema:

   ```bash
   # using docker
   docker compose exec app node ace migration:run
   docker compose exec app node ace db:seed

   #using local
   node ace migration:run --seed
   ```

6. **Run server (Ignore if using Docker)**

   ```bash
   npm run dev
   ```

7. **Access the Application**:
   - Open your browser and navigate to the application URL (default to `http://localhost:3333`).

8. **Jobs**
   - Run the following command to start the job listener for the `process_raw_conversion` queue:  

   ```bash
   # using local
   node ace queue:listen --queue=process_raw_conversion
   ```

## Additional Notes

- Ensure Docker is installed and running on your machine.
- Check the logs using:
  ```bash
  docker compose logs -f
  ```
- Stop the containers with:
  ```bash
  docker compose down
  ```
- Routes are a bit different than standard AdonisJS framework. Routes are mainly in [web.ts](start/routes/web.ts), [api.ts](start/routes/api.ts), [auth.ts](start/routes/auth.ts)

## API Documentation

We use Swagger to display the API endpoints. To generate the documentation, run the following command:

```
node ace docs:generate
```

You can access the API documentation at `http://localhost:3333/docs` (replace `localhost:3333` with your server's address if applicable).

To enable the documentation, set the `SWAGGER` environment variable to `true` in your `.env` file.

## Build

```
node ace build
```

## Generating webhook for testing

Encode the product ID and commission rate 
```
node ace repl
const feistel = await import("feistel-cipher");
const { default: env } = await import("#start/env");
const product_id = cipherx.encrypt("3").toString('hex');
const commission_rate = cipherx.encrypt("0.08").toString('hex');
```

## Debugging

Config that can be used for vscode debugger
```
{
    "version": "0.2.0",
    "configurations": [
      {
        "type": "node",
        "request": "launch",
        "name": "Debug AdonisJS Direct",
        "runtimeExecutable": "node",
        "args": [
          "ace",
          "serve",
          "--hmr"
        ],
        "cwd": "${workspaceFolder}/src",
        "console": "integratedTerminal",
        "internalConsoleOptions": "neverOpen",
        "env": {
          "NODE_ENV": "development"
        },
        "skipFiles": [
          "<node_internals>/**"
        ]
      }
    ]
  }
```

# Deployment step for staging

## Docker Compose unchange


## Docker Compose change

## run command