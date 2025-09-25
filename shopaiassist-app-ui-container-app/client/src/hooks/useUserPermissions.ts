/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import * as wjcCore from '@grapecity/wijmo';
import { CollectionView } from '@grapecity/wijmo';
import { FlexGridProps } from '@grapecity/wijmo.react.grid';
import { SafDrawerInstance, SafPaginationInstance } from '@/core-components';

import { SkillsAccess } from '../types/user-permissions-types';

wjcCore.setLicenseKey(process.env.WIJMO_LICENSE_KEY || '');

export enum MULTI_SELECT_OPTIONS {
  ALL_SELECTED = 'ALL_SELECTED',
  NONE_SELECTED = 'NONE_SELECTED',
  SOME_SELECTED = 'SOME_SELECTED',
}

/**
 * Custom hook to manage UserPermissionsGrid's toolbar
 * @param skillsList List of all skills.
 */
export const useGridTools = (
  skillsList: SkillsAccess[]
): [SkillsAccess[], MULTI_SELECT_OPTIONS, RefObject<SafDrawerInstance>, (skillName: string) => void, () => void] => {
  const [skillsAccess, setSkillsAccess] = useState(skillsList);
  const [multiSelectOption, setMultiSelectOption] = useState(MULTI_SELECT_OPTIONS.NONE_SELECTED);
  const filterDrawerRef = useRef<SafDrawerInstance>(null);

  /**
   * Toggles the access of the given skill in the ShopAIAssist skills access editor.
   * @param skillName Skill to toggle access.
   */
  const toggleSkillAccess = (skillName: string) => {
    const skills = [...skillsAccess];
    let selectedCount = 0;
    skills.forEach((item) => {
      if (item.skillName === skillName) {
        item.hasAccess = !item.hasAccess;
      }
      selectedCount += item.hasAccess ? 1 : 0;
    });
    if (selectedCount === skills.length) setMultiSelectOption(MULTI_SELECT_OPTIONS.ALL_SELECTED);
    else if (selectedCount === 0) setMultiSelectOption(MULTI_SELECT_OPTIONS.NONE_SELECTED);
    else setMultiSelectOption(MULTI_SELECT_OPTIONS.SOME_SELECTED);
    setSkillsAccess(skills);
  };
  /** Selects all access in ShopAIAssist skills access editor */
  const selectAllSkills = () => {
    const skills = [...skillsAccess];
    const newAllSelected =
      multiSelectOption === MULTI_SELECT_OPTIONS.ALL_SELECTED
        ? MULTI_SELECT_OPTIONS.NONE_SELECTED
        : MULTI_SELECT_OPTIONS.ALL_SELECTED;
    skills.forEach((item) => {
      item.hasAccess = newAllSelected === MULTI_SELECT_OPTIONS.ALL_SELECTED;
    });
    setSkillsAccess(skills);
    setMultiSelectOption(newAllSelected);
  };

  return [skillsAccess, multiSelectOption, filterDrawerRef, toggleSkillAccess, selectAllSkills];
};

/**
 * Custom hook that manages Wijmo Gird component
 * @param data The data to populate the grid.
 * @param pageSize The size of the pagination for the grid.
 * @param filterCallback A function to locally filter items.
 */
