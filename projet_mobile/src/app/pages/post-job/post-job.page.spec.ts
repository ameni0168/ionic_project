import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostJobPage } from './post-job.page';

describe('PostJobPage', () => {
  let component: PostJobPage;
  let fixture: ComponentFixture<PostJobPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PostJobPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
