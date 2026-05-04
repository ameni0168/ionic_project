import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ContractListPage } from './contract-list.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ContractListPage', () => {
  let component: ContractListPage;
  let fixture: ComponentFixture<ContractListPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ContractListPage, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

