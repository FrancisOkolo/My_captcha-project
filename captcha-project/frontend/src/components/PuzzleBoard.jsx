import React, { useState, useRef } from 'react';
import PuzzlePiece from './PuzzlePiece';
import PieceBank from './PieceBank';
import part1 from '../images/part1.jpg';
import part2 from '../images/part2.jpg';
import part3 from '../images/part3.jpg';
import part4 from '../images/part4.jpg';
import part5 from '../images/part5.jpg';
import part6 from '../images/part6.jpg';
import part7 from '../images/part7.jpg';
import part8 from '../images/part8.jpg';
import part9 from '../images/part9.jpg';

function PuzzleBoard() {
  const initialPieces = [
    { id: '1', src: part1 },
    { id: '2', src: part2 },
    { id: '3', src: part3 },
    { id: '4', src: part4 },
    { id: '5', src: part5 },
    { id: '6', src: part6 },
    { id: '7', src: part7 },
    { id: '8', src: part8 },
    { id: '9', src: part9 },
  ];

  const [puzzlePieces, setPuzzlePieces] = useState(() => {
    const pieces = [...initialPieces];
    const missingIndex = Math.floor(Math.random() * 9);
    pieces[missingIndex] = null;
    return pieces;
  });

  const [missingPieceIndex, setMissingPieceIndex] = useState(() => {
    return puzzlePieces.findIndex((piece) => piece === null);
  });

  const [correctPiece, setCorrectPiece] = useState(() => {
    return initialPieces[puzzlePieces.findIndex((piece) => piece === null)];
  });

  const [availablePieces, setAvailablePieces] = useState(initialPieces);

  const dragItem = useRef();
  const dragOverItem = useRef();
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [isDragging, setIsDragging] = useState(false); // New state to track if dragging

  const handleDragStart = (e, id) => {
    dragItem.current = id;
    setDraggedPiece(availablePieces.find(piece => piece.id === id));
    setIsDragging(true); // Set isDragging to true
  };

  const handleDragEnter = (e, id) => {
    dragOverItem.current = id;
  };

  const handleDragEnd = (e) => {
    const dragPiece = availablePieces.find((piece) => piece.id === dragItem.current);
    if (dragOverItem.current === missingPieceIndex.toString() && dragPiece.id === correctPiece.id) {
      const newPieces = [...puzzlePieces];
      newPieces[missingPieceIndex] = dragPiece;
      setPuzzlePieces(newPieces);
      setAvailablePieces(availablePieces.filter(piece => piece.id !== dragPiece.id));
    }
    setDraggedPiece(null);
    setIsDragging(false); // Set isDragging to false
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: '5px' }}>
        {puzzlePieces.map((piece, index) => (
          piece ? (
            <PuzzlePiece key={index} pieceId={piece.id} pieceSrc={piece.src} />
          ) : (
            <div
              key={index}
              style={{ width: '100px', height: '100px', border: '2px dashed gray' }}
              onDragEnter={(e) => handleDragEnter(e, index.toString())}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={handleDragEnd}
            >
              {isDragging && draggedPiece && dragOverItem.current === index.toString() && (
                <img
                  src={draggedPiece.src}
                  alt={`Dragged piece`}
                  style={{ width: '100px', height: '100px' }}
                />
              )}
            </div>
          )
        ))}
      </div>
      <PieceBank pieces={availablePieces} onDragStart={handleDragStart} />
    </div>
  );
}

export default PuzzleBoard;