import {TestBed} from '@angular/core/testing';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {EsmfRemoteTableService, Response} from './remote-table.service';
import {provideHttpClient} from '@angular/common/http';

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

  it('should extract query parameters from URL and merge with body', () => {
    const url = 'https://api.example.com/data?page=2&limit=10';
    const payload = {query: 'test'};
    const expectedBody = {query: 'test', page: '2', limit: '10'};

    service.requestData(url, payload).subscribe();

    const req = httpMock.expectOne('https://api.example.com/data');
    expect(req.request.body).toEqual(expectedBody);
    req.flush({items: [], currentPage: 1, itemCount: 0, totalItems: 0, totalPages: 0});
  });

  it('should handle URL without query parameters', () => {
    const url = 'https://api.example.com/data';
    const payload = {query: 'test'};

    service.requestData(url, payload).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.body).toEqual(payload);
    req.flush({items: [], currentPage: 1, itemCount: 0, totalItems: 0, totalPages: 0});
  });

  it('should override payload properties with query parameters', () => {
    const url = 'https://api.example.com/data?query=override&page=5';
    const payload = {query: 'original', page: 1};
    const expectedBody = {query: 'override', page: '5'};

    service.requestData(url, payload).subscribe();

    const req = httpMock.expectOne('https://api.example.com/data');
    expect(req.request.body).toEqual(expectedBody);
    req.flush({items: [], currentPage: 1, itemCount: 0, totalItems: 0, totalPages: 0});
  });
});
