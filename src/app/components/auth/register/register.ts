import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../services/auth';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule, FormsModule, NgClass],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  fb = inject(FormBuilder);
  authServ = inject(Auth);
  router = inject(Router);

  isLoading = false;
  isConfirm = false;
  showPassword: boolean = false;
  showPasswordConfirm: boolean = false;
  formGroup!: FormGroup;
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.formvalidation();
  }
  formvalidation() {
    this.formGroup = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{6,}$/)],
      ],
      confirmPassword: ['', [Validators.required]],
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.minLength(11),
          Validators.pattern(/^01[0,1,2,5][0-9]{8}$/),
        ],
      ],
    });
  }
  get firstName() {
    return this.formGroup.get('firstName');
  }
  get lastName() {
    return this.formGroup.get('lastName');
  }
  get email() {
    return this.formGroup.get('email');
  }
  get password() {
    return this.formGroup.get('password');
  }
  get confirmPassword() {
    return this.formGroup.get('confirmPassword');
  }
  get phone() {
    return this.formGroup.get('phoneNumber');
  }

  register() {
    this.error.set(null);
    if (this.formGroup.valid) {
      this.isLoading = true;
      this.authServ.Register(this.formGroup.value).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.router.navigate(['/login'], { queryParams: { success: true } });
        },
        error: (err) => {
          this.isLoading = false;
          this.error.set(err.error.message);
        },
      });
    }
  }
  confirmPass(pass: string, confirm: string) {
    if (pass == confirm) {
      this.isConfirm = true;
    } else {
      this.isConfirm = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
  togglePasswordVisibilityConfirm() {
    this.showPasswordConfirm = !this.showPasswordConfirm;
  }
}
