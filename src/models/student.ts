// src/models/student.ts

export interface Student {
  studentId: string;
  name: string;
  className?: string;
  createdAt?: number;
  updatedAt?: number;
}

export type StudentKey = Student["studentId"];
