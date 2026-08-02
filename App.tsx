import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Tetromino shapes (each is an array of [x,y] coordinates relative to pivot)
const shapes = {
  I: [[0,1], [1,1], [2,1], [3,1]],
  O: [[0,0], [1,0], [0,1], [1,1]],
  T: [[0,1], [1,1], [2,1], [1,0]],
  L: [[0,0], [1,0], [2,0], [2,1]],
  J: [[2,0], [1,0], [0,0], [0,1]],
  S: [[1,0], [0,1], [1,1], [2,1]],
  Z: [[0,0], [1,0], [1,1], [2,1]]
};

export default function App() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [board, setBoard] = useState(Array(20).fill(Array(10).fill(0)));
  const [currentPiece, setCurrentPiece] = useState(null);
  const [dropTimeout, setDropTimeout] = useState(1000); // Initial drop speed (ms)

  // Generate new piece
  const newPiece = () => {
    const shape = Object.keys(shapes)[Math.floor(Math.random() * Object.keys(shapes).length)];
    setCurrentPiece({
      x: 3, y: 0,
      shape,
      rotation: 0
    });
  };

  // Rotate piece
  const rotate = () => {
    if (!currentPiece) return;
    const newRotation = (currentPiece.rotation + 1) % 4;
    const shape = shapes[currentPiece.shape];
    const newShape = shape.map(([x,y]) => 
      [y, 3 - x] // Simple 90° rotation (adjust based on pivot)
    );
    setCurrentPiece({ ...currentPiece, rotation: newRotation, shape: newShape });
  };

  // Move piece
  const move = (dx, dy) => {
    if (!currentPiece) return;
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;
    const shape = currentPiece.shape;
    
    // Check collision
    let valid = true;
    shape.forEach(([x,y]) => {
      const colX = newX + x;
      const colY = newY + y;
      if (colX < 0 || colX >= 10 || colY >= 20 || (colY >= 0 && board[colY][colX] !== 0)) {
        valid = false;
      }
    });
    
    if (valid) {
      setCurrentPiece({ ...currentPiece, x: newX, y: newY });
    }
  };

  // Drop piece
  const drop = () => {
    if (!currentPiece) return;
    move(0, 1);
    setDropTimeout(Math.max(dropTimeout - 50, 50)); // Increase speed per drop
  };

  // Lock piece
  const lockPiece = () => {
    if (!currentPiece) return;
    const shape = currentPiece.shape;
    shape.forEach(([x,y]) => {
      const colY = currentPiece.y + y;
      if (colY >= 0) {
        setBoard(prev => {
          const newBoard = prev.map((row, i) => 
            i === currentPiece.y ? 
              row.map((cell, j) => 
                j === currentPiece.x + x ? currentPiece.shape.indexOf([x,y]) + 1 : cell
              ) : row
          );
          return newBoard;
        });
      }
    });
    setCurrentPiece(null);
    checkLines();
    newPiece();
  };

  // Check for completed lines
  const checkLines = () => {
    let lines = 0;
    for (let y = 19; y >= 0; y--) {
      const row = board[y];
      if (row.every(cell => cell !== 0)) {
        lines++;
        setBoard(prev => [
          ...prev.slice(0, y),
          [...prev[y-1]], // Remove line
          ...prev.slice(y+1)
        ]);
        y++; // Check same y after removal
      }
    }
    setScore(prev => prev + (lines * 100));
    if (lines > 0) {
      setLevel(prev => Math.min(prev + lines, 12)); // Max 12 levels
    }
  };

  // Game loop
  useEffect(() => {
    if (gameOver || !currentPiece) return;
    
    const dropInterval = Math.max(dropTimeout, 100); // Minimum drop speed
    const interval = setInterval(() => {
      move(0, 1);
      if (currentPiece.y >= 19) { // Game over
        setGameOver(true);
        clearInterval(interval);
      }
    }, dropInterval);
    
    return () => clearInterval(interval);
  }, [dropTimeout, currentPiece]);

  // Handle game over
  useEffect(() => {
    if (gameOver) {
      setTimeout(() => {
        setLevel(1);
        setScore(0);
        setBoard(Array(20).fill(Array(10).fill(0)));
        setGameOver(false);
        newPiece();
      }, 2000);
    }
  }, [gameOver]);

  if (gameOver) {
    return (
      <View style={styles.gameOver}>
        <Text style={styles.title}>¡JUEGO TERMINADO!</Text>
        <Text style={styles.count}>{`Puntaje: ${score}`}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => setGameOver(false)}>
          <Text style={styles.btnText}>Reiniciar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.board} />
      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={() => move(-1, 0)}>
          <Text style={styles.btnText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={rotate}>
          <Text style={styles.btnText}>↻</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => move(1, 0)}>
          <Text style={styles.btnText}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={drop}>
          <Text style={styles.btnText}>↓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center' },
  board: { width: 300, height: 500, margin: 20, backgroundColor: '#1a1a2e' },
  controls: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  btn: { backgroundColor: '#00ff88', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#0a0a2e', fontSize: 24, fontWeight: 'bold' },
  gameOver: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: '#00ff88', fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  count: { color: '#fff', fontSize: 24 }
});