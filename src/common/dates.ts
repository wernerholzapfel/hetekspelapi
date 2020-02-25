import { isMoment, Moment } from 'moment';
import * as moment from 'moment-timezone';
import 'moment/locale/nl';

moment.locale('nl');

const monthSubArray = {
  dutch: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
  english: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
};

function getMonthSubIndex(dateStr, lang = 'dutch') {
  const lowerCase = dateStr.toLowerCase();
  for (let i = 0; i < monthSubArray.dutch.length; i++) {
    if (lowerCase.indexOf(monthSubArray[lang][i]) > -1) {
      return i;
    }
  }
}

function substituteMonthInDatestring(dateStr: string): string {
  const index = getMonthSubIndex(dateStr);
  return dateStr.replace(monthSubArray.dutch[index], monthSubArray.english[index]);
}

export function parseDate(date: string | Moment | number | Date): Moment | string {
  if (isMoment(date)) {
    return date;
  }

  if (typeof date === 'string') {
    date = substituteMonthInDatestring(date);
  }

  const momentDate: Moment = moment.tz(date, 'Europe/Amsterdam');
  if (momentDate.isValid() && !isNaN(Date.parse(`${date}`))) {
    return momentDate;
  } else if (!momentDate.isValid() && !isNaN(Date.parse(`${date}`))) {
    return moment.tz(Date.parse(date as string), 'Europe/Amsterdam');
  }

  return date as string;
}

export function formatDate(date) {
  return moment.tz(date, 'Europe/Amsterdam').format('YYYY/MM/DD HH:mm:ss:SSS');
}
