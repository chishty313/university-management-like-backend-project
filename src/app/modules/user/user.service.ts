/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import config from '../../config';
import { AcademicSemester } from '../academicSemester/academicSemester.model';
import { TStudent } from '../student/student.interface';
import { Student } from '../student/student.model';
import { TUser } from './user.interface';
import { User } from './user.model';
import {
  generateAdminId,
  generateFacultyId,
  generateStudentId,
} from './user.utils';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { TFaculty } from '../faculty/faculty.interface';
import { AcademicDepartment } from '../academicDepartment/academicDepartment.model';
import { Faculty } from '../faculty/faculty.model';
import { TAdmin } from '../admin/admin.interface';
import { Admin } from '../admin/admin.model';
import { sendImageToCloudinary } from '../../utils/sendImageToCloudinary';

const createStudentIntoDB = async (
  file: any,
  password: string,
  payload: TStudent,
) => {
  // Create a user object
  const userData: Partial<TUser> = {};

  // If password is not given, use default password
  userData.password = password || (config.default_Password as string);

  // Set student role
  userData.role = 'student';
  // set student email
  userData.email = payload.email;

  // find academic semester info
  const admissionSemester = await AcademicSemester.findById(
    payload.admissionSemester,
  );

  if (!admissionSemester) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Admission semester not found !!!',
    );
  }

  // find deparment
  const academicDepartment = await AcademicDepartment.findById(
    payload.academicDepartment,
  );

  if (!academicDepartment) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Acadedmic departtment not found !!!',
    );
  }

  payload.academicFaculty = academicDepartment.academicFaculty;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    // Set generated ID
    userData.id = await generateStudentId(admissionSemester);

    if (file) {
      const imageName = `${userData.id}-${payload.name.firstName}-${payload.name.middleName}-${payload.name.lastName}`;

      // send image to cloudinary
      const { secure_url } = await sendImageToCloudinary(imageName, file?.path);
      payload.profileImg = secure_url as string;
    }

    // create a user (transaction - 01)
    const newUser = await User.create([userData], { session }); // Built in static method

    // create a student
    if (!newUser.length) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create user');
    }
    // set id, _id as user
    payload.id = newUser[0].id;
    payload.user = newUser[0]._id; // Reference _id

    // create a student (transaction - 02)
    const newStudent = await Student.create([payload], { session });

    if (!newStudent.length) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create student');
    }
    await session.commitTransaction();
    await session.endSession();
    return newStudent;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create student user');
  }
};

const createFacultyIntoDB = async (
  file: any,
  password: string,
  payload: TFaculty,
) => {
  // create an user object
  const userData: Partial<TUser> = {};

  // if password is not given, use default password
  userData.password = password || (config.default_Password as string);

  // set faculty role
  userData.role = 'faculty';
  // set faculty email
  userData.email = payload.email;

  // find academic department info
  const academicDepartment = await AcademicDepartment.findById(
    payload.academicDepartment,
  );

  if (!academicDepartment) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Academic Department not found');
  }

  payload.academicFaculty = academicDepartment.academicFaculty;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // set faculty id
    userData.id = await generateFacultyId();

    if (file) {
      const imageName = `${userData.id}-${payload.name.firstName}-${payload.name.middleName}-${payload.name.lastName}`;

      // send image to cloudinary
      const { secure_url } = await sendImageToCloudinary(imageName, file?.path);
      payload.profileImage = secure_url as string;
    }

    // create an user (transaction - 01)
    const newUser = await User.create([userData], { session });

    // create a faculty
    if (!newUser.length) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create user');
    }

    // set id, _id as user
    payload.id = newUser[0].id;
    payload.user = newUser[0]._id; // reference id

    // create a faculty (transaction - 02)
    const newFaculty = await Faculty.create([payload], { session });

    if (!newFaculty.length) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create faculty');
    }

    await session.commitTransaction();
    await session.endSession();

    return newFaculty;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();

    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Faculty user');
  }
};

const createAdminIntoDB = async (
  file: any,
  password: string,
  payload: TAdmin,
) => {
  // create a user object
  const userData: Partial<TUser> = {};

  // if password is not given, use default password
  userData.password = password || (config.default_Password as string);

  // set admin role
  userData.role = 'admin';
  // set admin email
  userData.email = payload.email;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // set generated admin id
    userData.id = await generateAdminId();

    if (file) {
      const imageName = `${userData.id}-${payload.name.firstName}-${payload.name.middleName}-${payload.name.lastName}`;

      // send image to cloudinary
      const { secure_url } = await sendImageToCloudinary(imageName, file?.path);
      payload.profileImage = secure_url as string;
    }

    // create a user (transaction - 01)
    const newUser = await User.create([userData], { session });

    if (!newUser.length) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create user');
    }

    // set id, _id as user
    payload.id = newUser[0].id;
    payload.user = newUser[0]._id; // reference id

    // create an admin (transaction - 02)
    const newAdmin = await Admin.create([payload], { session });

    if (!newAdmin.length) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create an admin');
    }

    await session.commitTransaction();
    await session.endSession();

    return newAdmin;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();

    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Admin user');
  }
};

const getMeFromDB = async (userId: string, role: string) => {
  if (role === 'student') {
    return await Student.findOne({ id: userId })
      .populate('user')
      .populate('admissionSemester')
      .populate('academicDepartment');
  } else if (role === 'faculty') {
    return await Faculty.findOne({ id: userId }).populate('user');
  } else if (role === 'admin') {
    return await Admin.findOne({ id: userId }).populate('user');
  } else {
    return null;
  }
};

const changeStatusIntoDB = async (id: string, payload: { status: string }) => {
  const result = await User.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

export const UserServices = {
  createStudentIntoDB,
  createFacultyIntoDB,
  createAdminIntoDB,
  getMeFromDB,
  changeStatusIntoDB,
};
