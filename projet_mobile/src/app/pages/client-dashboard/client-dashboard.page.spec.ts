import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientDashbordPage } from './client-dashboard.page';

describe('ClientDashbordPage', () => {
  let component: ClientDashbordPage;
  let fixture: ComponentFixture<ClientDashbordPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientDashbordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
