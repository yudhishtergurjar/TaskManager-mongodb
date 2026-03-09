import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Manager API Documentation",
      version: "1.0.0",
      description: "API documentation for the Task Manager Application with MongoDB",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Path to the API docs
  apis: ["./src/routes/*.js"],
};

export const swaggerDocs = swaggerJSDoc(options);
