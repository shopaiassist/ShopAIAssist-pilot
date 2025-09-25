import React from 'react';
import { MfeContext } from '@';
import { useOutletContext } from 'react-router-dom';

import { DatabaseManagement } from '../components/mfes';
import { useContextWithTaggedConsole } from '../components/mfes/MfeContent';
import LOG from '../services/LoggingService';

const Databases = () => {
  const context = useOutletContext<MfeContext | null>();
  let fileManagementContext: MfeContext | null = null;

  try {
    fileManagementContext = context && useContextWithTaggedConsole(context, '[file-management-mfe]');
  } catch (e) {
    // Because useContextWithTaggedConsole is conditionally used, it may throw an error if the context is null.
    LOG.error('Caught conditionally used hook error', e);
  }

  return <>{fileManagementContext && <DatabaseManagement context={fileManagementContext} />}</>;
};

export default Databases;
