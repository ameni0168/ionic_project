import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientRegisterPage } from './client-register.page';

describe('ClientRegisterPage', () => {
  let component: ClientRegisterPage;
  let fixture: ComponentFixture<ClientRegisterPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientRegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
