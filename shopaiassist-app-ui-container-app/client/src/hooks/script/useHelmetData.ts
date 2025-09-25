import { useState } from 'react';
import { HelmetData } from 'react-helmet-async';

/**
 * Custom React hook to manage the data for a Helmet component. This prevents us from having to have a
 * `<HelmetProvider>` around the whole app.
 */
export const useHelmetData = () => {
  const [helmetData] = useState<HelmetData>(new HelmetData({}));
  return helmetData;
};
