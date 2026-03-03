import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateGigPage } from './create-gig.page';

describe('CreateGigPage', () => {
  let component: CreateGigPage;
  let fixture: ComponentFixture<CreateGigPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateGigPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
