import { ReactNode } from 'react';

export interface MatterBodyContentProps {
  contentComponent: ReactNode;
}

const MatterBodyContent = (props: MatterBodyContentProps) => {
  const { contentComponent } = props;
  return <>{contentComponent}</>;
};

export default MatterBodyContent;
