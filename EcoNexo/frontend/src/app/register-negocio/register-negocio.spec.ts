import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterNegocio } from './register-negocio';

describe('RegisterNegocio', () => {
  let component: RegisterNegocio;
  let fixture: ComponentFixture<RegisterNegocio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterNegocio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterNegocio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
