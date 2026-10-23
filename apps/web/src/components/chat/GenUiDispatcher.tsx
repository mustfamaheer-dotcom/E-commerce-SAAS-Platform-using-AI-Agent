// apps/web/src/components/chat/GenUiDispatcher.tsx
import React from 'react';
import { GenUiRegistry, GenUiRegistryProps } from './GenUiRegistry';

export const GenUiDispatcher: React.FC<GenUiRegistryProps> = (props) => {
  return <GenUiRegistry {...props} />;
};
