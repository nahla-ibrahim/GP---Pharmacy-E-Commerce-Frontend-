import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

/**
 * Admin Dashboard Component
 * 
 * PROTECTED ROUTE SETUP:
 * The React version used <ProtectedRoute adminOnly={true}>. In Angular, this should be handled
 * via a route guard. Example router configuration:
 * 
 * {
 *   path: 'admin/dashboard',
 *   component: AdminDashboardComponent,
 *   canActivate: [AdminGuard] // or AuthGuard with role check
 * }
 * 
 * Create an AdminGuard that checks:
 * 1. User is authenticated (has valid token)
 * 2. User has 'Admin' role
 * 3. Redirect to login if not authenticated/authorized
 */

interface DashboardItem {
  label: string;
  route: string;
  iconName: string; // Icon name for ng-icons library
  iconColor: string; // Tailwind color class
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent {
  getIconPath(iconName: string): string {
    const iconPaths: Record<string, string> = {
      heroShoppingBag: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
      heroPhoto: 'M2.25 15.75c0 2.25 1.83 4.5 4.086 4.5h11.328c2.256 0 4.086-2.25 4.086-4.5V8.25c0-2.25-1.83-4.5-4.086-4.5H6.336c-2.256 0-4.086 2.25-4.086 4.5v7.5zm9.75-9v6.75m0 0l-3-3m3 3l3-3m-8.25 3.75h16.5',
      heroTag: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z',
      heroBuildingStorefront: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z',
      heroMapPin: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
      heroTicket: 'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z',
      heroChartBarSquare: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
      heroTruck: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25a1.125 1.125 0 011.125-1.125h3.5a1.125 1.125 0 011.125 1.125v3.75m0 0h.75m-9 0h.75M15.75 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h3.375c.621 0 1.125-.504 1.125-1.125v-3.75c0-.621-.504-1.125-1.125-1.125H18.75a1.125 1.125 0 00-1.125 1.125v3.75c0 .621.504 1.125 1.125 1.125z',
      heroUsers: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
      heroCurrencyDollar: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      heroChartPie: 'M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z',
      heroCube: 'm21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
      heroUserGroup: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
      heroDocumentChartBar: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
      heroShieldCheck: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
      heroClipboardDocumentList: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125h11.25c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z',
      heroMegaphone: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46'
    };
    return iconPaths[iconName] || '';
  }

  dashboardItems: DashboardItem[] = [
    {
      label: 'Edit Products',
      route: '/AdminEditProducts',
      iconName: 'heroShoppingBag',
      iconColor: 'text-blue-500'
    },
    {
      label: 'Edit Banners',
      route: '/admin/banners',
      iconName: 'heroPhoto',
      iconColor: 'text-purple-500'
    },
    {
      label: 'Orders',
      route: '/admin/orders',
      iconName: 'heroClipboardDocumentList',
      iconColor: 'text-emerald-600'
    },
    // {
    //   label: 'Edit Tags',
    //   route: '/AdminEditTags',
    //   iconName: 'heroTag',
    //   iconColor: 'text-[rgb(170,15,18)]'
    // },
    {
      label: 'Edit Categories',
      route: '/AdminEditCateg',
      iconName: 'heroBuildingStorefront',
      iconColor: 'text-yellow-500'
    },
    {
      label: 'Edit Companies',
      route: '/AdminEditCompanies',
      iconName: 'heroBuildingStorefront',
      iconColor: 'text-green-500'
    },
    {
      label: 'Edit Cities',
      route: '/AdminEditCities',
      iconName: 'heroMapPin',
      iconColor: 'text-red-500'
    },
    // {
    //   label: 'Edit Promo Code',
    //   route: '/AdminEditPromoCode',
    //   iconName: 'heroTicket',
    //   iconColor: 'text-indigo-500'
    // },
    {
      label: 'Operation Team',
      route: '/admin/orders',
      iconName: 'heroChartBarSquare',
      iconColor: 'text-blue-400'
    },
    {
      label: 'Delivery Boys',
      route: '/AdminEditDeliveryBoys',
      iconName: 'heroTruck',
      iconColor: 'text-orange-500'
    },
    {
      label: 'Edit Staff',
      route: '/AdminEditStaff',
      iconName: 'heroUsers',
      iconColor: 'text-teal-500'
    },
    // {
    //   label: 'Sales Page',
    //   route: '/AdminSalesDashboard',
    //   iconName: 'heroCurrencyDollar',
    //   iconColor: 'text-[rgb(200,15,18)]'
    // },
    // {
    //   label: 'Promo Codes Analysis',
    //   route: '/PromoCodesAnalysis',
    //   iconName: 'heroChartPie',
    //   iconColor: 'text-purple-600'
    // },
    {
      label: 'Products Analysis',
      route: '/ProductsAnalysis',
      iconName: 'heroCube',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Users Analysis',
      route: '/UsersAnalysis',
      iconName: 'heroUserGroup',
      iconColor: 'text-pink-500'
    },
    // {
    //   label: 'Reports',
    //   route: '/AdminReports',
    //   iconName: 'heroDocumentChartBar',
    //   iconColor: 'text-green-600'
    // },
    // {
    //   label: 'Insurance Company',
    //   route: '/AdminEditInuranceCompany',
    //   iconName: 'heroShieldCheck',
    //   iconColor: 'text-cyan-600'
    // },
    // {
    //   label: 'Insurance Orders',
    //   route: '/InsuranceOrders',
    //   iconName: 'heroClipboardDocumentList',
    //   iconColor: 'text-emerald-600'
    // },
    // {
    //   label: 'PopUp Controller',
    //   route: '/PopUpController',
    //   iconName: 'heroMegaphone',
    //   iconColor: 'text-amber-600'
    // }
  ];
}
