import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Order } from '../../../../services/admin-serv';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './admin-orders.html',
  styleUrls: ['./admin-orders.css'],
})
export class AdminOrdersComponent implements OnInit {
  adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  searchTerm: string = '';
  statusFilter: string = 'all';

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.adminService.getOrders().subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Orders response:', response);
        console.log('Response success:', response.success);
        console.log('Response data:', response.data);
        console.log('Data length:', response.data?.length);
        
        if (response.success) {
          this.orders = Array.isArray(response.data) ? response.data : [];
          this.filteredOrders = [...this.orders];
          console.log('Orders set:', this.orders);
          console.log('First order sample:', this.orders[0]);
          console.log('Orders count:', this.orders.length);
          console.log('Filtered orders set:', this.filteredOrders);
          console.log('Filtered orders count:', this.filteredOrders.length);
          console.log('isLoading before CDR:', this.isLoading);
          
          if (this.orders.length === 0) {
            console.warn('No orders found in response');
          }
          
          // Force change detection
          this.cdr.detectChanges();
          console.log('isLoading after CDR:', this.isLoading);
          console.log('Template should show orders now. isLoading:', this.isLoading, 'filteredOrders.length:', this.filteredOrders.length);
        } else {
          this.errorMessage = response.message || 'Failed to load orders';
          console.error('Response was not successful:', response);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || err.message || 'Failed to load orders';
        console.error('Error loading orders:', err);
        console.error('Error status:', err.status);
        console.error('Error body:', err.error);
        this.cdr.detectChanges();
      },
    });
  }

  filterOrders() {
    let filtered = [...this.orders];

    // Filter by search term
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(search) ||
          order.userName?.toLowerCase().includes(search) ||
          order.shippingAddress.toLowerCase().includes(search) ||
          order.status.toLowerCase().includes(search)
      );
    }

    // Filter by status
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status.toLowerCase() === this.statusFilter.toLowerCase());
    }

    this.filteredOrders = filtered;
  }

  onSearchChange() {
    this.filterOrders();
  }

  onStatusFilterChange() {
    this.filterOrders();
  }

  cancelOrder(orderId: number) {
    if (confirm('Are you sure you want to cancel this order?')) {
      this.adminService.cancelOrder(orderId).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadOrders();
          } else {
            alert(response.message || 'Failed to cancel order');
          }
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to cancel order');
          console.error('Error cancelling order:', err);
        },
      });
    }
  }

  getStatusColor(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (statusLower === 'confirmed' || statusLower === 'processing') return 'bg-blue-100 text-blue-800';
    if (statusLower === 'shipped') return 'bg-purple-100 text-purple-800';
    if (statusLower === 'delivered') return 'bg-green-100 text-green-800';
    if (statusLower === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }

  formatPrice(price: number): string {
    const formattedPrice = price.toFixed(2).replace(/\.00$/, '');
    return `${formattedPrice} EGP`;
  }
}

