import express from "express";
import cors from "cors";
import { seedIfEmpty } from "./db/seed";

import requestsRouter from "./routes/requests";
import scheduleRouter from "./routes/schedule";
import optimiseRouter from "./routes/optimise";
import dashboardRouter from "./routes/dashboard";
import crewsRouter from "./routes/crews";
import equipmentRouter from "./routes/equipment";
import sectorsRouter from "./routes/sectors";

seedIfEmpty();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/requests", requestsRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api", optimiseRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/crews", crewsRouter);
app.use("/api/equipment", equipmentRouter);
app.use("/api/sectors", sectorsRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[cascade] CAPO backend running on http://localhost:${PORT}`);
});
