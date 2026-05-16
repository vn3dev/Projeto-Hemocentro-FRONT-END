import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BolsaLista } from './bolsa-lista';

describe('BolsaLista', () => {
  let component: BolsaLista;
  let fixture: ComponentFixture<BolsaLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BolsaLista],
    }).compileComponents();

    fixture = TestBed.createComponent(BolsaLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
