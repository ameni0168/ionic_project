import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { SprintWorkspacePage } from './sprint-workspace.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('SprintWorkspacePage', () => {
  let component: SprintWorkspacePage;
  let fixture: ComponentFixture<SprintWorkspacePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), SprintWorkspacePage, HttpClientTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SprintWorkspacePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
