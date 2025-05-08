import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PuzzlePiece from './PuzzlePiece';
import PieceBank from './PieceBank';

function PuzzleBoard() {
  const [puzzleData, setPuzzleData] = useState({ pieces: [], missingIndex: -1 });
  const [availablePieces, setAvailablePieces] = useState([]);
  const [difficulty, setDifficulty] = useState('easy');
  const [loading, setLoading] = useState(true);
  const dragItem = useRef();
  const dragOverItem = useRef();
  
  // Add debugging - show Q-learning progress
  const [qLearningStatus, setQLearningStatus] = useState({
    current: 'easy',
    next: 'unknown',
    retries: 0,
    solveTime: 0
  });

  const fetchPuzzle = (currentDifficulty) => {
    setLoading(true);
    axios.get(`http://localhost:5000/generate_captcha`, 
      {withCredentials: true})
      .then(res => {
        const pieces = res.data.puzzle.map((src, i) => ({ id: `${i}`, src }));
        
        // Create a copy of the puzzle with an empty slot
        const puzzlePieces = [...pieces];
        puzzlePieces[res.data.missing_index] = null; // Mark the missing slot as null
        
        // All pieces should be available in the bank - create a shuffled copy
        const allPieces = [...pieces];
        // Fisher-Yates shuffle algorithm
        for (let i = allPieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPieces[i], allPieces[j]] = [allPieces[j], allPieces[i]];
        }
        
        setPuzzleData({ pieces: puzzlePieces, missingIndex: res.data.missing_index });
        setAvailablePieces(allPieces);
        setDifficulty(res.data.difficulty);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch puzzle:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPuzzle(difficulty);
  }, []);

  const handleDragEnd = () => {
    // Check if we have a valid piece being dragged
    if (!dragItem.current) {
      return;
    }
    
    // Find the dragged piece
    const draggedPiece = availablePieces.find(p => p.id === dragItem.current);
    if (!draggedPiece) {
      return;
    }
    
    // First update the UI to show the piece in place
    const updatedPieces = [...puzzleData.pieces];
    updatedPieces[puzzleData.missingIndex] = draggedPiece;
    
    setPuzzleData({
      pieces: updatedPieces,
      missingIndex: -1
    });
    
    // Then validate with the server
    axios.post('http://localhost:5000/validate_captcha',
     {
       placed_index: draggedPiece.id,
       missing_index: puzzleData.missingIndex
     },
     {withCredentials: true}
    ).then(res => {
      // Update Q-learning status for display
      setQLearningStatus({
        current: res.data.current_difficulty,
        next: res.data.next_difficulty,
        retries: res.data.retries,
        solveTime: res.data.solve_time
      });
      
      if (res.data.correct) {
        // Show the completed puzzle briefly before loading next difficulty
        setTimeout(() => {
          fetchPuzzle(res.data.next_difficulty);
        }, 1000);
      } else {
        // Re-fetch the same difficulty level if incorrect after a short delay
        setTimeout(() => {
          fetchPuzzle(res.data.next_difficulty); // Use algorithm-decided difficulty
        }, 500);
      }
    }).catch(err => console.error("Validation error:", err));
  };

  // Calculate grid template based on difficulty
  const getGridTemplate = () => {
    switch(difficulty) {
      case 'medium':
        return 'repeat(4, 80px)';
      case 'hard':
        return 'repeat(5, 65px)';
      default: // easy
        return 'repeat(3, 100px)';
    }
  };

  // Calculate piece size based on difficulty
  const getPieceSize = () => {
    switch(difficulty) {
      case 'medium':
        return '80px';
      case 'hard':
        return '65px';
      default: // easy
        return '100px';
    }
  };

  if (loading) {
    return <div>Loading puzzle...</div>;
  }

  return (
    <div className="puzzle-container">
      <h2>Current Difficulty: {difficulty}</h2>
      
      {/* Q-Learning Status Panel */}
      <div className="q-learning-status" style={{
        backgroundColor: '#e9f7fe',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '15px',
        fontSize: '14px'
      }}>
        <strong>Q-Learning Status:</strong>
        <div>Current Level: {qLearningStatus.current}</div>
        <div>Next Level: {qLearningStatus.next}</div>
        <div>Attempts: {qLearningStatus.retries}</div>
        <div>Last Solve Time: {qLearningStatus.solveTime}s</div>
      </div>
      
      <div 
        className="puzzle-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: getGridTemplate(), 
          gap: '5px' 
        }}
      >
        {puzzleData.pieces.map((piece, index) => (
          index === puzzleData.missingIndex ? (
            <div
              key={index}
              className="empty-slot"
              style={{ 
                width: getPieceSize(), 
                height: getPieceSize(), 
                border: '2px dashed gray' 
              }}
              onDragOver={(e) => {
                e.preventDefault();
                dragOverItem.current = index;
              }}
              onDrop={() => handleDragEnd()}
            />
          ) : (
            <PuzzlePiece 
              key={index} 
              pieceId={piece?.id} 
              pieceSrc={piece?.src} 
              pieceSize={getPieceSize()}
            />
          )
        ))}
      </div>
      <PieceBank
        pieces={availablePieces}
        onDragStart={id => dragItem.current = id}
        pieceSize={getPieceSize()}
      />
    </div>
  );
}

export default PuzzleBoard;