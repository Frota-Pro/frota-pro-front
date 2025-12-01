import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VeiculosComponents } from './veiculos.component';

describe('Veiculos', () => {
  let component: VeiculosComponents;
  let fixture: ComponentFixture<VeiculosComponents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VeiculosComponents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VeiculosComponents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
