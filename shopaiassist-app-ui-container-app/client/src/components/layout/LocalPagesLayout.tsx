import React from 'react';
import { MfeContext } from '@';
import { BreadcrumbItem, Breadcrumbs, i18n } from '@/';
import { Outlet, useLocation, useOutletContext } from 'react-router-dom';

import { getPathName } from '../../utils/misc';

const LocalPagesLayout = () => {
  const { t } = i18n.useTranslation();
  const context = useOutletContext<MfeContext | null>();
  const breadcrumbs: BreadcrumbItem[] = [];
  const pathname = useLocation().pathname;
  const pathParts = pathname.split('/').filter(Boolean); // Split the pathname into parts and remove any empty strings
  for (const path of pathParts) {
    breadcrumbs.push({
      label: getPathName(path, t),
    });
  }

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <div className="olympus-content-container">
        <Outlet context={context} />
      </div>
    </>
  );
};

export default LocalPagesLayout;
