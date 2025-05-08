import React from 'react';
import PuzzlePiece from './PuzzlePiece';

function PieceBank({ pieces, onDragStart, pieceSize = '100px' }) {
  return (
    <div className="piece-bank" style={{ 
      display: 'flex',
      flexDirection: 'column',
      marginTop: '20px',
      padding: '10px',
      backgroundColor: '#f5f5f5',
      borderRadius: '5px'
    }}>
      <h3 style={{ marginBottom: '10px' }}>Select the correct piece:</h3>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '10px',
        justifyContent: 'center'
      }}>
        {pieces.map((piece) => (
          piece && (
            <div key={piece.id} style={{ margin: '5px' }}>
              <PuzzlePiece
                pieceId={piece.id}
                pieceSrc={piece.src}
                onDragStart={onDragStart}
                pieceSize={pieceSize}
              />
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default PieceBank;