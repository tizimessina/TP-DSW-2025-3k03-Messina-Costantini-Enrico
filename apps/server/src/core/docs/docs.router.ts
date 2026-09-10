import { Router, type Request } from "express";
import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocument } from "./openapi.js";

const r = Router();

const serverUrlFrom = (req: Request) => `${req.protocol}://${req.get("host")}`;

r.get("/openapi.json", (req, res) => {
  res.json(generateOpenApiDocument(serverUrlFrom(req)));
});

r.use("/", swaggerUi.serve, (req: Request, res: any, next: any) =>
  swaggerUi.setup(generateOpenApiDocument(serverUrlFrom(req)), {
    customSiteTitle: "AgroApp API",
    swaggerOptions: { persistAuthorization: true },
  })(req, res, next),
);

export default r;
