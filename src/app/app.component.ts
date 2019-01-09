import {Component, ElementRef, ViewChild} from '@angular/core';
import {AngularFireDatabase, AngularFireList} from '@angular/fire/database';

import swal from 'sweetalert2';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild('inputItemName') inputItemName: ElementRef;
  @ViewChild('inputItemPrice') inputItemPrice: ElementRef;
  @ViewChild('inputSearchByItem') inputSearchByItem: ElementRef;
  @ViewChild('inputSearchByItemDate') inputSearchByItemDate: ElementRef;
  itemsFirebaseDB: Observable<any[]>;
  firebaseList: AngularFireList<any>;
  sortBtnText = 'Price';
  searchBtnText = 'Date';
  showSortButton = true;
  sortArrowPosition = 'Name';
  allItemDates = [];
  allItemNames = [];
  allItemPrices = [];
  allItemKeys = [];
  totalPrice = 0;
  todayDate: string;

  constructor(private firebaseDB: AngularFireDatabase) {
    this.firebaseList = firebaseDB.list('ExpenseTrack/Items');
    this.itemsFirebaseDB = this.firebaseList.valueChanges();
    this.updateAll();
    this.setToday();
  }
  setToday() {
    const localDate = new Date().toLocaleDateString().split('/');
    if (localDate[0].length < 2) {
      localDate[0] = '0' + localDate[0];
    }
    if (localDate[1].length < 2) {
      localDate[1] = '0' + localDate[1];
    }
    this.todayDate = localDate[2] + '-' + localDate[0] + '-' + localDate[1];
    // this.todayDate = new Date().toISOString().split('T')[0];
    console.log(this.todayDate);
  }
  addItem() {
    const itemName = this.inputItemName.nativeElement.value;
    const itemDate = this.todayDate;
    const itemPrice = this.inputItemPrice.nativeElement.valueAsNumber;
    const itemKey = itemName.toLowerCase() + '_' + itemDate;
    if (itemName !== '' && this.inputItemPrice.nativeElement.value !== '') {
      if (this.containsItem(itemKey)) {
        swal({
          type: 'warning',
          title: 'Update?',
          html: '<strong style="color: red;">' + itemName + '</strong> already existed on <strong style="color: red;">' + itemDate + '</strong>! Do you want to update new value?',
          showCancelButton: true,
          confirmButtonText: 'Yes, update!',
          cancelButtonText: 'cancel',
          showLoaderOnConfirm: true
        }).then((result) => {
          if (result.dismiss === swal.DismissReason.cancel) {
            swal({
              type: 'info',
              title: 'Cancelled',
              text: 'Your data is safe :)'
            }).catch(reason => { console.log(reason); });
          } else if (result) {
            this.firebaseList.set(itemKey, {name: itemName, lowerCaseName: itemName.toLowerCase(), date: itemDate, price: itemPrice}).catch(reason => { console.log(reason); });
            swal({
              type: 'success',
              title: 'Success!',
              text: itemName + ' has been updated!'
            }).catch(reason => { console.log(reason); });
            this.itemsFirebaseDB = this.firebaseList.valueChanges();
            this.updateAllPrice();
          }
        });
      } else {
        this.firebaseList.set(itemKey, {name: itemName, lowerCaseName: itemName.toLowerCase(), date: itemDate, price: itemPrice}).catch(reason => { console.log(reason); });
      }
      this.updateAll();
      this.sortArrowPosition = 'Name';
    }
  }
  sort() {
    if (this.sortBtnText === 'Price') {
      this.sortBtnText = 'Date';
      this.sortArrowPosition = 'Price';
      this.firebaseList = this.firebaseDB.list('ExpenseTrack/Items', ref => ref.orderByChild('price'));
      this.itemsFirebaseDB = this.firebaseList.valueChanges();
    } else if (this.sortBtnText === 'Date') {
      this.sortBtnText = 'Price';
      this.sortArrowPosition = 'Date';
      this.firebaseList = this.firebaseDB.list('ExpenseTrack/Items', ref => ref.orderByChild('date'));
      this.itemsFirebaseDB = this.firebaseList.valueChanges();
    }
    this.updateAll();
  }
  searchBtnClicked() {
    if (this.searchBtnText === 'Name') {
      this.searchBtnText = 'Date';
      this.firebaseList = this.firebaseDB.list('ExpenseTrack/Items');
      this.itemsFirebaseDB = this.firebaseList.valueChanges();
      this.updateAll();
      this.setToday();
      this.showSortButton = true;
      this.sortArrowPosition = 'Name';
    } else {
      this.searchBtnText = 'Name';
    }
  }
  searchByItemName() {
    const searchItemName = this.inputSearchByItem.nativeElement.value;
    this.firebaseList = this.firebaseDB.list('ExpenseTrack/Items', ref => ref.orderByChild('lowerCaseName').startAt(searchItemName.toLowerCase()).endAt(searchItemName.toLowerCase() + '\uf8ff'));
    this.itemsFirebaseDB = this.firebaseList.valueChanges();
    this.updateAllPrice();
    this.showSortButton = searchItemName === '';
    this.sortArrowPosition = 'Name';
  }
  searchByItemDate() {
    const searchItemDate = this.inputSearchByItemDate.nativeElement.value;
    this.firebaseList = this.firebaseDB.list('ExpenseTrack/Items', ref => ref.orderByChild('date').equalTo(searchItemDate));
    this.itemsFirebaseDB = this.firebaseList.valueChanges();
    this.updateAllPrice();
    this.showSortButton = false;
    this.sortArrowPosition = 'Date';
  }
  containsItem(itemKey: string): boolean {
    return this.allItemKeys.includes(itemKey);
  }
  updateAllPrice() {
    this.itemsFirebaseDB.subscribe(items => {
      this.allItemPrices = [];
      this.totalPrice = 0;
      items.forEach(item => {
        this.allItemPrices.push(item.price);
      });
      this.allItemPrices.forEach(price => {
        this.totalPrice = this.totalPrice + price;
      });
    });
  }
  updateAll() {
    this.itemsFirebaseDB.subscribe(items => {
      this.allItemDates = [];
      this.allItemNames = [];
      this.allItemPrices = [];
      this.allItemKeys = [];
      this.totalPrice = 0;
      items.forEach(item => {
        this.allItemDates.push(item.date);
        this.allItemNames.push(item.name);
        this.allItemPrices.push(item.price);
        this.allItemKeys.push(item.name + '_' + item.date);
      });
      this.allItemPrices.forEach(price => {
        this.totalPrice = this.totalPrice + price;
      });
    });
  }
}
