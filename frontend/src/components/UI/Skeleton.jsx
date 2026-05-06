import React from 'react';

const Skeleton = ({ className = '', circle = false, width, height, count = 1 }) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded-md';
  const shapeClass = circle ? 'rounded-full' : 'rounded-md';
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${shapeClass} ${className}`}
          style={style}
        />
      ))}
    </>
  );
};

export const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-6 shadow-card space-y-4">
    <div className="flex items-center gap-4">
      <Skeleton circle width={48} height={48} />
      <div className="space-y-2 flex-1">
        <Skeleton height={16} className="w-3/4" />
        <Skeleton height={12} className="w-1/2" />
      </div>
    </div>
    <Skeleton height={60} />
    <div className="flex gap-2">
      <Skeleton height={32} className="w-24" />
      <Skeleton height={32} className="w-24" />
    </div>
  </div>
);

export const SkeletonStat = () => (
  <div className="bg-white rounded-xl p-6 shadow-card space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton circle width={40} height={40} />
      <Skeleton height={16} className="w-24" />
    </div>
    <Skeleton height={32} className="w-16" />
    <Skeleton height={14} className="w-32" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="bg-white rounded-xl shadow-card overflow-hidden">
    <div className="p-4 border-b border-gray-100">
      <Skeleton height={20} className="w-48" />
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <Skeleton height={16} className="w-full" />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;

