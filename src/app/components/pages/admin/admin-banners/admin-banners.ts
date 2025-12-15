import { Component, inject, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, CreateBannerDTO, UpdateBannerDTO, Banner } from '../../../../services/admin-serv';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-banners',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-banners.html',
  styleUrls: ['./admin-banners.css'],
})
export class AdminBannersComponent implements OnInit {
  adminService = inject(AdminService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  banners: Banner[] = [];
  filteredBanners: Banner[] = [];

  // Form state
  showForm: boolean = false;
  isEditMode: boolean = false;
  editingBannerId: number | null = null;
  
  // Delete confirmation modal state
  showDeleteModal: boolean = false;
  bannerToDelete: number | null = null;
  bannerToDeleteTitle: string = '';

  // Form fields
  bannerForm: CreateBannerDTO = {
    title: '',
    description: '',
    link: '',
    displayOrder: 0,
    type: 'Main',
  };

  selectedImage: File | null = null;
  imagePreview: string | null = null;

  // UI state
  isLoading: boolean = false;
  searchTerm: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  ngOnInit() {
    this.checkAuth();
    this.loadBanners();
    this.filteredBanners = [];
  }

  checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login as admin to access this page');
      this.router.navigate(['/login']);
    }
  }

  loadBanners() {
    this.isLoading = true;
    this.errorMessage = '';
    console.log('Starting to load banners...');

    const timeoutId = setTimeout(() => {
      if (this.isLoading) {
        console.warn('Banners load timeout - forcing stop');
        this.isLoading = false;
        this.errorMessage = 'Request timeout. Please check your connection and try again.';
        this.banners = [];
        this.filteredBanners = [];
        this.cdr.detectChanges();
      }
    }, 30000);

    this.adminService.getBanners().subscribe({
      next: (res) => {
        clearTimeout(timeoutId);
        console.log('Banners response received:', res);
        this.isLoading = false;

        if (res && res.success !== undefined) {
          if (res.success && res.data) {
            this.banners = Array.isArray(res.data) ? res.data : [];
            this.searchTerm = '';
            this.filteredBanners = [...this.banners];
            console.log('Banners loaded successfully:', this.banners.length);
            this.cdr.detectChanges();
          } else {
            this.banners = [];
            this.filteredBanners = [];
            this.errorMessage = res.message || 'Failed to load banners';
            console.warn('Banners load failed:', res.message);
            this.cdr.detectChanges();
          }
        } else {
          console.error('Unexpected response structure:', res);
          this.isLoading = false;
          this.banners = [];
          this.filteredBanners = [];
          this.errorMessage = 'Unexpected response format from server';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        clearTimeout(timeoutId);
        console.error('Error loading banners:', err);
        this.isLoading = false;
        this.banners = [];
        this.filteredBanners = [];
        this.errorMessage = err.error?.message || err.message || 'Failed to load banners. Please check if you are logged in as admin.';
        if (err.status === 401 || err.status === 403) {
          alert('Unauthorized. Please login as admin.');
          this.router.navigate(['/login']);
        }
        this.cdr.detectChanges();
      },
      complete: () => {
        clearTimeout(timeoutId);
        console.log('Banners subscription completed');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddForm() {
    this.isEditMode = false;
    this.editingBannerId = null;
    this.resetForm();
    this.showForm = true;
  }

  openEditForm(banner: Banner) {
    this.isEditMode = true;
    this.editingBannerId = banner.id;
    this.bannerForm = {
      title: banner.title,
      description: banner.description,
      link: banner.link,
      displayOrder: banner.displayOrder,
      type: banner.type,
    };
    this.imagePreview = this.getBannerImageUrl(banner.imageUrl) || null;
    this.selectedImage = null;
    this.showForm = true;
    // Reset file input
    setTimeout(() => {
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
    }, 0);
  }

  resetForm() {
    this.bannerForm = {
      title: '',
      description: '',
      link: '',
      displayOrder: 0,
      type: 'Main',
    };
    this.selectedImage = null;
    this.imagePreview = null;
    // Reset file input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.onerror = () => {
        console.error('Error reading file');
        this.selectedImage = null;
      };
      reader.readAsDataURL(file);
    } else {
      // If no file selected, keep the existing preview in edit mode
      if (!this.isEditMode) {
        this.selectedImage = null;
        this.imagePreview = null;
      } else {
        // In edit mode, if user clears the file input, keep existing image
        // Don't clear selectedImage to null - let it stay null so backend knows not to update image
        this.selectedImage = null;
      }
    }
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditMode && this.editingBannerId) {
      // Update banner
      const updateData: UpdateBannerDTO = {
        title: this.bannerForm.title,
        description: this.bannerForm.description,
        link: this.bannerForm.link,
        displayOrder: this.bannerForm.displayOrder,
        type: this.bannerForm.type,
      };

      // Only pass image if a new one was selected
      const imageToUpload = this.selectedImage || undefined;
      
      console.log('Submitting update for banner:', this.editingBannerId);
      console.log('Update data:', updateData);
      console.log('Has new image:', !!imageToUpload);
      
      this.adminService
        .updateBanner(this.editingBannerId, updateData, imageToUpload)
        .subscribe({
          next: (res) => {
            console.log('Update response received:', res);
            this.isLoading = false;
            if (res.success) {
              this.successMessage = 'Banner updated successfully!';
              this.loadBanners();
              this.closeForm();
              setTimeout(() => (this.successMessage = ''), 3000);
            } else {
              this.errorMessage = res.message || 'Failed to update banner';
              console.error('Update failed:', res);
            }
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.message || err.message || 'Failed to update banner';
            console.error('Update error:', err);
            console.error('Error status:', err.status);
            console.error('Error body:', err.error);
          },
        });
    } else {
      // Create banner
      this.adminService
        .createBanner(this.bannerForm, this.selectedImage || undefined)
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            if (res.success) {
              this.successMessage = 'Banner created successfully!';
              this.loadBanners();
              this.closeForm();
              setTimeout(() => (this.successMessage = ''), 3000);
            } else {
              this.errorMessage = res.message || 'Failed to create banner';
            }
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Create error:', err);
            console.error('Error status:', err.status);
            console.error('Error body:', err.error);
            console.error('Full error response:', JSON.stringify(err.error, null, 2));
            
            if (err.error?.errors && Array.isArray(err.error.errors)) {
              console.error('Validation errors:', err.error.errors);
              this.errorMessage = `Validation failed: ${err.error.errors.join(', ')}`;
            } else if (err.error?.modelState) {
              const modelErrors = Object.values(err.error.modelState).flat() as string[];
              console.error('ModelState errors:', modelErrors);
              this.errorMessage = `Validation failed: ${modelErrors.join(', ')}`;
            } else {
              this.errorMessage = err.error?.message || err.message || 'Failed to create banner';
            }
          },
        });
    }
  }

  validateForm(): boolean {
    if (!this.bannerForm.title.trim()) {
      this.errorMessage = 'Banner title is required';
      return false;
    }
    if (!this.bannerForm.description.trim()) {
      this.errorMessage = 'Banner description is required';
      return false;
    }
    if (!this.selectedImage && !this.isEditMode) {
      this.errorMessage = 'Banner image is required';
      return false;
    }
    return true;
  }

  openDeleteModal(banner: Banner) {
    if (!banner || !banner.id) {
      console.error('Invalid banner provided to delete modal');
      return;
    }
    this.bannerToDelete = banner.id;
    this.bannerToDeleteTitle = banner.title || 'this banner';
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.bannerToDelete = null;
    this.bannerToDeleteTitle = '';
  }

  confirmDelete() {
    if (!this.bannerToDelete || typeof this.bannerToDelete !== 'number') {
      console.error('Invalid banner ID for deletion:', this.bannerToDelete);
      this.errorMessage = 'Invalid banner ID';
      this.closeDeleteModal();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.showDeleteModal = false;
    
    const id = this.bannerToDelete;
    this.bannerToDelete = null;
    this.bannerToDeleteTitle = '';
    
    console.log('Deleting banner with ID:', id);
    console.log('ID type:', typeof id);
    
    this.adminService.deleteBanner(id).subscribe({
      next: (res) => {
        console.log('Delete response:', res);
        this.isLoading = false;
        if (res.success) {
          this.successMessage = 'Banner deleted successfully!';
          this.loadBanners();
          setTimeout(() => (this.successMessage = ''), 3000);
        } else {
          this.errorMessage = res.message || 'Failed to delete banner';
          console.error('Delete failed:', res);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || err.message || 'Failed to delete banner';
        console.error('Delete error:', err);
        console.error('Error status:', err.status);
        console.error('Error body:', err.error);
      },
    });
  }

  closeForm() {
    this.showForm = false;
    this.resetForm();
    this.errorMessage = '';
  }

  getBannerImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) return '';
    // If already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // If it's a relative path starting with /, return as is
    if (imageUrl.startsWith('/')) {
      return `http://localhost:5062${imageUrl}`;
    }
    // If it's just a filename or relative path, construct the full URL
    if (imageUrl.startsWith('images/')) {
      return `http://localhost:5062/${imageUrl}`;
    }
    // If it's just a filename, add the path
    return `http://localhost:5062/images/banners/${imageUrl}`;
  }

  filterBanners() {
    if (!this.searchTerm.trim()) {
      this.filteredBanners = Array.isArray(this.banners) ? [...this.banners] : [];
      return;
    }

    const search = this.searchTerm.toLowerCase().trim();
    this.filteredBanners = (Array.isArray(this.banners) ? this.banners : []).filter(
      (b) =>
        b?.title?.toLowerCase().includes(search) ||
        b?.description?.toLowerCase().includes(search) ||
        b?.link?.toLowerCase().includes(search)
    );
  }

  toggleBannerStatus(banner: Banner) {
    const updateData: UpdateBannerDTO = {
      isActive: !banner.isActive,
    };

    this.adminService.updateBanner(banner.id, updateData).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadBanners();
        } else {
          this.errorMessage = res.message || 'Failed to update banner status';
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update banner status';
        console.error('Toggle status error:', err);
      },
    });
  }
}
