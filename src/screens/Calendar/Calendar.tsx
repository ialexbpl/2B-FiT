import React, { useState, useRef } from 'react';
import {
  TouchableWithoutFeedback,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import 'moment/locale/pl';
import Swiper from 'react-native-swiper';

import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { makeCalendarStyles } from '@screens/Calendar/CalendarStyles';

moment.updateLocale('en', { week: { dow: 1 } });

export default function Calendar() {
  const swiper = useRef<any>(null);
  const [week, setWeek] = useState(0);
  const [value, setValue] = useState(new Date());

  const { palette } = useTheme();
  const styles = React.useMemo(() => makeCalendarStyles(palette, theme), [palette]);


  const weeks = React.useMemo(() => {
    const start = moment().add(week, 'weeks').startOf('week');
    return [-1, 0, 1].map(adj =>
      Array.from({ length: 7 }).map((_, index) => {
        const date = moment(start).add(adj, 'week').add(index, 'day');
        return { weekday: date.format('ddd'), date: date.toDate() };
      })
    );
  }, [week]);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>
            {value.toLocaleDateString('en-US', { dateStyle: 'full' })}
          </Text>
        </View>

  
        <View style={styles.picker}>
          <Swiper
            index={1}
            ref={swiper}
            loop={false}
            showsPagination={false}
            onIndexChanged={(ind: number) => {
              if (ind === 1) return;
              const delta = ind - 1;
              setValue(moment(value).add(delta, 'week').toDate());
              setTimeout(() => {
                setWeek(prev => prev + delta);
                swiper.current?.scrollTo(1, false);
              }, 10);
            }}
          >
            {weeks.map((dates, i) => (
              <View style={styles.itemRow} key={i}>
                {dates.map((item, j) => {
                  const isActive = value.toDateString() === item.date.toDateString();
                  const isToday = new Date().toDateString() === item.date.toDateString();

                  return (
                    <TouchableWithoutFeedback key={j} onPress={() => setValue(item.date)}>
                      <View
                        style={[
                          styles.item,
                          isActive && { backgroundColor: palette.primary, borderColor: palette.primary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.itemWeekday,
                            isActive && { color: palette.onPrimary },
                            isToday && !isActive && { color: theme.colors.danger },
                            isToday && isActive && { color: palette.text },
                          ]}
                        >
                          {item.weekday}
                        </Text>
                        <Text
                          style={[
                            styles.itemDate,
                            isActive && { color: palette.onPrimary },
                            isToday && !isActive && { color: theme.colors.danger },
                            isToday && isActive && { color: palette.text },
                          ]}
                        >
                          {item.date.getDate()}
                        </Text>
                      </View>
                    </TouchableWithoutFeedback>
                  );
                })}
              </View>
            ))}
          </Swiper>
        </View>
      </View>
    </SafeAreaView>
  );
}
