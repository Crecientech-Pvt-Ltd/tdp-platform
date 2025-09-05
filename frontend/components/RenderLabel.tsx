import React from 'react';

interface FlexibleLabelListProps {
  /** Array of string labels to display */
  labels?: string[];

  /** Minimum width of the container in px */
  minWidth?: number;

  /** Minimum height of the container in px */
  minHeight?: number;

  /** Maximum width of the container in px */
  maxWidth?: number;

  /** Maximum height of the container in px */
  maxHeight?: number;

  /** Whether to auto-size width based on the length and content of labels array */
  increaseWithTheLengthOfArrayOfLabel?: boolean;

  /** Background color using Tailwind CSS */
  bgColor?: string;

  /** Show horizontal scrollbar when content overflows */
  showScrollbarX?: boolean;

  /** Show vertical scrollbar when content overflows */
  showScrollbarY?: boolean;

  /** Truncate individual labels that exceed container width with ellipsis */
  truncateX?: boolean;

  /** Truncate the list vertically (show first few labels, dots, then last few labels) */
  truncateY?: boolean;

  /**
   * Number of rows to show - automatically adjusts height to accommodate this many rows.
   * Takes precedence over minHeight if provided.
   */
  rowsToShow?: number;

  /** Additional CSS classes to apply to the container */
  className?: string;

  /** Additional CSS classes to apply to each label/row */
  labelClassName?: string;
}

const FlexibleLabelList = ({
  labels = [],
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  increaseWithTheLengthOfArrayOfLabel = false,
  bgColor = 'bg-white',
  showScrollbarX = false,
  showScrollbarY = false,
  truncateX = false,
  truncateY = false,
  rowsToShow,
  className = '',
  labelClassName = '',
}: FlexibleLabelListProps) => {
  const calculateHeight = () => {
    if (minHeight) return minHeight;
    if (rowsToShow && labels.length > 0) {
      return Math.min((rowsToShow + 1) * 28 + 16, maxHeight || 400);
    }
    return 'auto';
  };

  const calculateWidth = () => {
    if (increaseWithTheLengthOfArrayOfLabel && labels.length > 0) {
      const avgLength = labels.reduce((sum, label) => sum + label.length, 0) / labels.length;
      const estimatedWidth = Math.max(avgLength * 8 + 32, minWidth || 200);
      return Math.min(estimatedWidth, maxWidth || 600);
    }
    return minWidth || 'auto';
  };

  const processLabelsForYTruncation = () => {
    if (!truncateY || labels.length <= 8) {
      return labels;
    }

    const firstLabels = labels.slice(0, 3);
    const lastLabels = labels.slice(-2);
    const dots = ['•', '•', '•', '•', '•'];

    return [...firstLabels, ...dots, ...lastLabels];
  };

  const processedLabels = processLabelsForYTruncation();

  const truncateLabel = (label: string) => {
    if (!truncateX) return label;

    const containerWidth = calculateWidth();
    if (typeof containerWidth === 'number') {
      const maxChars = Math.floor(containerWidth / 8) - 4;
      return label.length > maxChars ? label.substring(0, maxChars) + '...' : label;
    }
    return label;
  };

  const containerStyle: React.CSSProperties = {
    minWidth: minWidth || 'auto',
    minHeight: calculateHeight(),
    maxWidth: maxWidth || 'none',
    maxHeight: maxHeight || 'none',
    width: calculateWidth(),
    overflowX: showScrollbarX ? 'auto' : 'hidden',
    overflowY: showScrollbarY ? 'auto' : 'hidden',
  };

  const scrollbarStyles = `
    ${!showScrollbarX ? '[&::-webkit-scrollbar-horizontal]:hidden' : ''}
    ${!showScrollbarY ? '[&::-webkit-scrollbar-vertical]:hidden' : ''}
    ${!showScrollbarX && !showScrollbarY ? '[&::-webkit-scrollbar]:hidden' : ''}
  `;

  return (
    <div
      className={`
        ${bgColor} 
        border border-gray-300 
        rounded-lg 
        p-3 
        ${scrollbarStyles}
        scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100
        ${className}
      `}
      style={containerStyle}
    >
      {processedLabels.length === 0 ? (
        <div className='text-gray-500 italic'>No labels to display</div>
      ) : (
        <div className='space-y-1'>
          {processedLabels.map((label, index) => (
            <div
              key={index}
              className={`
                text-sm 
                text-gray-800 
                py-1 
                px-2 
                rounded 
                hover:bg-gray-100 
                transition-colors
                ${label === '•' ? 'text-center text-gray-400 hover:bg-transparent' : ''}
                ${truncateX ? 'whitespace-nowrap overflow-hidden text-ellipsis' : 'break-words'}
                ${labelClassName}
              `}
              title={label !== '•' ? label : ''} 
            >
              {truncateLabel(label)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlexibleLabelList;
