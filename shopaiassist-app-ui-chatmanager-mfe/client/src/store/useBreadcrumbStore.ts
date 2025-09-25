import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { BreadcrumbItem } from '@reacttext/prometheus';
import { useChatSidebarStore } from './useChatSidebarStore';

export interface BreadcrumbsState {
  breadcrumbs: BreadcrumbItem[];
  addBreadcrumb: (newCrumb: BreadcrumbItem) => void;
  updateBreadcrumb: (crumbToUpdateId: string, newLabel: string) => void;
  removeBreadcrumb: (crumbKeyToRemove: string) => void;
}

/**
 * Creates a Zustand store to manage breadcrumb state using Zustand along with devtools for debugging.
 * The store contains state and actions related to breadcrumb items.
 *
 * @returns {UseStore<ModalState>} A Zustand store with the following:
 *         - `breadcrumbs`: The current list of breadcrumb items.
 *         - `addBreadcrumb`: Function to add a new breadcrumb item to the list.
 *         - `removeBreadcrumb`: Function to remove a breadcrumb item from the list by its key.
 */
export const useBreadCrumbStore = create<BreadcrumbsState>()(
  devtools(
    (set, get) => ({
      breadcrumbs: [
        {
          label: 'My Work',
          href: 'javascript:;',
          onClick: () => {
            useChatSidebarStore.getState().setActiveChat();
            useChatSidebarStore.getState().setActiveFolder();
          }
        }
      ],
      /**
       * Adds a new breadcrumb item to the list.
       * @param {BreadcrumbItem} newCrumb - The new breadcrumb item to add.
       */
      addBreadcrumb: (newCrumb) => {
        const currentCrumbs = [...get().breadcrumbs];
        if (!currentCrumbs.find((crumb) => crumb.testId === newCrumb.testId)) {
          set({ breadcrumbs: [...get().breadcrumbs, newCrumb] });
        }
      },
      /**
       * Updates a breadcrumb's information.
       *
       * @param {string} crumbToUpdateId - The identifier of the breadcrumb item to update.
       * @param {string} newLabel - The new label for the breadcrumb item.
       */
      updateBreadcrumb: (crumbToUpdateId, newLabel) => {
        const currentCrumbs = [...get().breadcrumbs];
        const crumbToUpdateIndex = currentCrumbs.findIndex((crumb) => crumb.testId === crumbToUpdateId);
        if (crumbToUpdateIndex >= 0) {
          currentCrumbs[crumbToUpdateIndex].label = newLabel;
          set({ breadcrumbs: currentCrumbs });
        }
      },
      /**
       * Removes a breadcrumb item from the list by its key.
       * @param {string} crumbKeyToRemove - The key of the breadcrumb item to remove.
       */
      removeBreadcrumb: (crumbKeyToRemove) => {
        const currentCrumbs = [...get().breadcrumbs];
        const newCrumbs = currentCrumbs.filter((crumb) => crumb.testId !== crumbKeyToRemove);
        set({ breadcrumbs: newCrumbs });
      }
    }),
    { name: 'useBreadCrumbStore' }
  )
);
