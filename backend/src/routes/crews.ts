import { Router } from "express";
import { getCrews, getCrewById, insertCrew, updateCrew, deleteCrew } from "../db/queries";
import { crewPatchSchema, crewSchema, idParamSchema, parseInput } from "../validation";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getCrews());
});

router.post("/", (req, res) => {
  const input = parseInput(crewSchema, req.body, res);
  if (!input) return;
  const crew = insertCrew(input);
  res.status(201).json(crew);
});

router.patch("/:id", (req, res) => {
  const params = parseInput(idParamSchema, req.params, res);
  if (!params) return;
  const input = parseInput(crewPatchSchema, req.body, res);
  if (!input) return;
  if (!getCrewById(params.id)) return res.status(404).json({ error: "Not found" });
  const updated = updateCrew(params.id, input);
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const params = parseInput(idParamSchema, req.params, res);
  if (!params) return;
  if (!getCrewById(params.id)) return res.status(404).json({ error: "Not found" });
  deleteCrew(params.id);
  res.status(204).send();
});

export default router;
