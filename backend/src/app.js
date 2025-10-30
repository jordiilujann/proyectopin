import express from "express";
import cors from "cors";
// importa las rutas ya compiladas a build/
import routes from "../build/routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());

// prefijo /api
app.use("/api", routes);

export default app;

