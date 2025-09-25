import React from 'react';
import { MfeContext } from '@';
import { useOutletContext } from 'react-router-dom';

import { ManageFavorites } from '../../components/mfes';
import { useContextWithTaggedConsole } from '../../components/mfes/MfeContent';
import LOG from '../../services/LoggingService';

const Favorites = () => {
  const context = useOutletContext<MfeContext | null>();
  let aiSkillsContext: MfeContext | null = null;

  try {
    aiSkillsContext = context && useContextWithTaggedConsole(context, '[ai-skills-mfe]');
  } catch (e) {
    // Because useContextWithTaggedConsole is conditionally used, it may throw an error if the context is null.
    LOG.error('Caught conditionally used hook error', e);
  }

  return <>{aiSkillsContext && <ManageFavorites context={aiSkillsContext} />}</>;
};

export default Favorites;
