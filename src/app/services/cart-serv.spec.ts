import { TestBed } from '@angular/core/testing';

import { CartServ } from './cart-serv';

describe('CartServ', () => {
  let service: CartServ;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartServ);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
