import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoadoresList } from './doadores-list';

describe('DoadoresList', () => {
  let component: DoadoresList;
  let fixture: ComponentFixture<DoadoresList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoadoresList],
    }).compileComponents();

    fixture = TestBed.createComponent(DoadoresList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
