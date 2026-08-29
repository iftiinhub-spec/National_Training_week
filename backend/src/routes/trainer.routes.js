import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { trainerOnly } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { uploadImage, uploadMaterial, verifyUploadedImage } from '../middleware/upload.js';
import { createMaterial, deleteMaterial, downloadOwnMaterial, downloadTrainerCertificate, getTrainerCertificates, getTrainerDashboard, updateMaterial, uploadMaterialFile, updateTrainerProfile } from '../controllers/trainerApplication.controller.js';
import { idParam, trainerProfileValidation, validateObjectIdParam } from '../middleware/validationRules.js';

const router = express.Router();
['id', 'trainingId', 'materialId'].forEach((name) => router.param(name, validateObjectIdParam));
router.use(protect, trainerOnly);
router.get('/dashboard', getTrainerDashboard);
router.get('/certificates', getTrainerCertificates);
router.get('/certificates/:id/download', idParam(), validate, downloadTrainerCertificate);
router.put('/profile', uploadImage.single('photo'), verifyUploadedImage, trainerProfileValidation, validate, updateTrainerProfile);
const materialValidation = [body('title').trim().notEmpty().isLength({ max: 150 }), body('url').isURL({ protocols: ['http', 'https'], require_protocol: true }), body('description').optional().trim().isLength({ max: 500 })];
// An uploaded material keeps its file, so a link is not required when editing one.
const materialUpdateValidation = [body('title').trim().notEmpty().isLength({ max: 150 }), body('url').optional({ checkFalsy: true }).isURL({ protocols: ['http', 'https'], require_protocol: true }), body('description').optional().trim().isLength({ max: 500 })];
const materialUploadValidation = [body('title').optional({ checkFalsy: true }).trim().isLength({ max: 150 }), body('description').optional({ checkFalsy: true }).trim().isLength({ max: 500 })];
router.post('/trainings/:trainingId/materials', idParam('trainingId', 'training ID'), materialValidation, validate, createMaterial);
router.post('/trainings/:trainingId/materials/upload', idParam('trainingId', 'training ID'), uploadMaterial.single('file'), materialUploadValidation, validate, uploadMaterialFile);
router.get('/materials/:materialId/download', idParam('materialId', 'material ID'), validate, downloadOwnMaterial);
router.put('/trainings/:trainingId/materials/:materialId', idParam('trainingId', 'training ID'), idParam('materialId', 'material ID'), materialUpdateValidation, validate, updateMaterial);
router.delete('/trainings/:trainingId/materials/:materialId', idParam('trainingId', 'training ID'), idParam('materialId', 'material ID'), validate, deleteMaterial);
export default router;
