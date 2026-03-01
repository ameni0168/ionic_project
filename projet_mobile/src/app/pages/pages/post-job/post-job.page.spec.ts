import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostJobPage } from './post-job.page';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

describe('PostJobPage', () => {
  let component: PostJobPage;
  let fixture: ComponentFixture<PostJobPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PostJobPage],
      imports: [IonicModule.forRoot(), ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PostJobPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});