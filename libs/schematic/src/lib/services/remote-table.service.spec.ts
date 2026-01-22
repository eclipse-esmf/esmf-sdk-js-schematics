import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {EsmfRemoteTableService, Response} from './remote-table.service';

interface TestItem {
  id: number;
  name: string;
}

describe('EsmfRemoteTableService', () => {
  let service: EsmfRemoteTableService<TestItem>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), EsmfRemoteTableService],
    });
    service = TestBed.inject(EsmfRemoteTableService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should make POST request with correct URL and body', () => {
    const url = 'https://api.example.com/data';
    const payload = {query: 'test'};
    const mockResponse: Response<TestItem> = {
      items: [{id: 1, name: 'Test'}],
      currentPage: 1,
      itemCount: 1,
      totalItems: 1,
      totalPages: 1,
    };

    service.requestData(url, payload).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should handle URL without query parameters', () => {
    const url = 'https://api.example.com/data';
    const payload = {query: 'test'};

    service.requestData(url, payload).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.body).toEqual(payload);
    req.flush({items: [], currentPage: 1, itemCount: 0, totalItems: 0, totalPages: 0});
  });
});
