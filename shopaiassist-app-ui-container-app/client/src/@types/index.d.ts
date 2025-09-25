interface AngularMfeLoaderConfig<P extends object = object> extends MfeLoaderConfig<P> {
  /* Specific element id to give the containing div */
  elementId: string;
}

type ReactMfeLoaderConfig<P extends object = object> = MfeLoaderConfig<P>;

interface MfeLoaderConfig<P extends object = object> extends MfeConfig {
  /** The props to pass to the component */
  props?: P;
}

interface MfeConfig {
  /** The name of the module to load from a MFE see 'loadComponent' for more details */
  module: string;
  /** The name of the scope to load from a MFE see 'loadComponent' for more details */
  scope: MfeName;
  /** The url of the MFE to load */
  url: string;
}

type MfeName = 'ai_assistant_mfe' | 'ai_skills_mfe' | 'matters_mfe' | 'file_management_mfe';

type SecondarySideNavTree = 'manage' | 'admin' | 'support' | 'legal';

interface SecondaryNavState {
  show: boolean;
  tree: SecondarySideNavTree;
}

interface NavMenuItem {
  disabled?: boolean;
  icon?: string;
  id: string;
  label: string;
  /** Internal path to navigate to */
  navPath?: string;
  onClick?: () => void;
  secondaryNavTree?: SecondarySideNavTree;
  showArrow?: boolean;
  bold?: boolean;
  /** External URL to link to */
  url?: string;
  pendoId?: string;
}

type NavMenuTree = Record<string, NavMenuItem[]>;

interface BreadcrumbItem {
  label: string;
  href?: string;
}

type TimeoutState = 'expired' | 'warning' | 'active';
