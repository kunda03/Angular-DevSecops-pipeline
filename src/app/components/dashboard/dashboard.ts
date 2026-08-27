import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { StudentService } from '../../services/student.service';
import { Student } from '../../models/student';
import { SummaryCard } from '../summary-card/summary-card';
import { Chart } from 'chart.js/auto';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
  CommonModule,
  ReactiveFormsModule,
  SummaryCard
],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  // ===========================
// Chart Variable
// ===========================

// Store Chart Instance
marksChart: any;

// Store Search Form
searchForm!: FormGroup;


createSearchForm(): void {

  this.searchForm = this.fb.group({

    search: ['']

  });

}
  // ===========================
  // Student Data
  // ===========================

  // Store all students fetched from API
  students: Student[] = [];

  // Store filtered students after search
  filteredStudents: Student[] = [];

  // ===========================
// Sorting Variables
// ===========================

// Store current sorting column
sortColumn: string = '';

// Store sorting direction (Ascending / Descending)
sortDirection: boolean = true;


sortStudents(column: string): void {

  // If same column is clicked, change sorting direction
  if (this.sortColumn === column) {

    this.sortDirection = !this.sortDirection;

  } else {

    // Set new sorting column
    this.sortColumn = column;

    // Default sorting direction
    this.sortDirection = true;

  }

  // Sort students
  this.filteredStudents.sort((a: any, b: any) => {

    let valueA = a[column];
    let valueB = b[column];

    // Convert string values to lowercase
    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    if (valueA < valueB) {
      return this.sortDirection ? -1 : 1;
    }

    if (valueA > valueB) {
      return this.sortDirection ? 1 : -1;
    }

    return 0;

  });
  // Reset to first page after sorting
this.currentPage = 1;

}

  // ===========================
  //  Summary Dashboard Cards
  // ===========================

  totalStudents: number = 0;
  activeStudents: number = 0;
  totalCourses: number = 0;
  pendingFees: number = 0;

  // ===========================
// Selected Student
// ===========================

// Store selected student details
selectedStudent: Student | null = null;


// Store Reactive Form
studentForm!: FormGroup;


 constructor(
  private studentService: StudentService,
  private fb: FormBuilder
) {}

ngOnInit(): void {

  this.loadStudents();

  this.createForm();

  this.createSearchForm();

}

  // ===========================
  // Load Student Data From API
  // ===========================

  loadStudents(): void {

    this.studentService.getStudents().subscribe({

      next: (data) => {

        // Store API data
        this.students = data;

        // Initially display all students
        this.filteredStudents = this.students;

        // ===========================
        // Dashboard Summary Cards
        // ===========================

        // Total Students
        this.totalStudents = this.students.length;

        // Active Students
        this.activeStudents = this.students.filter(
          student => student.status === 'Active'
        ).length;

        // Total Unique Courses
        this.totalCourses = new Set(
          this.students.map(student => student.course)
        ).size;

        // Pending / Overdue Fees
        this.pendingFees = this.students.filter(
          student => student.feeStatus !== 'Paid'
        ).length;

        console.log(this.students);

        // Create Chart after loading data
this.createChart();

      },

      error: (err) => {

        console.error('Error Loading Students', err);

      }     

    });
    
  }  
  // ===========================
// Create Edit Form
// ===========================

createForm(): void {

  this.studentForm = this.fb.group({

    id: [''],

    name: ['', Validators.required],

    email: ['', [Validators.required, Validators.email]],

    course: ['', Validators.required],

    marks: ['', Validators.required],

    attendance: ['', Validators.required],

    feeStatus: ['', Validators.required],

    status: ['', Validators.required]

  });

}

  // ===========================
// Pagination Variables
// ===========================

// Current page number
currentPage: number = 1;

// Number of records per page
itemsPerPage: number = 10;

// ===========================
// Calculate Total Pages
// ===========================

get totalPages(): number {

  return Math.ceil(
    this.filteredStudents.length / this.itemsPerPage
  );

}

// ===========================
// Previous Page
// ===========================

previousPage(): void {

  if (this.currentPage > 1) {

    this.currentPage--;

  }

}

// ===========================
// Next Page
// ===========================

nextPage(): void {

  if (this.currentPage < this.totalPages) {

    this.currentPage++;

  }

}

// ===========================
// Create Student Marks Chart
// ===========================

createChart(): void {

  // Get Student Names
  const studentNames = this.students.map(student => student.name);

  // Get Student Marks
  const studentMarks = this.students.map(student => student.marks);

  // Create Bar Chart
  this.marksChart = new Chart('marksChart', {

    type: 'bar',

    data: {

      labels: studentNames,

      datasets: [

        {

          label: 'Student Marks',

          data: studentMarks,

          borderWidth: 1

        }

      ]

    },

    options: {

  responsive: true,

  plugins: {

    legend: {

      labels: {

        font: {

          size: 14,
          weight: 'bold'

        }

      }

    }

  },

  scales: {

    y: {

      beginAtZero: true,

      max: 100,

      ticks: {

        font: {

          size: 12,
          weight: 'bold'

        }

      }

    },

    x: {

      ticks: {

        font: {

          size: 12,
          weight: 'bold'

        }

      }

    }

  }

}

  });

}
  // ===========================
  // Search Students
  // ===========================

  searchStudents(): void {

    // Remove extra spaces and convert to lowercase
   const search = (this.searchForm.value.search || '')
  .trim()
  .toLowerCase();
    // If search box is empty show all students
    if (!search) {

      this.filteredStudents = this.students;
      this.currentPage = 1;

      return;

    }
    

    // Filter students by Name or Course
this.filteredStudents = this.students.filter(student =>

  student.name.toLowerCase().includes(search) ||

  student.course.toLowerCase().includes(search)

);

// Reset to first page
this.currentPage = 1;

  }
  
  // ===========================
// Sort Students
// ===========================

// ===========================
// View Student Details
// ===========================

viewStudent(student: Student): void {

  this.selectedStudent = student;

}

// ===========================
// Edit Student
// ===========================

editStudent(student: Student): void {

  console.log(student);

  this.studentForm.patchValue({

    id: student.id,
    name: student.name,
    email: student.email,
    course: student.course,
    marks: student.marks,
    attendance: student.attendance,
    feeStatus: student.feeStatus,
    status: student.status

  });

}

// ===========================
// Update Student
// ===========================

updateStudent(): void {

  // Check form validation
  if (this.studentForm.invalid) {

    return;

  }

  // Get updated student data
  const updatedStudent = this.studentForm.value;

  // Call Update API
  this.studentService.updateStudent(updatedStudent).subscribe({

    next: () => {

      alert('Student Updated Successfully.');

      // Reload latest data
      this.loadStudents();

    },

    error: (err) => {

      console.error('Update Failed', err);

    }

  });

}
// ===========================
// Get Students For Current Page
// ===========================

get paginatedStudents(): Student[] {

  // Calculate starting index of current page
  const startIndex = (this.currentPage - 1) * this.itemsPerPage;

  // Return only current page records
  return this.filteredStudents.slice(
    startIndex,
    startIndex + this.itemsPerPage
  );

}

}