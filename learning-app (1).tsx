import React, { useState, useEffect } from 'react';
import { BookOpen, Gamepad2, Calculator, Book, Globe, User } from 'lucide-react';

const LearningApp = () => {
  // Konfigurationsdaten (normalerweise aus config.json)
  const configData = {
    users: [
      { name: "Max", coins: 15 },
      { name: "Anna", coins: 23 },
      { name: "Leon", coins: 8 }
    ],
    questions: {
      mathe: [
        {
          question: "Was ist 7 + 5?",
          answers: ["11", "12", "13"],
          correct: 1
        },
        {
          question: "Was ist 9 × 3?",
          answers: ["24", "27", "30"],
          correct: 1
        },
        {
          question: "Was ist 20 - 8?",
          answers: ["11", "12", "13"],
          correct: 1
        },
        {
          question: "Was ist 15 ÷ 3?",
          answers: ["4", "5", "6"],
          correct: 1
        },
        {
          question: "Was ist 6 + 9?",
          answers: ["14", "15", "16"],
          correct: 1
        }
      ],
      deutsch: [
        {
          question: "Welches Wort ist richtig geschrieben?",
          answers: ["Fahrrad", "Farrad", "Farad"],
          correct: 0
        },
        {
          question: "Was ist das Gegenteil von 'groß'?",
          answers: ["klein", "dick", "schnell"],
          correct: 0
        },
        {
          question: "Wie viele Buchstaben hat das Alphabet?",
          answers: ["24", "26", "28"],
          correct: 1
        },
        {
          question: "Was ist ein Nomen?",
          answers: ["Ein Tuwort", "Ein Namenwort", "Ein Wiewort"],
          correct: 1
        },
        {
          question: "Welcher Artikel gehört zu 'Haus'?",
          answers: ["der", "die", "das"],
          correct: 2
        }
      ],
      englisch: [
        {
          question: "What is 'Hund' in English?",
          answers: ["cat", "dog", "bird"],
          correct: 1
        },
        {
          question: "What is 'rot' in English?",
          answers: ["red", "blue", "green"],
          correct: 0
        },
        {
          question: "How do you say 'Guten Morgen'?",
          answers: ["Good night", "Good morning", "Good day"],
          correct: 1
        },
        {
          question: "What is 'Apfel' in English?",
          answers: ["orange", "apple", "banana"],
          correct: 1
        },
        {
          question: "What does 'thank you' mean?",
          answers: ["Bitte", "Danke", "Hallo"],
          correct: 1
        }
      ]
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userCoins, setUserCoins] = useState(0);
  const [currentTab, setCurrentTab] = useState('mathe');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loginInput, setLoginInput] = useState('');
  const [gameActive, setGameActive] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [playerY, setPlayerY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  // Jump & Run Game Logic
  useEffect(() => {
    if (!gameActive) return;

    const gameInterval = setInterval(() => {
      setObstacles(prev => {
        const newObstacles = prev
          .map(obs => ({ ...obs, x: obs.x - 5 }))
          .filter(obs => obs.x > -50);

        if (Math.random() < 0.02) {
          newObstacles.push({ x: 400, y: 0 });
        }

        // Collision detection
        newObstacles.forEach(obs => {
          if (obs.x < 70 && obs.x > 20 && playerY < 40) {
            setGameOver(true);
            setGameActive(false);
          }
        });

        return newObstacles;
      });

      if (!gameOver) {
        setGameScore(prev => prev + 1);
      }
    }, 50);

    return () => clearInterval(gameInterval);
  }, [gameActive, playerY, gameOver]);

  // Jump physics
  useEffect(() => {
    if (!isJumping) return;

    let jumpHeight = 0;
    const jumpInterval = setInterval(() => {
      jumpHeight += 10;
      if (jumpHeight >= 100) {
        setIsJumping(false);
        setPlayerY(0);
      } else {
        setPlayerY(jumpHeight);
      }
    }, 30);

    return () => clearInterval(jumpInterval);
  }, [isJumping]);

  const startGame = () => {
    if (userCoins < 10) return;
    setUserCoins(prev => prev - 10);
    setGameActive(true);
    setGameOver(false);
    setGameScore(0);
    setPlayerY(0);
    setObstacles([]);
  };

  const handleJump = () => {
    if (!isJumping && playerY === 0) {
      setIsJumping(true);
    }
  };

  const endGame = () => {
    setGameActive(false);
    const coinsEarned = Math.floor(gameScore / 100);
    setUserCoins(prev => prev + coinsEarned);
  };

  // Zufällige Frage auswählen
  const getRandomQuestion = (subject) => {
    const questions = configData.questions[subject];
    return questions[Math.floor(Math.random() * questions.length)];
  };

  // Login-Funktion
  const handleLogin = () => {
    if (!loginInput.trim()) return;
    
    const existingUser = configData.users.find(
      u => u.name.toLowerCase() === loginInput.trim().toLowerCase()
    );

    if (existingUser) {
      setUserName(existingUser.name);
      setUserCoins(existingUser.coins);
    } else {
      setUserName(loginInput.trim());
      setUserCoins(0);
    }
    
    setIsLoggedIn(true);
    setCurrentQuestion(getRandomQuestion('mathe'));
  };

  // Antwort prüfen
  const handleAnswer = (index) => {
    if (!currentQuestion || feedback) return;

    const isCorrect = index === currentQuestion.correct;
    
    if (isCorrect) {
      setUserCoins(prev => prev + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentTab !== 'spiele' && currentTab !== 'profil') {
        setCurrentQuestion(getRandomQuestion(currentTab));
      }
    }, 1500);
  };

  // Tab wechseln
  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    setFeedback(null);
    
    if (tab === 'mathe' || tab === 'deutsch' || tab === 'englisch') {
      setCurrentQuestion(getRandomQuestion(tab));
    } else {
      setCurrentQuestion(null);
    }
  };

  // Login-Bildschirm
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-500 rounded-full mb-4">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Willkommen!</h1>
            <p className="text-gray-600">Gib deinen Namen ein, um zu starten</p>
          </div>
          
          <input
            type="text"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Dein Name"
            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl mb-4 focus:outline-none focus:border-blue-500 transition-colors"
          />
          
          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 text-white py-4 rounded-2xl text-lg font-semibold hover:bg-blue-600 transition-colors shadow-lg"
          >
            Los geht's!
          </button>
        </div>
      </div>
    );
  }

  // Hauptansicht
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 capitalize">
          {currentTab === 'spiele' ? 'Spiele' : 
           currentTab === 'profil' ? 'Profil' : 
           currentTab === 'mathe' ? 'Mathe' :
           currentTab === 'deutsch' ? 'Deutsch' : 'Englisch'}
        </h2>
        <div className="flex items-center bg-yellow-100 px-4 py-2 rounded-full">
          <span className="text-2xl mr-2">🪙</span>
          <span className="font-bold text-lg text-yellow-700">{userCoins}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {currentTab === 'profil' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">{userName}</h3>
              <div className="flex items-center justify-center gap-3 mt-6 bg-yellow-50 py-4 px-6 rounded-2xl">
                <span className="text-4xl">🪙</span>
                <span className="text-3xl font-bold text-yellow-700">{userCoins} Münzen</span>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'spiele' && (
          <div className="max-w-2xl mx-auto">
            {!gameActive && !gameOver && (
              <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
                <Gamepad2 className="w-20 h-20 mx-auto mb-4 text-purple-500" />
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Jump & Run</h3>
                <p className="text-gray-600 mb-6">Springe über Hindernisse und sammle Punkte!</p>
                <div className="bg-purple-50 rounded-2xl p-6 mb-6">
                  <p className="text-lg text-purple-700 font-semibold mb-2">Kosten: 10 Münzen</p>
                  <p className="text-sm text-purple-600">Du bekommst 1 Münze pro 100 Punkte zurück</p>
                </div>
                <button
                  onClick={startGame}
                  disabled={userCoins < 10}
                  className={`w-full py-4 rounded-2xl text-lg font-semibold transition-colors ${
                    userCoins >= 10
                      ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {userCoins >= 10 ? 'Spiel starten!' : 'Nicht genug Münzen'}
                </button>
              </div>
            )}

            {gameActive && (
              <div className="bg-white rounded-3xl shadow-lg p-8">
                <div className="mb-4 flex justify-between items-center">
                  <div className="text-2xl font-bold text-gray-800">
                    Score: {gameScore}
                  </div>
                  <button
                    onClick={endGame}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                  >
                    Beenden
                  </button>
                </div>
                
                <div 
                  onClick={handleJump}
                  className="relative bg-gradient-to-b from-blue-200 to-green-200 rounded-2xl overflow-hidden cursor-pointer"
                  style={{ height: '300px' }}
                >
                  {/* Player */}
                  <div
                    className="absolute bg-blue-600 rounded-lg transition-all"
                    style={{
                      width: '40px',
                      height: '40px',
                      left: '50px',
                      bottom: `${playerY + 20}px`
                    }}
                  >
                    <div className="text-2xl flex items-center justify-center h-full">
                      🏃
                    </div>
                  </div>

                  {/* Ground */}
                  <div className="absolute bottom-0 left-0 right-0 h-5 bg-green-600"></div>

                  {/* Obstacles */}
                  {obstacles.map((obs, i) => (
                    <div
                      key={i}
                      className="absolute bg-red-600 rounded"
                      style={{
                        width: '30px',
                        height: '40px',
                        left: `${obs.x}px`,
                        bottom: '20px'
                      }}
                    >
                      <div className="text-xl flex items-center justify-center h-full">
                        🌵
                      </div>
                    </div>
                  ))}

                  <div className="absolute top-4 left-4 bg-white bg-opacity-80 px-4 py-2 rounded-xl">
                    <p className="text-sm font-semibold text-gray-700">Tippe zum Springen!</p>
                  </div>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">💥</div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4">Game Over!</h3>
                <div className="bg-purple-50 rounded-2xl p-6 mb-6">
                  <p className="text-2xl font-bold text-purple-700 mb-2">{gameScore} Punkte</p>
                  <p className="text-lg text-purple-600">
                    +{Math.floor(gameScore / 100)} Münzen verdient! 🪙
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGameOver(false);
                    if (userCoins >= 10) {
                      startGame();
                    }
                  }}
                  disabled={userCoins < 10}
                  className={`w-full py-4 rounded-2xl text-lg font-semibold transition-colors ${
                    userCoins >= 10
                      ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {userCoins >= 10 ? 'Nochmal spielen!' : 'Nicht genug Münzen'}
                </button>
              </div>
            )}
          </div>
        )}

        {currentQuestion && (currentTab === 'mathe' || currentTab === 'deutsch' || currentTab === 'englisch') && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
              <p className="text-2xl font-semibold text-gray-800 text-center mb-8">
                {currentQuestion.question}
              </p>
              
              <div className="space-y-4">
                {currentQuestion.answers.map((answer, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={feedback !== null}
                    className={`w-full p-6 text-xl font-medium rounded-2xl transition-all transform active:scale-95 ${
                      feedback === 'correct' && index === currentQuestion.correct
                        ? 'bg-green-500 text-white shadow-lg'
                        : feedback === 'wrong' && index === currentQuestion.correct
                        ? 'bg-green-500 text-white shadow-lg'
                        : feedback === 'wrong'
                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                        : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border-2 border-blue-200'
                    }`}
                  >
                    {answer}
                  </button>
                ))}
              </div>

              {feedback === 'correct' && (
                <div className="mt-6 text-center">
                  <p className="text-2xl font-bold text-green-600">Richtig! 🎉</p>
                  <p className="text-lg text-green-600 mt-2">+1 Münze</p>
                </div>
              )}
              
              {feedback === 'wrong' && (
                <div className="mt-6 text-center">
                  <p className="text-2xl font-bold text-red-600">Leider falsch 😔</p>
                  <p className="text-lg text-gray-600 mt-2">Versuch's nochmal!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center py-2 max-w-2xl mx-auto">
          <button
            onClick={() => handleTabChange('spiele')}
            className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
              currentTab === 'spiele' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            <Gamepad2 className="w-7 h-7 mb-1" />
            <span className="text-xs font-medium">Spiele</span>
          </button>
          
          <button
            onClick={() => handleTabChange('mathe')}
            className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
              currentTab === 'mathe' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <Calculator className="w-7 h-7 mb-1" />
            <span className="text-xs font-medium">Mathe</span>
          </button>
          
          <button
            onClick={() => handleTabChange('deutsch')}
            className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
              currentTab === 'deutsch' ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            <Book className="w-7 h-7 mb-1" />
            <span className="text-xs font-medium">Deutsch</span>
          </button>
          
          <button
            onClick={() => handleTabChange('englisch')}
            className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
              currentTab === 'englisch' ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            <Globe className="w-7 h-7 mb-1" />
            <span className="text-xs font-medium">Englisch</span>
          </button>
          
          <button
            onClick={() => handleTabChange('profil')}
            className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
              currentTab === 'profil' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <User className="w-7 h-7 mb-1" />
            <span className="text-xs font-medium">Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningApp;