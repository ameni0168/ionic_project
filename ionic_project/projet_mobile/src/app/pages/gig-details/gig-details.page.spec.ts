import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GigDetailsPage } from './gig-details.page';

describe('GigDetailsPage', () => {
  let component: GigDetailsPage;
  let fixture: ComponentFixture<GigDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GigDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
