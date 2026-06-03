import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CompactStockRow from './compact-stock-row';
import { GripVertical } from 'lucide-react';

export function SortableStockRow({ symbol, data, analysisData, ownedQuantity, averagePrice, loading, onRemove, onPress }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: symbol });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-2 text-default-400 opacity-30 hover:opacity-100 touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={20} />
      </div>
      <div className="pl-10">
        <CompactStockRow 
          symbol={symbol} 
          priceData={data} 
          analysisData={analysisData}
          ownedQuantity={ownedQuantity}
          averagePrice={averagePrice}
          loading={loading} 
          onRemove={onRemove} 
          onPress={onPress} 
        />
      </div>
    </div>
  );
}
