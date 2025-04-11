// src/PieceBank.js
import React from 'react';
import PuzzlePiece from './PuzzlePiece';

function PieceBank({ pieces, onDragStart }) {
  return (
    <div style={{ display: 'flex' }}>
      {pieces.map((piece) => (
        <PuzzlePiece
          key={piece.id}
          pieceId={piece.id}
          pieceSrc={piece.src}
          onDragStart={onDragStart}
        />
      ))}
    </div>
  );
}

export default PieceBank;