import { Router } from "express";
import { getEquipment, getEquipmentById, insertEquipment, updateEquipment, deleteEquipment } from "../db/queries";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getEquipment());
});

router.post("/", (req, res) => {
  const { name, type, available } = req.body;
  const equip = insertEquipment({ name, type, available: Boolean(available) });
  res.status(201).json(equip);
});

router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!getEquipmentById(id)) return res.status(404).json({ error: "Not found" });
  const updated = updateEquipment(id, req.body);
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!getEquipmentById(id)) return res.status(404).json({ error: "Not found" });
  deleteEquipment(id);
  res.status(204).send();
});

export default router;
