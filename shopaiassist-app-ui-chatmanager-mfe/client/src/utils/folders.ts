import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { TreeItem, FolderItem } from '../@types/sidebar';

const MAX_SORTING_YEAR = 2020;

export interface ChatFolder {
  children?: string[];
  description?: string;
  id: string;
  name: string;
  nickname?: string;
}

export interface SortedChatsAndFolders {
  timeframe: string;
  chats: (TreeItem | FolderItem)[];
}

/**
 * Categorizes chats and folders into exclusive timeframes such as 'Today', 'Past 7 Days', 'Past 30 Days', each month for the last 3 months, and each year up to 2020.
 * Any remaining chats not fitting into these categories are placed in an 'Older' category.
 *
 * @param chats - An array of chat or matter folder objects to be sorted.
 * @returns An array of objects, each containing a timeframe label and the corresponding chats or folders sorted into that timeframe.
 */
export const sortFoldersAndChats = (chats: (TreeItem | FolderItem)[]) => {
  dayjs.extend(isBetween);
  const referencePoint = dayjs();
  let remainingChats = [...chats];
  const sortedChats = [];

  const timeframes = [
    { label: 'Today', start: referencePoint.clone().startOf('day') },
    { label: 'Past 7 Days', start: referencePoint.clone().subtract(7, 'days').startOf('day') },
    { label: 'Past 30 Days', start: referencePoint.clone().subtract(30, 'days').startOf('day') }
    // Add other specific timeframes here if needed
  ];

  // Sorting for fixed timeframes
  for (const { label, start } of timeframes) {
    const timeframeChats = remainingChats.filter((chatOrFolder) =>
      dayjs(chatOrFolder.createdAt).isBetween(start, referencePoint, null, '[]')
    );
    if (timeframeChats.length > 0) {
      sortedChats.push({ timeframe: label, chats: timeframeChats });
      remainingChats = remainingChats.filter((chatOrFolder) => !timeframeChats.includes(chatOrFolder));
    }
  }

  // Sorting for each month for the last 3 months
  for (let monthIndex = 1; monthIndex <= 3; monthIndex++) {
    const monthStart = referencePoint.clone().subtract(monthIndex, 'months').startOf('month');
    const monthChats = remainingChats.filter((chatOrFolder) =>
      dayjs(chatOrFolder.createdAt).isBetween(monthStart, referencePoint, null, '[]')
    );
    if (monthChats.length > 0) {
      sortedChats.push({ timeframe: monthStart.format('MMMM YYYY'), chats: monthChats });
      remainingChats = remainingChats.filter((chatOrFolder) => !monthChats.includes(chatOrFolder));
    }
  }

  // Sorting for each year up to 2020
  for (let yearIndex = 1; yearIndex <= referencePoint.year() - MAX_SORTING_YEAR; yearIndex++) {
    const yearStart = referencePoint.clone().subtract(yearIndex, 'years').startOf('year');
    const yearChats = remainingChats.filter((chatOrFolder) =>
      dayjs(chatOrFolder.createdAt).isBetween(yearStart, referencePoint, null, '[]')
    );
    if (yearChats.length > 0) {
      sortedChats.push({ timeframe: yearStart.format('YYYY'), chats: yearChats });
      remainingChats = remainingChats.filter((chatOrFolder) => !yearChats.includes(chatOrFolder));
    }
  }

  // Add a final category for older chats, if needed
  if (remainingChats.length > 0) {
    sortedChats.push({ timeframe: 'Older', chats: remainingChats });
  }

  return sortedChats;
};
