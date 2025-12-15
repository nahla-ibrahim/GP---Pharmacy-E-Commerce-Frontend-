import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroBanner } from './hero-banner/hero-banner';
import { FeatureSection } from './feature-section/feature-section';
import { HomeServ } from '../../../services/home-serv';
import { Category, Homets } from '../../../types/Homets';
import { Branches } from './branches/branches';
import { Banner } from './banner/banner';
import { CategoriesSection } from './categories-section/categories-section';
import { CategoriesProductsSection } from './categories-products-section/categories-products-section';

@Component({
  selector: 'app-home',
  imports: [
    HeroBanner,
    FeatureSection,
    Branches,
    Banner,
    CategoriesSection,
    CategoriesProductsSection,
    RouterLink,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  homeServ = inject(HomeServ);
  categories = signal<Category[]>([]);

  // Load categories for the categories-section component
  homeData = this.homeServ.getHomeData().subscribe((res: Homets) => {
    this.categories.set(res.categories);
  });
}
