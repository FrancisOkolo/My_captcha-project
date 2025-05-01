import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PuzzlePiece from './PuzzlePiece';
import PieceBank from './PieceBank';

function PuzzleBoard() {
  const [puzzleData, setPuzzleData] = useState({ pieces: [], missingIndex: -1 });
  const [availablePieces, setAvailablePieces] = useState([]);
  const [difficulty, setDifficulty] = useState('easy'); // Add difficulty state
  const dragItem = useRef();
  const dragOverItem = useRef();

  useEffect(() => {
    axios.get(`http://localhost:5000/generate_captcha?difficulty=${difficulty}`,
      {withCredentials: true})
      .then(res => {
        const pieces = res.data.puzzle.map((src, i) => ({ id: `${i}`, src }));
        setPuzzleData({ pieces, missingIndex: res.data.missing_index });
        setAvailablePieces(pieces)//.filter((_, i) => i !== res.data.missing_index));
      });
  }, []);

  const handleDragEnd = () => {
    axios.post('http://localhost:5000/validate_captcha', 
    {placed_index: puzzleData.missingIndex}, // ✅ Correct index for validation
    {withCredentials: true}
    ).then(res => {
      if (res.data.correct) {
        const draggedPiece = availablePieces.find(p => p.id === dragItem.current);
        
        // Update puzzle grid
        const updatedPieces = [...puzzleData.pieces];
        updatedPieces[puzzleData.missingIndex] = draggedPiece;

        setPuzzleData({
          pieces: updatedPieces,
          missingIndex: -1
        });
        
        setAvailablePieces(prev => prev.filter(p => p.id !== dragItem.current));
      }
    }).catch(err => console.error("Validation error:", err));
  };

  return (
    <div className="puzzle-container">
      <div className="puzzle-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: '5px' }}>
        {puzzleData.pieces.map((piece, index) => (
          index === puzzleData.missingIndex ? (
            <div 
              key={index}
              className="empty-slot"
              style={{ width: '100px', height: '100px', border: '2px dashed gray' }}
              onDragOver={(e) => {
                e.preventDefault();
                dragOverItem.current = index;
              }}
              onDrop={() => handleDragEnd()}
            />
          ) : (
            <PuzzlePiece key={index} pieceId={piece.id} pieceSrc={piece.src} />
          )
        ))}
      </div>
      <PieceBank 
        pieces={availablePieces}
        onDragStart={id => dragItem.current = id}
      />
    </div>
  );
}

export default PuzzleBoard;
