// src/PuzzlePiece.js
import React, { useRef } from 'react';

function PuzzlePiece({ pieceId, pieceSrc, onDragStart }) {
  const handleDragStart = (e) => {
    onDragStart(pieceId); // Pass pieceId to parent component
  };

  return (
    <img
      src={pieceSrc}
      alt={`Puzzle piece ${pieceId}`}
      draggable="true"
      onDragStart={handleDragStart}
      style={{ width: '100px', height: '100px', border: '1px solid black' }}
    />
  );
}

export default PuzzlePiece;