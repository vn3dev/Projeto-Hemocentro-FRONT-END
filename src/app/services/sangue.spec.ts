import { TestBed } from '@angular/core/testing';

import { Sangue } from './sangue';

describe('Sangue', () => {
  let service: Sangue;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sangue);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
