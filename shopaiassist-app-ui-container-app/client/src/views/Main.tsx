import React from 'react';
import { MfeContext } from '@';
import { useOutletContext } from 'react-router-dom';

import MfeContent from '../components/mfes/MfeContent';

const Main = () => {
  const context = useOutletContext<MfeContext | null>();

  return (
    <>
      {!!context && (
        <>
          <MfeContent context={context} />
        </>
      )}
    </>
  );
};

export default Main;
