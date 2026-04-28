import React from 'react';

const Card = ({ children, className = '', hover = true, padding = 'p-6', ...props }) => {
  const baseClasses = `bg-white rounded-xl shadow-card ${padding} ${className}`;
  const hoverClasses = hover ? 'card-hover' : '';

  return (
    <div className={`${baseClasses} ${hoverClasses}`} {...props}>
      {children}
    </div>
  );
};

export default Card;

