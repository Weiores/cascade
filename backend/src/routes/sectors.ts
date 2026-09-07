import { Router } from "express";
import { getSectors, getSectorById, insertSector, updateSector, deleteSector } from "../db/queries";
import { idParamSchema, parseInput, sectorPatchSchema, sectorSchema } from "../validation";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getSectors());
});

router.post("/", (req, res) => {
  const input = parseInput(sectorSchema, req.body, res);
  if (!input) return;
  const sector = insertSector(input);
  res.status(201).json(sector);
});

router.patch("/:id", (req, res) => {
  const params = parseInput(idParamSchema, req.params, res);
  if (!params) return;
  const input = parseInput(sectorPatchSchema, req.body, res);
  if (!input) return;
  if (!getSectorById(params.id)) return res.status(404).json({ error: "Not found" });
  const updated = updateSector(params.id, input);
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const params = parseInput(idParamSchema, req.params, res);
  if (!params) return;
  if (!getSectorById(params.id)) return res.status(404).json({ error: "Not found" });
  deleteSector(params.id);
  res.status(204).send();
});

export default router;
