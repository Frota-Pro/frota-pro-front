import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Manuntencao } from './manutencao.component';

describe('Manuntencao', () => {
  let component: Manuntencao;
  let fixture: ComponentFixture<Manuntencao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Manuntencao],
    }).compileComponents();

    fixture = TestBed.createComponent(Manuntencao);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
