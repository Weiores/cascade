import { Router } from "express";
import { getCrews, getCrewById, insertCrew, updateCrew, deleteCrew } from "../db/queries";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getCrews());
});

router.post("/", (req, res) => {
  const { name, skills, available_start, available_end, max_concurrent_jobs } = req.body;
  const crew = insertCrew({ name, skills, available_start, available_end, max_concurrent_jobs });
  res.status(201).json(crew);
});

router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!getCrewById(id)) return res.status(404).json({ error: "Not found" });
  const updated = updateCrew(id, req.body);
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!getCrewById(id)) return res.status(404).json({ error: "Not found" });
  deleteCrew(id);
  res.status(204).send();
});

export default router;
