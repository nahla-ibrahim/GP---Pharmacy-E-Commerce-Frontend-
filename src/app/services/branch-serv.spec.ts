import { TestBed } from '@angular/core/testing';

import { BranchServ } from './branch-serv';

describe('BranchServ', () => {
  let service: BranchServ;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BranchServ);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
