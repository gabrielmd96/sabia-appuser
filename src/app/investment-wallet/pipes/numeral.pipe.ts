import { Pipe, PipeTransform } from '@angular/core';
import * as numeral from 'numeral';

@Pipe({
  name: 'numeral'
})
export class NumeralPipe implements PipeTransform {

  transform(value: unknown, type: string, ...args: unknown[]): unknown {
    switch (type) {
      case 'percentage':
        return numeral(value).format('0.00%');
      case 'currency':
        return numeral(value).format('0,0.00');
    }
    return null;
  }

}
