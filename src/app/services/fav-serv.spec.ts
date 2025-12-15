import { TestBed } from '@angular/core/testing';

import { FavServ } from './fav-serv';

describe('FavServ', () => {
  let service: FavServ;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavServ);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
