import { Router } from "express";
import { getSectors, getSectorById, insertSector, updateSector, deleteSector } from "../db/queries";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getSectors());
});

router.post("/", (req, res) => {
  const { name, exclusion_zone } = req.body;
  const sector = insertSector({ name, exclusion_zone: exclusion_zone ?? [] });
  res.status(201).json(sector);
});

router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!getSectorById(id)) return res.status(404).json({ error: "Not found" });
  const updated = updateSector(id, req.body);
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!getSectorById(id)) return res.status(404).json({ error: "Not found" });
  deleteSector(id);
  res.status(204).send();
});

export default router;
