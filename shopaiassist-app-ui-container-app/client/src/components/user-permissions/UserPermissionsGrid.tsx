import { CollectionView, DataType } from '@grapecity/wijmo';
import { CellType, FlexGrid as FlexGridInstance, GridPanel, ICellTemplateContext } from '@grapecity/wijmo.grid';
import { Selector } from '@grapecity/wijmo.grid.selector';
import { MultiSelect } from '@grapecity/wijmo.input';
import { FlexGrid, FlexGridColumn } from '@grapecity/wijmo.react.grid';
import {
  SafButton,
  SafCheckbox,
  SafChip,
  SafDivider,
  SafDrawer,
  SafFacetCategory,
  SafFacetedFilter,
  SafFacetItem,
  SafIcon,
  SafMenu,
  SafMenuItem,
  SafPagination,
  SafSearchField,
  SafToolbar,
} from '@/core-components/react';

import { MULTI_SELECT_OPTIONS, useGrid, useGridTools } from '../../hooks/useUserPermissions';
import PopUp, { TriggerElementProps } from '../common/PopUp';
import { databaseAccessMap, databasesAccessOptions, getData, skillAccessList, UserPermissions } from './data';

import './UserPermissionsGrid.scss';

const filterByUserName = (item: UserPermissions, value: string) => {
  return item.user.toLowerCase().indexOf(value.toLowerCase()) !== -1;
};

/**
 * Adds custom styles to grid cells based on its type.
 * @param panel Grid that the cell belongs to.
 * @param rowIdx Row index of the cell.
 * @param colIdx  Column index of the cell.
 * @param cell The cell to style.
 */
const itemFormatter = (panel: GridPanel, rowIdx: number, colIdx: number, cell: HTMLElement) => {
  if (panel.cellType === CellType.RowHeader) {
    cell.classList.remove('wj-header');
  }
  if (panel.cellType === CellType.ColumnHeader || panel.cellType === CellType.TopLeft) {
    cell.style.borderRight = 'unset';
    cell.style.borderLeft = 'unset';
  }
};

/** Gets the label for ShopAIAssist Skills column */
const skillsAccessTemplate = (cell: ICellTemplateContext) => {
  const hasAccessCount = cell.item.skillsAccess.length;
  if (hasAccessCount === Object.keys(skillAccessList).length) return 'All skills';
  if (hasAccessCount === 0) return 'No access';
  if (hasAccessCount === 1) return '1 skill';
  return `${hasAccessCount} skills`;
};

/** Returns an MultiSelect Wijmo editor for ShopAIAssist Skills column. */
const getSkillAccessEditor = () => {
  return new MultiSelect(document.createElement('div'), {
    selectedValuePath: 'skillName',
    displayMemberPath: 'displayName',
    itemsSource: JSON.parse(JSON.stringify(skillAccessList)),
    headerFormat: '{count} skills',
    showSelectAllCheckbox: true,
  });
};

// TODO: Integrate with grid filters
/** Component to show the filter options of the grid. */
const GridFilter = () => {
  const filteredUsersChips = ['Jane Doe', 'John Doe'].map((item, index) => {
    return (
      <SafChip key={index} closeable={true}>
        {item}
      </SafChip>
    );
  });
  // TODO: Replace with actual roles.
  const roleOptions = ['Role 1', 'Role 2'].map((item, index) => {
    return <SafFacetItem key={index} facetName={item} />;
  });
  const adminOptions = ['Yes', 'No'].map((item, index) => {
    return <SafFacetItem key={index} facetName={item} />;
  });
  const databaseOptions = databasesAccessOptions.map((item, index) => {
    return <SafFacetItem key={index} facetName={item.label} />;
  });
  const skillOptions = skillAccessList.map((item, index) => {
    return <SafFacetItem key={index} facetName={item.displayName} />;
  });
  return (
    <SafFacetedFilter filterSubTitle="Filter by:">
      <SafFacetCategory summary="User">
        <div className="user-search-filter">
          <SafSearchField />
          <SafButton>Add</SafButton>
        </div>
        <div className="filtered-users">{filteredUsersChips}</div>
      </SafFacetCategory>
      <SafDivider />
      <SafFacetCategory summary="Role">{roleOptions}</SafFacetCategory>
      <SafDivider />
      <SafFacetCategory summary="ShopAIAssist admin">{adminOptions}</SafFacetCategory>
      <SafDivider />
      <SafFacetCategory summary="Databases">{databaseOptions}</SafFacetCategory>
      <SafDivider />
      <SafFacetCategory summary="ShopAIAssist skills">{skillOptions}</SafFacetCategory>
    </SafFacetedFilter>
  );
};

