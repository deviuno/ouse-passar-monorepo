
import React, { useState, useEffect } from 'react';
import { ParsedQuestion, UserStats, LeagueUser, Friend } from '../types';
import { MOCK_LEAGUE, USER_AVATAR_URL, MOCK_FRIENDS } from '../constants';
import { Swords, Clock, CheckCircle, XCircle, Trophy, User, ArrowLeft, Users, Shuffle, ChevronRight, RotateCcw, X, ListOrdered } from 'lucide-react';

interface PvPGameViewProps {
  questions: ParsedQuestion[];
  userStats: UserStats;
  onFinish: (winner: boolean) => void;
  onExit: () => void;
}

type GamePhase = 'lobby' | 'matchmaking' | 'friend-select' | 'waiting-invite' | 'game' | 'result';

// Utility to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const PvPGameView: React.FC<PvPGameViewProps> = ({ questions, userStats, onFinish, onExit }) => {
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [opponent, setOpponent] = useState<LeagueUser | Friend | null>(null);
  
  // Game Configuration State
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [questionsCount, setQuestionsCount] = useState(5);

  // Game State
  const [gameQuestions, setGameQuestions] = useState<ParsedQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timer, setTimer] = useState(15);
  
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [opponentAnswer, setOpponentAnswer] = useState<string | null>(null);
  
  const [roundFinished, setRoundFinished] = useState(false);

  // Rematch Modal State
  const [showRematchModal, setShowRematchModal] = useState(false);

  // Helper to prepare questions (ensuring we have enough by duplicating if needed)
  const prepareQuestions = (source: ParsedQuestion[], count: number) => {
      let pool = [...source];
      // If we requested more questions than available in mock, duplicate them
      while (pool.length < count && pool.length > 0) {
          pool = [...pool, ...source];
      }
      return shuffleArray(pool).slice(0, count);
  };

  // Initialize Game Questions on Mount
  useEffect(() => {
     setGameQuestions(prepareQuestions(questions, questionsCount));
  }, [questions]);

  // Re-prepare questions if count changes while in lobby
  useEffect(() => {
      if (phase === 'lobby') {
          setGameQuestions(prepareQuestions(questions, questionsCount));
      }
  }, [questionsCount, questions, phase]);

  // Matchmaking Effect (Random)
  useEffect(() => {
    if (phase === 'matchmaking') {
      const randomOpponent = MOCK_LEAGUE.filter(u => !u.isCurrentUser)[Math.floor(Math.random() * 3)];
      
      setTimeout(() => {
        setOpponent(randomOpponent);
        setTimeout(() => {
          setPhase('game');
          setTimer(timePerQuestion); // Use configured time
        }, 2000);
      }, 2500);
    }
  }, [phase, timePerQuestion]);

  // Friend Invite Effect
  useEffect(() => {
      if (phase === 'waiting-invite') {
          // Simulate friend accepting invite
          setTimeout(() => {
              setPhase('game');
              setTimer(timePerQuestion); // Use configured time
          }, 3000);
      }
  }, [phase, timePerQuestion]);

  // Game Timer & Opponent Logic
  useEffect(() => {
    if (phase === 'game' && !roundFinished && gameQuestions.length > 0) {
      // Main Timer
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
             handleRoundEnd();
             return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Opponent AI Logic (Random answer time based on question duration)
      // They answer between 20% and 80% of the total time
      const minTime = timePerQuestion * 0.2 * 1000;
      const maxTime = timePerQuestion * 0.8 * 1000;
      const opponentTime = Math.random() * (maxTime - minTime) + minTime;

      const opponentTimeout = setTimeout(() => {
        if (!opponentAnswer) {
          // 70% chance of being correct
          const isCorrect = Math.random() > 0.3;
          const currentQ = gameQuestions[currentQIndex];
          const answer = isCorrect 
            ? currentQ.gabarito 
            : currentQ.parsedAlternativas.find(a => a.letter !== currentQ.gabarito)?.letter || 'A';
          
          setOpponentAnswer(answer);
        }
      }, opponentTime);

      return () => {
        clearInterval(interval);
        clearTimeout(opponentTimeout);
      };
    }
  }, [phase, roundFinished, currentQIndex, gameQuestions, timePerQuestion]);

  const handleAnswer = (letter: string) => {
    if (myAnswer || roundFinished) return;
    setMyAnswer(letter);
  };

  const handleRoundEnd = () => {
    setRoundFinished(true);
    
    // Calculate Scores
    const q = gameQuestions[currentQIndex];
    let myPoints = 0;
    let opPoints = 0;

    if (myAnswer === q.gabarito) myPoints = 1;
    if (opponentAnswer === q.gabarito) opPoints = 1;

    setMyScore(prev => prev + myPoints);
    setOpponentScore(prev => prev + opPoints);

    // Wait and go next
    setTimeout(() => {
       if (currentQIndex < questionsCount - 1) { // Check against configured count
           setCurrentQIndex(prev => prev + 1);
           setTimer(timePerQuestion); // Reset to configured time
           setMyAnswer(null);
           setOpponentAnswer(null);
           setRoundFinished(false);
       } else {
           setPhase('result');
           // Trigger finish callback immediately to award points, but stay on screen
           const isWinner = myScore + (myPoints) > opponentScore + (opPoints); // Calc final score logic
           onFinish(isWinner); 
       }
    }, 3000);
  };

  // Check if both answered to end round early
  useEffect(() => {
      if (myAnswer && opponentAnswer && !roundFinished) {
          handleRoundEnd();
      }
  }, [myAnswer, opponentAnswer]);

  const resetGame = () => {
      setMyScore(0);
      setOpponentScore(0);
      setCurrentQIndex(0);
      setMyAnswer(null);
      setOpponentAnswer(null);
      setRoundFinished(false);
      // Shuffle new questions for the rematch
      setGameQuestions(prepareQuestions(questions, questionsCount));
  };

  const handleRematch = (type: 'same' | 'friend' | 'random') => {
      setShowRematchModal(false);
      resetGame();

      if (type === 'same') {
          // Immediately restart game with same opponent
          setPhase('game');
          setTimer(timePerQuestion);
      } else if (type === 'friend') {
          setPhase('friend-select');
          setOpponent(null);
      } else {
          setPhase('matchmaking');
          setOpponent(null);
      }
  };


  const currentQ = gameQuestions[currentQIndex];

  // --- RENDERERS ---

  if (phase === 'lobby') {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-[#1A1A1A]">
              <div className="bg-[#252525] p-6 rounded-3xl border border-purple-500/30 text-center shadow-2xl max-w-sm w-full overflow-y-auto max-h-full no-scrollbar">
                  <Swords size={48} className="mx-auto text-purple-500 mb-4" />
                  <h1 className="text-xl font-bold text-white mb-2">Modo Batalha</h1>
                  <p className="text-gray-400 mb-6 text-xs leading-relaxed">
                      Desafie outros estudantes em tempo real. Quem acertar mais vence!
                  </p>

                  {/* Time Slider */}
                  <div className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 mb-3">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-gray-300 flex items-center">
                                <Clock size={16} className="mr-2 text-purple-500" />
                                Tempo / Questão
                            </span>
                            <span className="text-lg font-bold text-purple-500 font-mono">{timePerQuestion}s</span>
                        </div>
                        
                        <input 
                            type="range" 
                            min="15" 
                            max="60" 
                            step="5" 
                            value={timePerQuestion} 
                            onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-mono">
                            <span>15s</span>
                            <span>60s</span>
                        </div>
                  </div>

                  {/* Questions Count Slider */}
                  <div className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-gray-300 flex items-center">
                                <ListOrdered size={16} className="mr-2 text-purple-500" />
                                Qtd. Questões
                            </span>
                            <span className="text-lg font-bold text-purple-500 font-mono">{questionsCount}</span>
                        </div>
                        
                        <input 
                            type="range" 
                            min="5" 
                            max="20" 
                            step="1" 
                            value={questionsCount} 
                            onChange={(e) => setQuestionsCount(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-mono">
                            <span>5</span>
                            <span>20</span>
                        </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                        onClick={() => setPhase('matchmaking')}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-900/50 transition-all flex items-center justify-center text-sm"
                    >
                        <Shuffle size={18} className="mr-2" />
                        Oponente Aleatório
                    </button>
                    <button 
                        onClick={() => setPhase('friend-select')}
                        className="w-full bg-[#1A1A1A] border border-purple-600 text-purple-400 hover:bg-purple-900/20 font-bold py-3 rounded-xl transition-all flex items-center justify-center text-sm"
                    >
                        <Users size={18} className="mr-2" />
                        Convidar Amigo
                    </button>
                  </div>

                  <button onClick={onExit} className="mt-4 text-gray-500 text-xs font-bold hover:text-white">
                      Voltar
                  </button>
              </div>
          </div>
      );
  }

  if (phase === 'friend-select') {
      return (
          <div className="h-full flex flex-col bg-[#1A1A1A]">
             <div className="p-4 border-b border-gray-800 flex items-center bg-[#252525]">
                <button onClick={() => setPhase('lobby')} className="mr-3 text-gray-400 hover:text-white">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-white">Convidar Amigo</h1>
             </div>
             
             <div className="p-4 overflow-y-auto no-scrollbar">
                 <h2 className="text-sm font-bold text-gray-400 uppercase mb-4">Seus Amigos</h2>
                 <div className="space-y-3">
                     {MOCK_FRIENDS.map(friend => (
                         <button 
                            key={friend.id}
                            onClick={() => {
                                setOpponent(friend);
                                setPhase('waiting-invite');
                            }}
                            className="w-full bg-[#252525] p-4 rounded-xl flex items-center justify-between border border-gray-800 hover:border-purple-500 transition-all"
                         >
                             <div className="flex items-center">
                                 <div className="relative">
                                     <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full bg-gray-700" />
                                     {friend.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#252525]"></div>}
                                 </div>
                                 <div className="ml-4 text-left">
                                     <h3 className="font-bold text-white">{friend.name}</h3>
                                     <p className="text-xs text-purple-400 flex items-center">
                                         {friend.courses.join(', ')}
                                     </p>
                                 </div>
                             </div>
                             <div className="bg-purple-600/20 p-2 rounded-full">
                                 <Swords size={16} className="text-purple-500" />
                             </div>
                         </button>
                     ))}
                 </div>
             </div>
          </div>
      )
  }

  if (phase === 'matchmaking' || phase === 'waiting-invite') {
      const isInvite = phase === 'waiting-invite';

      return (
          <div className="h-full flex flex-col items-center justify-center bg-[#1A1A1A] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-[#1A1A1A] to-[#1A1A1A]"></div>
              
              <div className="flex items-center justify-center space-x-8 z-10 mb-12">
                   {/* User */}
                   <div className="flex flex-col items-center animate-pulse">
                       <img src={USER_AVATAR_URL} className="w-20 h-20 rounded-full border-4 border-[#FFB800] shadow-[0_0_20px_#FFB800]" />
                       <span className="mt-4 font-bold text-white">Você</span>
                   </div>

                   <div className="text-2xl font-bold text-gray-600">VS</div>

                   {/* Opponent */}
                   <div className="flex flex-col items-center">
                       {opponent ? (
                           <div className="flex flex-col items-center animate-fade-in-up">
                               <img src={opponent.avatar} className="w-20 h-20 rounded-full border-4 border-red-500 shadow-[0_0_20px_red]" />
                               <span className="mt-4 font-bold text-white">{opponent.name}</span>
                           </div>
                       ) : (
                           <div className="w-20 h-20 rounded-full border-4 border-gray-700 border-dashed flex items-center justify-center animate-spin-slow">
                               <span className="text-2xl text-gray-500">?</span>
                           </div>
                       )}
                   </div>
              </div>

              <h2 className="text-xl font-bold text-purple-400 animate-pulse z-10 text-center px-6">
                  {isInvite 
                    ? `AGUARDANDO ${opponent?.name?.toUpperCase()} ACEITAR...` 
                    : (opponent ? 'OPONENTE ENCONTRADO!' : 'PROCURANDO ADVERSÁRIO...')}
              </h2>
              {isInvite && (
                  <button onClick={() => setPhase('friend-select')} className="mt-8 text-gray-500 hover:text-white text-sm z-10">
                      Cancelar Convite
                  </button>
              )}
          </div>
      );
  }

  if (phase === 'game' && currentQ) {
      return (
          <div className="h-full flex flex-col bg-[#1A1A1A]">
              {/* Top Bar - Avatars & Scores */}
              <div className="bg-[#252525] p-4 flex justify-between items-center border-b border-gray-800">
                  <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img src={USER_AVATAR_URL} className="w-10 h-10 rounded-full border-2 border-[#FFB800]" />
                        <span className="absolute -bottom-1 -right-1 bg-[#FFB800] text-black text-[10px] font-bold px-1 rounded">
                            {myScore}
                        </span>
                      </div>
                      <div className="h-2 w-24 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#FFB800]" style={{ width: `${(myScore / questionsCount) * 100}%` }}></div>
                      </div>
                  </div>

                  <div className={`text-xl font-bold font-mono ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                      {timer}s
                  </div>

                  <div className="flex items-center space-x-3">
                      <div className="h-2 w-24 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${(opponentScore / questionsCount) * 100}%` }}></div>
                      </div>
                      <div className="relative">
                        <img src={opponent!.avatar} className="w-10 h-10 rounded-full border-2 border-red-500" />
                        <span className="absolute -bottom-1 -left-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded">
                            {opponentScore}
                        </span>
                      </div>
                  </div>
              </div>

              {/* Question Area */}
              <div className="flex-1 p-6 flex flex-col overflow-y-auto no-scrollbar">
                  <div className="mb-4">
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-900/20 px-2 py-1 rounded">
                          QUESTÃO {currentQIndex + 1} / {questionsCount}
                      </span>
                  </div>
                  <h2 className="text-lg font-medium text-white leading-relaxed mb-6">
                      {currentQ.enunciado}
                  </h2>

                  <div className="space-y-3 mt-auto">
                      {currentQ.parsedAlternativas.map(alt => {
                          let style = "bg-[#252525] border-gray-700 hover:bg-[#2A2A2A]";
                          
                          // Reveal phase
                          if (roundFinished) {
                              if (alt.letter === currentQ.gabarito) style = "bg-green-500/20 border-green-500 text-green-500";
                              else if (alt.letter === myAnswer) style = "bg-red-500/20 border-red-500 text-red-500";
                              else style = "opacity-50 border-gray-800";
                          } else {
                              // Selection phase
                              if (alt.letter === myAnswer) style = "bg-[#FFB800] border-[#FFB800] text-black font-bold";
                          }

                          return (
                              <button
                                key={alt.letter}
                                onClick={() => handleAnswer(alt.letter)}
                                disabled={!!myAnswer || roundFinished}
                                className={`w-full p-4 rounded-xl border text-left transition-all ${style}`}
                              >
                                  <div className="flex justify-between items-center">
                                      <span><span className="font-bold mr-2">{alt.letter})</span> {alt.text}</span>
                                      
                                      {/* Opponent Selection Indicator */}
                                      {roundFinished && alt.letter === opponentAnswer && (
                                          <div className="flex items-center text-xs text-red-400 bg-red-900/50 px-2 py-1 rounded">
                                              <User size={12} className="mr-1" /> Rival
                                          </div>
                                      )}
                                  </div>
                              </button>
                          )
                      })}
                  </div>
              </div>
          </div>
      );
  }

  if (phase === 'result') {
      const isWinner = myScore > opponentScore;
      const isDraw = myScore === opponentScore;

      return (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-[#1A1A1A] relative overflow-hidden">
               {isWinner && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    </div>
               )}

               <div className="z-10 text-center">
                   {isWinner ? (
                       <Trophy size={80} className="text-[#FFB800] mx-auto mb-6 animate-bounce" />
                   ) : (
                       <div className="text-6xl mb-6">🏁</div>
                   )}
                   
                   <h1 className="text-4xl font-bold text-white mb-2">
                       {isWinner ? 'VITÓRIA!' : isDraw ? 'EMPATE!' : 'DERROTA'}
                   </h1>
                   <p className="text-gray-400 mb-8">
                       Você {myScore} x {opponentScore} {opponent!.name}
                   </p>

                   <div className="bg-[#252525] p-6 rounded-2xl border border-gray-800 w-full max-w-xs mx-auto mb-8">
                       <div className="flex justify-between mb-2">
                           <span className="text-gray-400">XP Ganho</span>
                           <span className="font-bold text-[#FFB800]">+{isWinner ? 200 : isDraw ? 50 : 20} XP</span>
                       </div>
                       <div className="flex justify-between">
                           <span className="text-gray-400">Moedas</span>
                           <span className="font-bold text-[#FFB800]">+{isWinner ? 50 : isDraw ? 10 : 5}</span>
                       </div>
                   </div>

                   <div className="flex flex-col space-y-3 w-full max-w-xs">
                       <button 
                         onClick={() => setShowRematchModal(true)}
                         className="w-full bg-[#FFB800] text-black font-bold py-4 rounded-xl shadow-lg hover:bg-[#FFC933] transition-colors flex items-center justify-center"
                       >
                           <RotateCcw size={20} className="mr-2" />
                           Lutar de Novo
                       </button>
                       <button 
                         onClick={onExit}
                         className="w-full bg-[#252525] border border-gray-700 text-gray-300 font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors"
                       >
                           Voltar
                       </button>
                   </div>
               </div>

               {/* Rematch Modal */}
               {showRematchModal && (
                   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                       <div className="bg-[#1A1A1A] w-full max-w-sm rounded-2xl border border-purple-500 p-0 shadow-2xl overflow-hidden animate-fade-in-up">
                           <div className="bg-purple-900/20 p-4 border-b border-purple-500/30 flex justify-between items-center">
                               <h3 className="font-bold text-white flex items-center">
                                   <Swords size={20} className="mr-2 text-purple-500" />
                                   Nova Batalha
                               </h3>
                               <button onClick={() => setShowRematchModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                           </div>
                           
                           <div className="p-4 space-y-3">
                               <button 
                                   onClick={() => handleRematch('same')}
                                   className="w-full bg-[#252525] hover:bg-[#2A2A2A] border border-gray-800 p-4 rounded-xl flex items-center transition-all"
                               >
                                   <div className="bg-purple-500/10 p-2 rounded-full mr-3">
                                       <RotateCcw size={20} className="text-purple-500" />
                                   </div>
                                   <div className="text-left">
                                       <span className="block font-bold text-white">Mesmo Oponente</span>
                                       <span className="text-xs text-gray-500">Revanche imediata</span>
                                   </div>
                               </button>

                               <button 
                                   onClick={() => handleRematch('friend')}
                                   className="w-full bg-[#252525] hover:bg-[#2A2A2A] border border-gray-800 p-4 rounded-xl flex items-center transition-all"
                               >
                                   <div className="bg-blue-500/10 p-2 rounded-full mr-3">
                                       <Users size={20} className="text-blue-500" />
                                   </div>
                                   <div className="text-left">
                                       <span className="block font-bold text-white">Selecionar Amigo</span>
                                       <span className="text-xs text-gray-500">Convidar da lista</span>
                                   </div>
                               </button>

                               <button 
                                   onClick={() => handleRematch('random')}
                                   className="w-full bg-[#252525] hover:bg-[#2A2A2A] border border-gray-800 p-4 rounded-xl flex items-center transition-all"
                               >
                                   <div className="bg-green-500/10 p-2 rounded-full mr-3">
                                       <Shuffle size={20} className="text-green-500" />
                                   </div>
                                   <div className="text-left">
                                       <span className="block font-bold text-white">Oponente Aleatório</span>
                                       <span className="text-xs text-gray-500">Buscar novo desafio</span>
                                   </div>
                               </button>
                           </div>
                       </div>
                   </div>
               )}
          </div>
      )
  }

  return null;
};

export default PvPGameView;
