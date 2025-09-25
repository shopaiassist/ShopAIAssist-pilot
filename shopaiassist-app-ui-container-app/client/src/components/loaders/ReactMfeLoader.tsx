import React, { lazy, Suspense } from 'react';
import { i18n } from '@/';
import { SafProgressRing } from '@/core-components/react';

import useDynamicScript from '../../hooks/mfe/dynamicScript';
import LOG from '../../services/LoggingService';
import { loadComponent } from '../../utils/webpack';

import './ReactMfeLoader.scss';

/**
 * A component that loads a React MFE module.
 *
 * @param url
 * @param module
 * @param scope
 * @param props
 * @constructor
 */
const ReactMfeLoader = <P extends object>({ module, props, scope, url }: MfeLoaderConfig<P>) => {
  const { ready, failed } = useDynamicScript({
    url: module && url,
  });
  const { t } = i18n.useTranslation();

  if (!module) {
    return <h6>{t('NO_MFE_MODULE')}</h6>;
  }

  if (!scope) {
    return <h6>{t('NO_MFE_SCOPE')}</h6>;
  }

  if (!url) {
    return <h6>{t('NO_MFE_URL')}</h6>;
  }

  if (!ready && !failed) {
    LOG.log('Loading dynamic React script: ', url);
    return <></>;
  }

  if (failed) {
    return <h6>{t('FAILED_TO_LOAD_SCRIPT', { scope, url })}</h6>;
  }

  const Component = lazy(loadComponent(scope, module));

  return (
    <Suspense
      fallback={
        <div className="olympus-mfe-loader-delay-in">
          <SafProgressRing ariaLabel={t('LOADING')} progressSize="small" />
        </div>
      }
    >
      {!!Component && <Component {...props} />}
    </Suspense>
  );
};

export default ReactMfeLoader;
