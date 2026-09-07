import { Router } from "express";
import { getEquipment, getEquipmentById, insertEquipment, updateEquipment, deleteEquipment } from "../db/queries";
import { equipmentPatchSchema, equipmentSchema, idParamSchema, parseInput } from "../validation";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getEquipment());
});

router.post("/", (req, res) => {
  const input = parseInput(equipmentSchema, req.body, res);
  if (!input) return;
  const equip = insertEquipment(input);
  res.status(201).json(equip);
});

router.patch("/:id", (req, res) => {
  const params = parseInput(idParamSchema, req.params, res);
  if (!params) return;
  const input = parseInput(equipmentPatchSchema, req.body, res);
  if (!input) return;
  if (!getEquipmentById(params.id)) return res.status(404).json({ error: "Not found" });
  const updated = updateEquipment(params.id, input);
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const params = parseInput(idParamSchema, req.params, res);
  if (!params) return;
  if (!getEquipmentById(params.id)) return res.status(404).json({ error: "Not found" });
  deleteEquipment(params.id);
  res.status(204).send();
});

export default router;
