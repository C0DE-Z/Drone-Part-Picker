import React, { useState } from 'react';
import ComponentCard from './ComponentCard';
import ComponentModal from './ComponentModal';
import { Motor, Frame, Stack, Camera, Prop, Battery, CustomWeight } from '@/types/drone';

interface SelectedComponents {
  motor?: { name: string; data: Motor };
  frame?: { name: string; data: Frame };
  stack?: { name: string; data: Stack };
  camera?: { name: string; data: Camera };
  prop?: { name: string; data: Prop };
  battery?: { name: string; data: Battery };
  customWeights?: { name: string; data: CustomWeight }[];
}

interface ComponentGridProps {
  components: Record<string, Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight>;
  type: 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight';
  selectedComponents: SelectedComponents;
  onComponentSelect: (type: 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight', name: string, component: Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight) => void;
  checkCompatibility: () => boolean;
  searchTerm: string;
}

export default function ComponentGrid({
  components,
  type,
  selectedComponents,
  onComponentSelect,
  checkCompatibility,
  searchTerm
}: ComponentGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const itemsPerPage = 20;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    name: string;
    component: Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight;
    type: 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight';
    cardRect?: DOMRect;
  } | null>(null);

  const handleViewDetails = (name: string, component: Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight, type: 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight', cardRect?: DOMRect) => {
    setModalData({ name, component, type, cardRect });
    setModalOpen(true);
  };


  // Sorting options
  const [sortOption, setSortOption] = useState<'name-asc' | 'name-desc' | 'brand-asc' | 'brand-desc' | 'spec-desc' | 'spec-asc'>('name-asc');

  // Helper to get brand/spec for sorting
  const getBrand = (c: Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight) => 
    'brand' in c ? c.brand || '' : '';
  const getSpec = (c: Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight) => {
    if ('capacity' in c) return c.capacity || 0;
    if ('kv' in c) return c.kv || 0;
    if ('thrust' in c) return c.thrust || 0;
    if ('cellCount' in c) return c.cellCount || 0;
    return 0;
  };

  // Sort function
  const sortedEntries = Object.entries(components).sort(([nameA, compA], [nameB, compB]) => {
    switch (sortOption) {
      case 'name-asc':
        return nameA.localeCompare(nameB);
      case 'name-desc':
        return nameB.localeCompare(nameA);
      case 'brand-asc':
        return getBrand(compA).localeCompare(getBrand(compB));
      case 'brand-desc':
        return getBrand(compB).localeCompare(getBrand(compA));
      case 'spec-desc':
        return Number(getSpec(compB)) - Number(getSpec(compA));
      case 'spec-asc':
        return Number(getSpec(compA)) - Number(getSpec(compB));
      default:
        return 0;
    }
  });

  const totalItems = sortedEntries.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Show limited items or all items based on expansion state
  const displayItems = isExpanded 
    ? sortedEntries 
    : sortedEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setCurrentPage(1); // Reset to first page when expanding
    }
  };

  if (totalItems === 0) {
    return (
      <div className="text-center py-16 transition-all duration-500 ease-out">
  <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">No results</div>
  <p className="animate-fade-in text-slate-600">No components found matching &quot;{searchTerm}&quot;</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5">
      {/* Sort Dropdown */}
      <div className="mb-4 flex flex-wrap items-center gap-3 sm:gap-4">
        <label htmlFor="sort" className="text-sm font-medium text-slate-600">Sort by:</label>
        <select
          id="sort"
          value={sortOption}
          onChange={e => setSortOption(e.target.value as typeof sortOption)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="brand-asc">Brand (A-Z)</option>
          <option value="brand-desc">Brand (Z-A)</option>
          <option value="spec-desc">Spec (High-Low)</option>
          <option value="spec-asc">Spec (Low-High)</option>
        </select>
      </div>

      {/* Component Grid */}
      <div className="grid auto-cols-max grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3 sm:gap-5">
        {displayItems.map(([name, component]) => (
          <div
            key={name}
            className="transition-all duration-300 ease-out"
            style={{ 
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            <ComponentCard
              name={name}
              component={component}
              type={type}
              isSelected={
                type === 'customWeight' 
                  ? (selectedComponents.customWeights || []).some((w: { name: string; data: CustomWeight }) => w.name === name)
                  : (selectedComponents[type as keyof Omit<SelectedComponents, 'customWeights'>] as { name: string } | undefined)?.name === name
              }
              onSelect={() => onComponentSelect(type, name, component)}
              onViewDetails={handleViewDetails}
              isCompatible={checkCompatibility()}
            />
          </div>
        ))}
      </div>

      {/* Pagination and Expand Controls */}
      {totalItems > itemsPerPage && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Pagination (only show when not expanded) */}
          {!isExpanded && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-slate-600 shadow-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ←
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`rounded-lg border px-3 py-1 text-sm transition-colors ${
                        currentPage === pageNum
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-slate-500 shadow-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                →
              </button>
            </div>
          )}

          {/* Expand/Collapse Button */}
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-100 hover:shadow"
          >
            <span className="text-sm font-medium">
              {isExpanded ? 'Show Less' : `Show All ${totalItems} Items`}
            </span>
            <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}> 
              ↓
            </div>
          </button>

          {/* Items count info */}
          <div className="text-sm text-slate-600">
            {isExpanded 
              ? `Showing all ${totalItems} items`
              : `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} items`
            }
          </div>
        </div>
      )}

      {/* Component Modal */}
      {modalData && (
        <ComponentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          name={modalData.name}
          component={modalData.component}
          type={modalData.type}
          cardRect={modalData.cardRect}
        />
      )}
    </div>
  );
}
