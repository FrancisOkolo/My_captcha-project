// src/PuzzlePiece.js
import React, { useRef } from 'react';

function PuzzlePiece({ pieceId, pieceSrc, onDragStart }) {
  const dragItem = useRef();

  const handleDragStart = (e) => {
    dragItem.current = pieceId;
    onDragStart(e, pieceId);
  };

  return (
    <img
      ref={dragItem}
      src={pieceSrc}
      alt={`Puzzle piece ${pieceId}`}
      draggable="true"
      onDragStart={handleDragStart}
      style={{ width: '100px', height: '100px', border: '1px solid black' }}
    />
  );
}

export default PuzzlePiece;