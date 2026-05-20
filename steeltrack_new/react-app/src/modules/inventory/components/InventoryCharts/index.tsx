import React from 'react';
import { Material } from '../../services/materialService';

interface Props { materials: Material[]; }

export const InventoryCharts: React.FC<Props> = () => {
  return <div className="inventory-charts-placeholder" style={{ display: 'none' }}></div>;
};
