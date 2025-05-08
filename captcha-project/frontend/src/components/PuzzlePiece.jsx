import React from 'react';

function PuzzlePiece({ pieceId, pieceSrc, onDragStart, pieceSize = '100px' }) {
  const handleDragStart = (e) => {
    if (onDragStart) {
      onDragStart(pieceId); // Pass pieceId to parent component
    }
  };

  return (
    <img
      src={pieceSrc}
      alt={`Puzzle piece ${pieceId}`}
      draggable="true"
      onDragStart={handleDragStart}
      style={{ 
        width: pieceSize, 
        height: pieceSize, 
        border: '1px solid black',
        objectFit: 'cover'
      }}
    />
  );
}

export default PuzzlePiece;