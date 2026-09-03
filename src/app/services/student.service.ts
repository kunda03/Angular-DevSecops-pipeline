import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Student } from '../models/student';

// Environment configuration
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  // API URL comes from environment configuration
  private apiUrl = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) {}

  // Get all students
  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(this.apiUrl);
  }

  // Get student by ID
  getStudentById(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/${id}`);
  }

  // Update student
  updateStudent(student: Student): Observable<Student> {
    return this.http.put<Student>(
      `${this.apiUrl}/${student.id}`,
      student
    );
  }
}