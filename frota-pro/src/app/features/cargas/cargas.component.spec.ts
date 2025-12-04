import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargasComponent } from './cargas.component';

describe('Cargas', () => {
  let component: CargasComponent;
  let fixture: ComponentFixture<CargasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CargasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
