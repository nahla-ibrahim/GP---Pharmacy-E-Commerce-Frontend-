import { Component, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { CartServ } from '../../../services/cart-serv';
import { OrderService, CreateOrderDTO } from '../../../services/order-serv';
import { ProductServ } from '../../../services/product-serv';
import { CityService, CityDTO } from '../../../services/city-serv';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent implements OnInit {
  private cartServ = inject(CartServ);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private productServ = inject(ProductServ);
  private cityService = inject(CityService);

  orderNumber = signal<string>('');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  showForm = signal<boolean>(true);
  cities = signal<CityDTO[]>([]);

  // Form fields (using regular properties for ngModel two-way binding)
  phoneNumber: string = '';
  shippingAddress: string = '';
  cityId: number = 0;
  customerNotes: string = '';

  // Helper method to ensure proper type checking
  private validateForm(): boolean {
    const phone = this.phoneNumber?.trim() || '';
    const address = this.shippingAddress?.trim() || '';
    
    if (!phone) {
      this.errorMessage.set('Phone number is required');
      return false;
    }
    if (phone.length < 8) {
      this.errorMessage.set('Phone number must be at least 8 characters long');
      return false;
    }
    if (!address) {
      this.errorMessage.set('Detailed shipping address is required');
      return false;
    }
    if (address.length < 10) {
      this.errorMessage.set('Shipping address must be at least 10 characters long. Please provide more details.');
      return false;
    }
    if (!this.cityId || this.cityId === 0) {
      this.errorMessage.set('Please select a city');
      return false;
    }
    return true;
  }

  ngOnInit(): void {
    this.loadCities();
  }

  loadCities(): void {
    this.cityService.getCities().subscribe({
      next: (cities) => {
        this.cities.set(cities.filter(c => c.isActive));
      },
      error: (err) => {
        console.error('Error loading cities:', err);
        this.errorMessage.set('Failed to load cities. Please refresh the page.');
      }
    });
  }

  createOrder(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    // Check if user is authenticated
    const token = localStorage.getItem('token') || localStorage.getItem('userToken');
    if (!token) {
      this.isLoading.set(false);
      this.errorMessage.set('Please log in to complete your order.');
      return;
    }

    // Get cart items
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cartItems.length === 0) {
      this.errorMessage.set('Your cart is empty');
      this.isLoading.set(false);
      return;
    }

    // Get cart total
    this.productServ.getProduct().subscribe({
      next: (products) => {
        const fullCart = cartItems.map((c: any) => {
          const product = products.find((p) => p.id === c.id);
          return product ? { ...product, quantity: c.quantity } : null;
        }).filter((x: any) => x);

        if (fullCart.length === 0) {
          this.isLoading.set(false);
          this.errorMessage.set('No valid products in cart');
          return;
        }

        const subtotal = fullCart.reduce(
          (sum: number, item: any) => sum + (item.price || 0) * item.quantity,
          0
        );
        const shipping = fullCart.length > 0 ? 5 : 0;
        const total = subtotal + shipping;

        // Create order items from cart
        const orderItems = fullCart.map((item: any) => ({
          productId: item.id,
          quantity: item.quantity
        }));

        // Validate form fields
        if (!this.validateForm()) {
          this.isLoading.set(false);
          this.showForm.set(true);
          return;
        }

        // Create order DTO with form values
        const orderDTO: CreateOrderDTO = {
          shippingAddress: this.shippingAddress,
          phoneNumber: this.phoneNumber,
          cityId: this.cityId,
          customerNotes: this.customerNotes || '',
          prescriptionImageUrl: localStorage.getItem('prescriptionImageUrl') || '',
          paymentMethod: localStorage.getItem('paymentMethod') || 'Cash',
          branchId: parseInt(localStorage.getItem('branchId') || '1', 10), // Default to branch 1
          orderItems: orderItems
        };

        console.log('Creating order with DTO:', orderDTO);

        // Hide form and show loading
        this.showForm.set(false);

        // Create order via API
        this.orderService.createOrder(orderDTO).subscribe({
          next: (order) => {
            console.log('Order created successfully:', order);
            this.isLoading.set(false);
            this.orderNumber.set(order.orderNumber);
            // Clear cart only after successful order creation
            this.clearCart();
          },
          error: (err) => {
            this.isLoading.set(false);
            const errorMsg = err.error?.message || err.message || 'Failed to create order. Please try again.';
            this.errorMessage.set(errorMsg);
            this.showForm.set(true); // Show form again on error
            console.error('Error creating order:', err);
            console.error('Error status:', err.status);
            console.error('Error body:', err.error);
            
            // If unauthorized, suggest login
            if (err.status === 401 || err.status === 403) {
              this.errorMessage.set('Please log in to complete your order.');
            }
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Failed to load cart items. Please try again.');
        console.error('Error loading products:', err);
      }
    });
  }

  clearCart(): void {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    cartItems.forEach((item: any) => {
      this.cartServ.addtocart(item.id, 0);
    });
  }

  backToHome(): void {
    this.router.navigate(['/home']);
  }
}
