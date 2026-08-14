import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { trainerOnly } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { uploadImage } from '../middleware/upload.js';
import { createMaterial, deleteMaterial, getTrainerDashboard, updateMaterial, updateTrainerProfile } from '../controllers/trainerApplication.controller.js';

const router = express.Router();
router.use(protect, trainerOnly);
router.get('/dashboard', getTrainerDashboard);
router.put('/profile', uploadImage.single('photo'), updateTrainerProfile);
const materialValidation = [body('title').trim().notEmpty().isLength({ max: 150 }), body('url').isURL({ protocols: ['http', 'https'], require_protocol: true }), body('description').optional().trim().isLength({ max: 500 })];
router.post('/trainings/:trainingId/materials', materialValidation, validate, createMaterial);
router.put('/trainings/:trainingId/materials/:materialId', materialValidation, validate, updateMaterial);
router.delete('/trainings/:trainingId/materials/:materialId', deleteMaterial);
export default router;
