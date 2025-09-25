import { useEffect, useRef } from 'react';

interface ElementStyles {
  shadowElSelector: string;
  styles: Record<string, string>;
}

interface CustomizeShadowDomProps {
  elementStyles: ElementStyles[];
  selectorsToRemove?: string[];
}

/**
 * This hook is a hack to customize the Saffron components by modifying shadow DOM elements. Pass in an array of elements to customize styles with selector and a styles object to apply styles to the shadow element.
 * @param elementStyles.shadowElSelector - The selector for the shadow element. To find this, inspect the Saffron component in the browser and find the shadow element you want to style, then right click and copy the selector.
 * @param elementStyles.styles CSS styles object to apply to the shadow element (uses the style property)
 * @param selectorsToRemove - An array of selectors to remove from the shadow DOM
 * @returns ref object to wire up to the Saffron component
 * @example
 * const sideNavRef = useCustomizeShadowDom('menu', {
    marginBottom: '0'
  });
 * <SafSideNav 
      id="main-side-nav"
      ref={sideNavRef}
    ></SafSideNav>
 */
const useCustomizeShadowDom = ({ elementStyles, selectorsToRemove }: CustomizeShadowDomProps) => {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Customize the styles for a provided array of shadow DOM elements
    if (ref.current !== null) {
      if (elementStyles.length) {
        elementStyles.forEach(({ shadowElSelector, styles }) => {
          const shadowEl = ref.current?.shadowRoot?.querySelector(shadowElSelector) as HTMLElement;
          if (shadowEl) {
            Object.keys(styles).forEach((key) => {
              (shadowEl.style as unknown as Record<string, string>)[key] = styles[key];
            });
          }
        });
      }

      // Remove selectors from the shadow DOM.
      if (selectorsToRemove?.length) {
        selectorsToRemove.forEach((selector) => {
          const shadowEl = ref.current?.shadowRoot?.querySelector(selector) as HTMLElement;
          if (shadowEl) {
            shadowEl.remove();
          }
        });
      }
    }

    return () => {
      ref.current = null;
    };
  }, [ref.current]);

  return ref;
};

export default useCustomizeShadowDom;
