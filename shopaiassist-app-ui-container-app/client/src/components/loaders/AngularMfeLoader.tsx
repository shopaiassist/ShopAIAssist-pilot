import React, { useEffect } from 'react';
import { i18n } from '@/';

import useDynamicScript from '../../hooks/mfe/dynamicScript';
import LOG from '../../services/LoggingService';
import { loadComponent } from '../../utils/webpack';

/**
 * A component that loads an Angular MFE module.
 *
 * @param url
 * @param module
 * @param scope
 * @param elementId
 * @constructor
 */
const AngularMfeLoader = <P extends object>({ elementId, module, props, scope, url }: AngularMfeLoaderConfig<P>) => {
  const { ready, failed } = useDynamicScript({
    url: module && url,
  });
  const { t } = i18n.useTranslation();

  // FIXME: Refactor this into a custom hook
  // eslint-disable-next-line use-encapsulation/prefer-custom-hooks
  useEffect(() => {
    if (ready && !failed && scope && module) {
      const containerElement = document.getElementById(elementId);
      if (containerElement) {
        loadComponent(scope, module, elementId)()
          .then((Module) => {
            // Note: this function must be exported/exposed from the angular MFE
            if (typeof Module.default === 'function') {
              try {
                Module.default(containerElement, props);
              } catch (err) {
                LOG.error(`Error bootstrapping Angular module '${module}' from scope '${scope}':`, err);
                throw err;
              }
            }
          })
          .catch((err) => {
            LOG.error(`Error loading module '${module}' from scope '${scope}':`, err);
          });
      } else {
        LOG.error(`Could not find element with id ${elementId}.`);
      }
    }
  }, [ready, failed, scope, module]);

  if (!module) {
    return <h2>{t('NO_MFE_MODULE')}</h2>;
  }

  if (!scope) {
    return <h2>{t('NO_MFE_SCOPE')}</h2>;
  }

  if (!ready && !failed) {
    LOG.log('Loading dynamic Angular script: ', url);
    return <></>;
  }

  if (failed) {
    return <h2>{t('FAILED_TO_LOAD_SCRIPT', { scope, url })}</h2>;
  }

  return <div id={elementId} />;
};

export default AngularMfeLoader;
