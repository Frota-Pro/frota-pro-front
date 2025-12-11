import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbastecimentosComponent } from './abastecimentos.component';

describe('Abastecimento', () => {
  let component: AbastecimentosComponent;
  let fixture: ComponentFixture<AbastecimentosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbastecimentosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbastecimentosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
