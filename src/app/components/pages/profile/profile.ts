import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { Profile } from '../../../services/profile';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;

  constructor(private fb: FormBuilder, private profileService: Profile) {
    this.profileForm = this.fb.group({
      id: [''],
      email: [''],
      roles: [[] as string[]],
      firstName: [''],
      lastName: [''],
      phoneNumber: [''],
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.profileService.getProfile().subscribe((res: any) => {
      this.profileForm.patchValue(res);
    });
  }

  save() {
    if (this.profileForm.valid) {
      this.profileService.updateProfile(this.profileForm.value).subscribe(() => {
        alert('Profile updated successfully!');
      });
    }
  }
}
