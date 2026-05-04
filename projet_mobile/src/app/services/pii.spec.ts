import { TestBed } from '@angular/core/testing';

import { Pii } from './pii';

describe('Pii', () => {
  let service: Pii;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pii);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
