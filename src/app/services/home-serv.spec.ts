import { TestBed } from '@angular/core/testing';

import { HomeServ } from './home-serv';

describe('Home', () => {
  let service: HomeServ;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HomeServ);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
