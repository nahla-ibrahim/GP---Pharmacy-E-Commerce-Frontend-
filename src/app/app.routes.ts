import { Routes } from '@angular/router';
import { SingleProduct } from './components/pages/single-product/single-product';
import { Home } from './components/pages/home/home';
import { adminGuard } from './guards/admin.guard';
import { not } from 'rxjs/internal/util/not';
import { NotFound } from './components/pages/not-found/not-found';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  { path: 'home', component: Home },
  { path: 'product-details/:id', component: SingleProduct },
  // Legacy route - keep for backward compatibility
  { path: 'singleproduct/:id', component: SingleProduct },

  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'about',
    loadComponent: () => import('./components/pages/about/about').then((m) => m.About),
  },
  {
    path: 'contact',
    loadComponent: () => import('./components/pages/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'cart',
    loadComponent: () => import('./components/pages/cart/cart').then((m) => m.CartComponent),
  },
  {
    path: 'favorite',
    loadComponent: () =>
      import('./components/pages/favourites/favourites').then((m) => m.FavouritesComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./components/pages/checkout/checkout').then((m) => m.CheckoutComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./components/pages/profile/profile').then((m) => m.ProfileComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'recommendation',
    loadComponent: () =>
      import('./components/pages/recommendation/recommendation').then(
        (m) => m.RecommendationComponent
      ),
  },
  {
    path: 'admin/products',
    loadComponent: () =>
      import('./components/pages/admin/admin-products/admin-products').then(
        (m) => m.AdminProductsComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./components/pages/admin/admin-dashboard/admin-dashboard').then(
        (m) => m.AdminDashboardComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/banners',
    loadComponent: () =>
      import('./components/pages/admin/admin-banners/admin-banners').then(
        (m) => m.AdminBannersComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/orders',
    loadComponent: () =>
      import('./components/pages/admin/admin-orders/admin-orders').then(
        (m) => m.AdminOrdersComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'OperationTeamDashboard',
    redirectTo: '/admin/orders',
    pathMatch: 'full',
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./components/pages/products/products').then((m) => m.ProductsComponent),
  },
  {
    path: 'category/:id',
    loadComponent: () =>
      import('./components/pages/category-details/category-details').then(
        (m) => m.CategoryDetailsComponent
      ),
  },
  {
    path: '**',
    component: NotFound,
  },
];