interface GridToolbarProps {
  /** String to search items in the grid */
  inputSearch: string;
  /** Function to handle the onSearch event */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSearch: (event: any) => void;
  /** Indicates wheter all, some or none rows are selected */
  multiSelectRowsOption: MULTI_SELECT_OPTIONS;
  /** Function to handle `Select all` checkbox's checked */
  selectAll: () => void;
  /** List of grid's selected ids */
  selectedIds: number[];
  /** Grid's source collection view */
  itemsSource: CollectionView;
  /** Index of the page that is currently displayed on the grid */
  pageIndex: number;
}

/**
 * Compoent to display a toolbar with actions to select, search, filter and export the grid.
 * @param props {GridToolbarProps} Props for the toolbar
 */
const GridToolbar = ({
  inputSearch,
  onSearch,
  multiSelectRowsOption,
  selectAll,
  selectedIds,
  itemsSource,
  pageIndex,
}: GridToolbarProps) => {
  const [skillsAccess, multiSelectOption, filterDrawerRef, toggleSkillAccess, selectAllSkills] =
    useGridTools(skillAccessList);

  const showFilters = () => {
    filterDrawerRef.current?.show();
  };

  const databasesMenuItems = databasesAccessOptions.map((option, index) => {
    return <SafMenuItem key={index}>{option.label}</SafMenuItem>;
  });
  const skillsMenuItems = skillsAccess.map((skill, index) => {
    return (
      <SafMenuItem
        key={index}
        onClick={() => toggleSkillAccess(skill.skillName)}
        checked={skill.hasAccess}
        role="menuitemcheckbox"
      >
        {skill.displayName}
      </SafMenuItem>
    );
  });
  const renderDatabasesActionsButton = ({ id, togglePopUp }: TriggerElementProps) => {
    return (
      <SafButton
        id={id}
        onClick={togglePopUp}
        appearance="tertiary"
        className="demo-1440-hidden"
        style={{ marginLeft: 'var(--saf-space-inline-lg)' }}
      >
        <SafIcon slot="end" icon-name="chevron-down"></SafIcon>
        Databases
      </SafButton>
    );
  };
  const renderSkillsAccessActionsButton = ({ id, togglePopUp }: TriggerElementProps) => {
    return (
      <SafButton
        id={id}
        onClick={togglePopUp}
        appearance="tertiary"
        className="demo-1440-hidden"
        style={{ marginLeft: 'var(--saf-space-inline-lg)' }}
      >
        <SafIcon slot="end" icon-name="chevron-down"></SafIcon>
        ShopAIAssist skills
      </SafButton>
    );
  };
  const renderExportButton = ({ id, togglePopUp }: TriggerElementProps) => {
    return (
      <SafButton id={id} onClick={togglePopUp} appearance="secondary">
        <SafIcon slot="start" icon-name="list-tree" appearance="light"></SafIcon>
        Export
      </SafButton>
    );
  };
  return (
    <>
      <SafToolbar>
        <div slot="top-row-end">
          <span style={{ font: 'var(--saf-type-body-default-md-strong-standard)' }}>Search</span>
          <SafSearchField
            value={inputSearch}
            onInput={onSearch}
            onClear={() => onSearch({ target: { value: '' } })}
            id="search-field"
            a11y-aria-description="search by keyword or phrase"
          ></SafSearchField>
        </div>
        <div slot="bottom-row-start">
          <SafCheckbox
            checked={multiSelectOption === MULTI_SELECT_OPTIONS.ALL_SELECTED}
            indeterminate={multiSelectOption === MULTI_SELECT_OPTIONS.SOME_SELECTED}
            onChange={selectAll}
            style={{ marginLeft: 'var(--saf-space-inline-lg)' }}
          >
            Select all
          </SafCheckbox>
          {selectedIds.length} selected
          <PopUp renderTriggerElement={renderDatabasesActionsButton}>
            <SafMenu>{databasesMenuItems}</SafMenu>
          </PopUp>
          <PopUp renderTriggerElement={renderSkillsAccessActionsButton}>
            <SafMenu>
              <SafMenuItem
                role="menuitemcheckbox"
                checked={multiSelectRowsOption === MULTI_SELECT_OPTIONS.ALL_SELECTED}
                onClick={selectAllSkills}
              >
                All
              </SafMenuItem>
              <SafDivider />
              {skillsMenuItems}
            </SafMenu>
          </PopUp>
        </div>
        <div slot="bottom-row-end">
          <SafButton onClick={showFilters} appearance="secondary">
            <SafIcon slot="start" icon-name="filter" appearance="light"></SafIcon>
            Filter
          </SafButton>
          <PopUp renderTriggerElement={renderExportButton}>
            <SafMenu>
              <SafMenuItem>Export to .csv</SafMenuItem>
              <SafMenuItem>Export to Excel</SafMenuItem>
            </SafMenu>
          </PopUp>
          <SafDivider orientation="vertical" style={{ height: '42px' }}></SafDivider>
          (Showing {pageIndex * itemsSource.pageSize + 1} to{' '}
          {Math.min((pageIndex + 1) * itemsSource.pageSize, itemsSource.totalItemCount)} of {itemsSource.totalItemCount}
          )
        </div>
      </SafToolbar>
      <SafDrawer
        drawerTitle="Filters"
        drawerSubTitle="Add filters to refine your search."
        ref={filterDrawerRef}
        modal={true}
        placement="right"
      >
        <GridFilter />
      </SafDrawer>
    </>
  );
};

