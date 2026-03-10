import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterCliente } from './register-cliente';

describe('RegisterCliente', () => {
  let component: RegisterCliente;
  let fixture: ComponentFixture<RegisterCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterCliente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
