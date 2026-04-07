import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';



@Injectable({
  providedIn: 'root',
})
export class Freelancer {
  constructor(private http: HttpClient) {}

  createConversation(data: any) {
  return this.http.post('http://localhost:5000/api/chat/conversation', data);
}
  
}
