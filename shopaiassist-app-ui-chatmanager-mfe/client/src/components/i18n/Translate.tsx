import React from 'react';
import { useTranslation } from 'react-i18next';

interface TranslateProps {
  tKey: string;
  values?: { [key: string]: string | number };
}

/**
 * A component that loads a translation from the i18n translation files.
 * @param tKey
 * @param values
 */
const Translate = ({ tKey, values = {} }: TranslateProps) => {
  const { t } = useTranslation();
  const defaultString = `No translation: ${tKey}`;

  return <>{t(tKey, { defaultValue: defaultString, ...values })}</>;
};

export default Translate;
