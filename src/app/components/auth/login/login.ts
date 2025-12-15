import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../services/auth';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule,RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  route = inject(ActivatedRoute);
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;
  success: string | null = null;

  constructor(private auth: Auth) {}

  ngOnInit(): void {
    this.success = this.route.snapshot.queryParams['success'];
    console.log(this.success);
  }

  onLogin() {
    this.isLoading = true;

    console.log(' Sending login request...');
    console.log(' Email:', this.email);
    console.log(' Password:', this.password);

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log(' Login success:', res);

        // Backend returns 'Token' (capital T) in AuthResponseDTO
        const token = res.token || res.Token;
        if (token) {
          localStorage.setItem('token', token);
          alert('Logged in successfully!');
          // Redirect to home or admin dashboard if admin
          if (res.user?.roles?.includes('Admin')) {
            window.location.href = '/admin/products';
          } else {
            window.location.href = '/home';
          }
        } else {
          alert('Login successful but no token received');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login error:', err);
        console.log(' Error details:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          message: err.message,
        });
        
        // Show user-friendly error message
        const errorMessage = err.error?.message || err.message || 'Login failed. Please check your credentials.';
        alert(`Login failed: ${errorMessage}\n\nAdmin credentials:\nEmail: admin@pharmacy.com\nPassword: Admin123!`);
      },
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
