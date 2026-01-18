import React from 'react';

export const RivetlyLogo = ({ className = "w-6 h-6" }) => {
  // Parsing the className to see if we need to adjust inner elements or just the container.
  // The user's example passes sizing classes and text color.
  // We'll create a simple SVG logo that looks like the "R" box but scalable.
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="6" fill="currentColor" />
      <path d="M7 7H12.5C14.9853 7 17 9.01472 17 11.5C17 13.9853 14.9853 16 12.5 16H9V19H7V7Z" fill="#020617" />
      <path d="M12.5 16L15.5 19" stroke="#020617" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