/** Compoent to display a Grid with the user's permissions data. */
const UserPermissionsGrid = () => {
  // TODO: use server side data instead of dummy data.
  const {
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
    pageSize,
    paginationRef,
    onPageIndexChanged,
    setItemsPerPage,
  } = useGrid(getData(), 25, filterByUserName);

  const initGrid = (grid: FlexGridInstance) => {
    grid.rowHeaders.columns[0].header = 'Select';
    grid.rowHeaders.columns[0].width = 78;
    grid.bigCheckboxes = true;

    new Selector(grid, {
      showCheckAll: false,
      itemChecked: () => {
        updateSelection();
      },
    });
  };

  return (
    <div
      style={
        {
          paddingBottom: 'var(--saf-space-stack-xxl)',
          '--var-density': 'inherit',
        } as React.CSSProperties
      }
    >
      <GridToolbar
        inputSearch={inputSearch}
        onSearch={onSearch}
        selectAll={selectAll}
        multiSelectRowsOption={multiSelectOption}
        selectedIds={selectedIds}
        itemsSource={itemsSource}
        pageIndex={pageIndex}
      />
      <FlexGrid
        ref={gridRef}
        itemsSource={searchItemsSource}
        selectionMode="CellRange"
        showMarquee={true}
        anchorCursor={true}
        headersVisibility="All"
        headersFocusability="All"
        initialized={(grid: FlexGridInstance) => initGrid(grid)}
        aria-labelledby="tableHeader"
        aria-describedby="tableDescription"
        style={{ marginTop: 'var(--saf-space-stack-lg)' }}
        className="wj-flexgrid"
        alternatingRowStep={0}
        itemFormatter={itemFormatter}
        allowSorting={false}
      >
        <FlexGridColumn binding="user" header="User" dataType={DataType.String} />
        <FlexGridColumn binding="email" header="Email" />
        <FlexGridColumn binding="role" header="Role" dataType={DataType.String} />
        <FlexGridColumn binding="isAdmin" header="ShopAIAssist admin" dataType={DataType.String} />
        <FlexGridColumn
          header="Databases"
          binding="databaseAccess"
          dataMap={databaseAccessMap}
          dataType={DataType.Array}
        />
        <FlexGridColumn
          binding={'skillsAccess'}
          header="ShopAIAssist Skills"
          dataType={DataType.Array}
          editor={getSkillAccessEditor()}
          cellTemplate={skillsAccessTemplate}
        />
      </FlexGrid>

      <SafPagination
        ref={paginationRef}
        totalItemCount={itemsSource.totalItemCount}
        itemsPerPage={pageSize}
        currentPageIndex={pageIndex + 1}
        onChange={onPageIndexChanged}
        onItemsPerPageChange={setItemsPerPage}
        style={{ marginTop: '-6px' }}
        data-aria-live="polite"
        hasBorder={false}
      />
    </div>
  );
};

export default UserPermissionsGrid;
