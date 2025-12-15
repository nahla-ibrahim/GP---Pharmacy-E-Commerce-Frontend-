import { computed, Injectable, signal } from '@angular/core';
import { FavCart } from '../types/cart';

@Injectable({
  providedIn: 'root',
})
export class FavServ {
  favCount = signal(0);
  favlist = signal<FavCart[]>(JSON.parse(localStorage.getItem('fav') || '[]'));

  constructor() {
    this.favCount.set(this.getallfav());
  }
  getallfav(): number {
    let favproduct = localStorage.getItem('fav');
    const favproductArray: FavCart[] = favproduct ? JSON.parse(favproduct) : [];
    let totalQuantity = favproductArray.length;
    return totalQuantity;
  }

  addToFav(id: number) {
    this.favlist.update((favs: FavCart[]) => {
      const exciting = favs.find((item: FavCart) => item.id == id);
      let updated;
      if (exciting) {
        updated = favs.filter((item) => item.id != id);
      } else {
        updated = [...favs, { id }];
      }
      localStorage.setItem('fav', JSON.stringify(updated));
      return updated;
    });

    this.favCount.set(this.getallfav());
  }
  clearAllFav() {
  localStorage.removeItem('fav');
  this.favlist.set([]);
  this.favCount.set(0);
}


  isFav = (id: number) => computed(() => this.favlist().some((f) => f.id === id));
}
