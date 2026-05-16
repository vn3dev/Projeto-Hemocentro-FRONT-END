import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoadoresForm } from './doadores-form';

describe('DoadoresForm', () => {
  let component: DoadoresForm;
  let fixture: ComponentFixture<DoadoresForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoadoresForm],
    }).compileComponents();

    fixture = TestBed.createComponent(DoadoresForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
