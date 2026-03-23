import { Component } from '@angular/core';

@Component({
  selector: 'app-my-gigs',
  templateUrl: './my-gigs.page.html',
  styleUrls: ['./my-gigs.page.scss'],
})
export class MyGigsPage {

  gigs = [
    {
      title: 'Professional Logo Design',
      price: 150,
      status: 'Active',
      orders: 24,
      color: 'green'
    },
    {
      title: 'Full Stack Web Development',
      price: 500,
      status: 'Pending',
      orders: 0,
      color: 'orange'
    },
    {
      title: 'SEO Optimization Service',
      price: 200,
      status: 'Active',
      orders: 12,
      color: 'blue'
    }
  ];

}