export const useGrid = <T>(data: T[], pageSize: number, filterCallback: (item: T, value: string) => boolean) => {
  const [itemsSource] = useState(() => new CollectionView(data, { pageSize }));
  const [searchItemsSource, setSearchItemSource] = useState(() => new CollectionView(data, { pageSize }));
  const gridRef = useRef<FlexGridProps>(null);
  const paginationRef = useRef<SafPaginationInstance>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [inputSearch, setInputSearch] = useState('');
  const [currentPageSize, setCurrentPageSize] = useState(25);

  /** Wheter all, some or none rows are selected. */
  const multiSelectOption = useMemo(() => {
    const { length } = selectedIds;
    const { totalItemCount } = itemsSource;
    switch (length) {
      case 0:
        return MULTI_SELECT_OPTIONS.NONE_SELECTED;
      case totalItemCount:
        return MULTI_SELECT_OPTIONS.ALL_SELECTED;
      default:
        return MULTI_SELECT_OPTIONS.SOME_SELECTED;
    }
  }, [selectedIds, itemsSource]);

  /** Updates the selected ids when a row is selected. */
  const updateSelection = () => {
    const grid = gridRef.current?.control;
    const rowSelectedIds = grid.rows.filter((r: any) => r.isSelected).map((row: any) => row.dataItem.id);
    setSelectedIds((prev) => {
      const restSelectedIds = prev.filter((id) => !grid.rows.map((r: any) => r.dataItem.id).includes(id));
      const newSelectedIds = new Set([...restSelectedIds, ...rowSelectedIds]);
      return Array.from(newSelectedIds);
    });
    grid.refresh(true);
  };

  /** Selects all rows. */
  const selectAll = () => {
    const grid = gridRef.current?.control;
    if (multiSelectOption === MULTI_SELECT_OPTIONS.ALL_SELECTED) {
      grid.rows.forEach((row: any) => {
        row.isSelected = false;
      });
      setSelectedIds([]);
    } else {
      grid.rows.forEach((row: any) => {
        row.isSelected = true;
      });
      setSelectedIds(grid.itemsSource.sourceCollection.map((item: any) => item.id));
    }
    grid.refresh(true);
  };

  /** Updates the isSelected value for each row when the page changes. */
  const updateIsSelectedFromRow = () => {
    const grid = gridRef.current?.control;
    grid.rows.forEach((row: any) => {
      row.isSelected = selectedIds.includes(row.dataItem.id);
    });
  };

  /** Filters the displayed rows when the inputSearch changes */
  const onSearch = (event: any) => {
    const value = event.target.value;
    setInputSearch(value);
    setSearchItemSource(
      () =>
        new CollectionView(
          data.filter((item) => filterCallback(item, value)),
          {
            pageSize: pageSize,
          }
        )
    );
    searchItemsSource.moveToPage(0);
    searchItemsSource.pageSize = pageSize;
    setPageIndex(0);
  };

  const onPageIndexChanged = (event: any) => {
    const index = event.detail - 1;
    searchItemsSource.moveToPage(index);
    setPageIndex(index);
    updateIsSelectedFromRow();
    // Handle focus on pagination buttons
    let prevButton: any;
    let nextButton: any;
    const paginationButtons = paginationRef?.current?.shadowRoot?.querySelectorAll('saf-button') || [];
    paginationButtons?.forEach((button: any) => {
      if (button.innerText === 'Previous') {
        prevButton = button;
      }
      if (button.innerText === 'Next') {
        nextButton = button;
      }
    });
    if (index <= 0) {
      nextButton.focus();
    }
    const shownRecords = pageSize * (index + 1);
    if (shownRecords >= searchItemsSource.totalItemCount) {
      prevButton.focus();
    }
  };

  const setItemsPerPage = (event: any) => {
    const size = event.detail;
    searchItemsSource.pageSize = size;
    setCurrentPageSize(size);
  };

  useEffect(() => {
    updateIsSelectedFromRow();
  }, [inputSearch]);

  useEffect(() => {
    // Force to clear the value of the pagination input field
    const goToPaginationNumberField = paginationRef?.current?.shadowRoot?.querySelector('saf-number-field');
    const goToPaginationInput = goToPaginationNumberField?.shadowRoot?.querySelector('input');
    if (goToPaginationNumberField && goToPaginationInput) {
      goToPaginationNumberField.setAttribute('current-value', '');
      goToPaginationInput.value = '';
    }
  }, [pageIndex]);

  return {
    gridRef,
    inputSearch,
    onSearch,
    selectAll,
    multiSelectOption,
    selectedIds,
    itemsSource,
    pageIndex,
    searchItemsSource,
    updateSelection,
    pageSize: currentPageSize,
    paginationRef,
    onPageIndexChanged,
    setItemsPerPage,
  };
};
