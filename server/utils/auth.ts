import prisma from "./prisma";
import type { StudentLoginForm, AdminLoginForm } from "~/schemas/LoginSchema";

// Tipo de respuesta exitosa
export interface AuthSuccessResponse {
  success: true;
  message: string;
  data: {
    userType: "student" | "admin";
    id: number | string;
    [key: string]: any;
  };
}

//Autenticamos estudiante
export async function authenticateStudent(
  credentials: StudentLoginForm
): Promise<AuthSuccessResponse> {
  const { student_id, password } = credentials;

  // Buscar estudiante en la base de datos
  const student = await prisma.students.findUnique({
    where: { student_id },
  });

  // Verificar si existe
  if (!student) {
    throw createError({
      statusCode: 401,
      message: "Credenciales incorrectas",
    });
  }

  // Verificar contraseña (comparación directa de texto plano)
  if (password !== student.password) {
    throw createError({
      statusCode: 401,
      message: "Credenciales incorrectas",
    });
  }

  // Retornar datos del estudiante (sin contraseña)
  return {
    success: true,
    message: "Login exitoso",
    data: {
      userType: "student",
      id: student.student_id,
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      career: student.career,
      semester: student.semester,
    },
  };
}

//Autenticamos un administrador
export async function authenticateAdmin(
  credentials: AdminLoginForm
): Promise<AuthSuccessResponse> {
  const { admin_id, password } = credentials;

  // Buscar administrador en la base de datos
  const admin = await prisma.admins.findUnique({
    where: { admin_id },
  });

  // Verificar si existe
  if (!admin) {
    throw createError({
      statusCode: 401,
      message: "Credenciales incorrectas",
    });
  }

  // Verificar contraseña (comparación directa de texto plano)
  if (password !== admin.password) {
    throw createError({
      statusCode: 401,
      message: "Credenciales incorrectas",
    });
  }

  // Retornamos datos del administrador (sin contraseña)
  return {
    success: true,
    message: "Login exitoso",
    data: {
      userType: "admin",
      id: admin.admin_id,
      admin_id: admin.admin_id,
    },
  };
}
