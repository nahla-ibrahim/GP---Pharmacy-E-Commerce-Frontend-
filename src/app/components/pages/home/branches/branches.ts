import { Component, inject, signal } from '@angular/core';
import { HomeServ } from '../../../../services/home-serv';
import { Category } from '../../../../types/Homets';
import { BranchServ } from '../../../../services/branch-serv';
import { BranchesTs } from '../../../../types/branches';

@Component({
  selector: 'app-branches',
  imports: [],
  templateUrl: './branches.html',
  styleUrl: './branches.css',
})
export class Branches {
  homeServ = inject(HomeServ);
  branchServ = inject(BranchServ);
  brances = signal<BranchesTs[]>([]);
  categories = signal<Category[]>([]);
  getCategories = this.homeServ.getHomeData().subscribe((res) => {
    // Filter out categories without imageUrl
    const categoriesWithImages = (res.categories || []).filter(
      (category) => category.imageUrl && category.imageUrl.trim() !== ''
    );
    this.categories.set(categoriesWithImages);
  });
  getBranches = this.branchServ.getBranches().subscribe((res) => {
    this.brances.set(res);
  });
}
