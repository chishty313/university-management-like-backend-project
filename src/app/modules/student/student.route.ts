import express from 'express';
import { StudentControllers } from './student.controller';
import validateRequest from '../../middlewares/validateRequest';
import { StudentValidations } from './student.validation';

const router = express.Router();

// Will call controller function
router.get('/', StudentControllers.getAllStudents);
router.get('/:studentID', StudentControllers.getSingleStudent);
router.delete('/:studentID', StudentControllers.deleteStudent);
router.patch(
  '/:studentID',
  validateRequest(StudentValidations.updateStudentValidationSchema),
  StudentControllers.updateStudent,
);

export const StudentRoutes = router;
