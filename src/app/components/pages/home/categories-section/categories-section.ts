import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HomeServ } from '../../../../services/home-serv';
import { Category } from '../../../../types/Homets';

@Component({
  selector: 'app-categories-section',
  imports: [],
  templateUrl: './categories-section.html',
  styleUrl: './categories-section.css',
})
export class CategoriesSection implements OnInit {
  ngOnInit(): void {
    this.getCategories();
  }
  homeServ = inject(HomeServ);
  router = inject(Router);
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(true);
  
  getCategories() {
    this.isLoading.set(true);
    this.homeServ.getHomeData().subscribe({
      next: (res) => {
        // Filter out categories without imageUrl
        const categoriesWithImages = (res.categories || []).filter(
          (category) => category.imageUrl && category.imageUrl.trim() !== ''
        );
        this.categories.set(categoriesWithImages);
        this.isLoading.set(false);
        console.log('Categories with images:', this.categories());
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.isLoading.set(false);
      }
    });
  }

  navigateToCategory(categoryId: number): void {
    if (categoryId) {
      this.router.navigate(['/category', categoryId]);
    }
  }
}
