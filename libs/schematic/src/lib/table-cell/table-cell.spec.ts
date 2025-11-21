import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TableCell} from './table-cell';

describe('TableCell', () => {
  let component: TableCell;
  let fixture: ComponentFixture<TableCell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCell],
    }).compileComponents();

    fixture = TestBed.createComponent(TableCell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
