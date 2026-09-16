import { useState } from 'react';
import { Character, generateCharacter, bunkerConditions } from './data/gameData';

interface Player {
  id: number;
  name: string;
  character: Character;
  isAlive: boolean;
  revealedTraits: string[];
  votesReceived: number;
}

type GamePhase = 'setup' | 'character-reveal' | 'discussion' | 'voting' | 'results' | 'game-over';

function App() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const [numPlayers, setNumPlayers] = useState(4);
  const [currentCondition, setCurrentCondition] = useState(bunkerConditions[0]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);
  const [maxRounds] = useState(3);
  const [bunkerCapacity, setBunkerCapacity] = useState(3);

  const startGame = () => {
    const condition = bunkerConditions[Math.floor(Math.random() * bunkerConditions.length)];
    setCurrentCondition(condition);
    
    // Use numPlayers directly to ensure correct array length
    const names = Array.from({ length: numPlayers }, (_, i) => playerNames[i] || `Игрок ${i + 1}`);
    
    const newPlayers: Player[] = names.map((name, idx) => ({
      id: idx,
      name: name,
      character: generateCharacter(),
      isAlive: true,
      revealedTraits: [],
      votesReceived: 0,
    }));
    
    setPlayers(newPlayers);
    setBunkerCapacity(Math.max(2, Math.floor(newPlayers.length / 2)));
    setPhase('character-reveal');
    setCurrentPlayerIndex(0);
    setCurrentRound(1);
  };

  const revealCharacter = () => {
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    } else {
      setPhase('discussion');
    }
  };

  const revealTrait = (playerId: number, trait: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId 
        ? { ...p, revealedTraits: [...p.revealedTraits, trait] }
        : p
    ));
  };

  const startVoting = () => {
    setPhase('voting');
    setVotes({});
  };

  const castVote = (voterId: number, targetId: number) => {
    setVotes(prev => ({ ...prev, [voterId]: targetId }));
  };

  const finishVoting = () => {
    const voteCounts: Record<number, number> = {};
    players.filter(p => p.isAlive).forEach(p => { voteCounts[p.id] = 0; });
    
    Object.values(votes).forEach(targetId => {
      if (voteCounts[targetId] !== undefined) {
        voteCounts[targetId]++;
      }
    });

    let maxVotes = 0;
    let eliminated: Player | null = null;
    
    players.filter(p => p.isAlive).forEach(p => {
      if ((voteCounts[p.id] || 0) > maxVotes) {
        maxVotes = voteCounts[p.id] || 0;
        eliminated = p;
      }
    });

    if (eliminated) {
      setEliminatedPlayer(eliminated);
      setPlayers(prev => prev.map(p => 
        p.id === eliminated!.id ? { ...p, isAlive: false } : p
      ));
      setPhase('results');
    } else {
      // No one to eliminate (e.g., only 1 player left who can't vote)
      const alivePlayersAfter = players.filter(p => p.isAlive);
      if (alivePlayersAfter.length <= bunkerCapacity || currentRound >= maxRounds) {
        setPhase('game-over');
      } else {
        setCurrentRound(prev => prev + 1);
        setPhase('discussion');
      }
    }
  };

  const nextRound = () => {
    const alivePlayers = players.filter(p => p.isAlive);
    if (alivePlayers.length <= bunkerCapacity || currentRound >= maxRounds) {
      setPhase('game-over');
    } else {
      setCurrentRound(prev => prev + 1);
      setPhase('discussion');
      setCurrentPlayerIndex(0);
      setEliminatedPlayer(null);
    }
  };

  const resetGame = () => {
    setPhase('setup');
    setPlayers([]);
    setPlayerNames([]);
    setVotes({});
    setEliminatedPlayer(null);
    setCurrentRound(1);
    setCurrentPlayerIndex(0);
  };

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">☢️</div>
            <h1 className="text-5xl font-bold text-green-400 mb-2 tracking-wider">БИЗНЕС БУНКЕР</h1>
            <p className="text-green-300/70 text-lg">Корпоративный тренинг • Локальный мультиплеер</p>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-8 border border-green-500/30 shadow-2xl shadow-green-900/50">
            <h2 className="text-2xl font-bold text-green-300 mb-6 text-center">🎮 Настройка игры</h2>
            
            <div className="mb-6">
              <label className="block text-green-200 mb-2 font-medium">Количество игроков (2-10):</label>
              <input
                type="range"
                min="2"
                max="10"
                value={numPlayers}
                onChange={(e) => {
                  setNumPlayers(parseInt(e.target.value));
                  setPlayerNames(prev => {
                    const arr = [...prev];
                    arr.length = parseInt(e.target.value);
                    return arr.map((n, i) => n || '');
                  });
                }}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <div className="text-center text-green-400 text-2xl font-bold mt-2">{numPlayers}</div>
            </div>

            <div className="space-y-3 mb-6">
              {Array.from({ length: numPlayers }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-green-400 font-bold w-8">#{i + 1}</span>
                  <input
                    type="text"
                    placeholder={`Имя игрока ${i + 1}`}
                    value={playerNames[i] || ''}
                    onChange={(e) => {
                      const newNames = [...playerNames];
                      newNames[i] = e.target.value;
                      setPlayerNames(newNames);
                    }}
                    className="flex-1 bg-gray-700/50 border border-green-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all transform hover:scale-105 shadow-lg shadow-green-600/30"
            >
              🚀 НАЧАТЬ ИГРУ
            </button>
          </div>

          <div className="mt-6 bg-gray-800/50 rounded-xl p-4 border border-green-500/20">
            <h3 className="text-green-300 font-bold mb-2">📋 Правила:</h3>
            <ul className="text-green-200/70 text-sm space-y-1">
              <li>• Каждый игрок получает секретную карточку персонажа</li>
              <li>• В раундах обсуждения игроки раскрывают черты своего персонажа</li>
              <li>• После обсуждения — голосование за изгнание из бункера</li>
              <li>• Цель: убедить остальных, что вы полезны для выживания!</li>
              <li>• Побеждают те, кто остался в бункере</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // CHARACTER REVEAL PHASE
  if (phase === 'character-reveal') {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) {
      setPhase('discussion');
      return null;
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-green-400">🎭 Получение роли</h2>
            <p className="text-green-300/70 mt-1">Игрок: <span className="text-green-200 font-bold">{currentPlayer.name}</span></p>
            <p className="text-yellow-400/70 text-sm mt-1">Передайте устройство этому игроку и нажмите "Показать"</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-6 border border-green-500/30 shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">👤</div>
              <h3 className="text-xl font-bold text-green-300">{currentPlayer.name}</h3>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <span className="text-green-400 text-xs font-bold uppercase">Профессия</span>
                <p className="text-white font-medium">{currentPlayer.character.profession}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <span className="text-green-400 text-xs font-bold uppercase">Биология</span>
                <p className="text-white font-medium">{currentPlayer.character.biology}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <span className="text-green-400 text-xs font-bold uppercase">Здоровье</span>
                <p className="text-white font-medium">{currentPlayer.character.health}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <span className="text-green-400 text-xs font-bold uppercase">Хобби</span>
                <p className="text-white font-medium">{currentPlayer.character.hobby}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <span className="text-green-400 text-xs font-bold uppercase">Фобия</span>
                <p className="text-white font-medium">{currentPlayer.character.phobia}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <span className="text-green-400 text-xs font-bold uppercase">Багаж</span>
                <p className="text-white font-medium">{currentPlayer.character.baggage}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <span className="text-green-400 text-xs font-bold uppercase">Секретная информация</span>
                <p className="text-white font-medium">{currentPlayer.character.specialInfo}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <span className="text-green-400 text-xs font-bold uppercase">Специальное действие</span>
                <p className="text-white font-medium">{currentPlayer.character.action}</p>
              </div>
            </div>

            <button
              onClick={revealCharacter}
              className="w-full mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              {currentPlayerIndex < players.length - 1 ? '✅ Запомнил. Следующий игрок' : '🎮 Все готовы. Начать обсуждение!'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DISCUSSION PHASE
  if (phase === 'discussion') {
    const alivePlayers = players.filter(p => p.isAlive);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Scenario */}
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-red-300 font-bold text-lg">{currentCondition.name}</h3>
              <span className="ml-auto bg-red-800/50 px-3 py-1 rounded-full text-red-200 text-sm">
                Раунд {currentRound}/{maxRounds}
              </span>
            </div>
            <p className="text-red-200/80 text-sm">{currentCondition.description}</p>
            <p className="text-yellow-300/80 text-sm mt-1">⚡ Угроза: {currentCondition.threat}</p>
            <p className="text-green-300/80 text-sm mt-1">🏠 Мест в бункере: {bunkerCapacity} из {alivePlayers.length} игроков</p>
          </div>

          {/* Players */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {alivePlayers.map(player => (
              <div key={player.id} className="bg-gray-800/80 backdrop-blur rounded-xl p-4 border border-green-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-green-300 font-bold text-lg">👤 {player.name}</h4>
                  <span className="text-xs text-green-400/60">
                    {player.revealedTraits.length}/8 раскрыто
                  </span>
                </div>
                
                <div className="space-y-2">
                  {(['profession', 'biology', 'health', 'hobby', 'phobia', 'baggage', 'specialInfo', 'action'] as const).map(trait => {
                    const isRevealed = player.revealedTraits.includes(trait);
                    const traitLabels: Record<string, string> = {
                      profession: '💼 Профессия',
                      biology: '🧬 Биология',
                      health: '❤️ Здоровье',
                      hobby: '🎯 Хобби',
                      phobia: '😱 Фобия',
                      baggage: '🎒 Багаж',
                      specialInfo: '🔐 Секрет',
                      action: '⚡ Действие',
                    };
                    
                    return (
                      <div key={trait} className="flex items-center gap-2">
                        {isRevealed ? (
                          <div className="flex-1 bg-green-900/30 rounded-lg p-2 border border-green-500/20">
                            <span className="text-green-400 text-xs">{traitLabels[trait]}:</span>
                            <p className="text-white text-sm">{player.character[trait]}</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => revealTrait(player.id, trait)}
                            className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg p-2 border border-gray-600/30 text-left transition-colors"
                          >
                            <span className="text-gray-400 text-xs">{traitLabels[trait]}:</span>
                            <p className="text-gray-500 text-sm italic">🔒 Скрыто — нажмите чтобы раскрыть</p>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Discussion tips */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-green-500/20 mb-4">
            <h4 className="text-green-300 font-bold mb-2">💡 Подсказки для обсуждения:</h4>
            <ul className="text-green-200/60 text-sm space-y-1">
              <li>• Обсудите, кто наиболее полезен для выживания группы</li>
              <li>• Учитывайте профессию, здоровье, багаж и специальные навыки</li>
              <li>• Не все характеристики можно раскрывать — думайте стратегически!</li>
              <li>• Помните: в бункере только {bunkerCapacity} мест</li>
            </ul>
          </div>

          <button
            onClick={startVoting}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all transform hover:scale-[1.02] shadow-lg"
          >
            🗳️ ПЕРЕЙТИ К ГОЛОСОВАНИЮ
          </button>
        </div>
      </div>
    );
  }

  // VOTING PHASE
  if (phase === 'voting') {
    const alivePlayers = players.filter(p => p.isAlive);
    const allVoted = Object.keys(votes).length === alivePlayers.length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-red-400">🗳️ Голосование</h2>
            <p className="text-green-300/70 mt-2">Кого вы изгоняете из бункера? Раунд {currentRound}</p>
            <p className="text-yellow-400/70 text-sm mt-1">Передавайте устройство каждому игроку для голосования</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-6 border border-green-500/30">
            {alivePlayers.map(player => {
              const hasVoted = votes[player.id] !== undefined;
              return (
                <div key={player.id} className="mb-6 last:mb-0">
                  <div className={`p-4 rounded-xl border ${hasVoted ? 'border-green-500/50 bg-green-900/20' : 'border-yellow-500/50 bg-yellow-900/20'}`}>
                    <h3 className="text-lg font-bold text-white mb-3">
                      {hasVoted ? '✅' : '👆'} Голосует: <span className="text-green-300">{player.name}</span>
                    </h3>
                    
                    {hasVoted ? (
                      <p className="text-green-300">
                        Голос отдан за: <span className="font-bold text-yellow-300">
                          {players.find(p => p.id === votes[player.id])?.name ?? 'Неизвестно'}
                        </span>
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {alivePlayers
                          .filter(p => p.id !== player.id)
                          .map(target => (
                            <button
                              key={target.id}
                              onClick={() => castVote(player.id, target.id)}
                              className="bg-gray-700/50 hover:bg-red-900/50 border border-gray-600/30 hover:border-red-500/50 rounded-lg p-3 text-left transition-all"
                            >
                              <span className="text-white font-medium">{target.name}</span>
                              {target.revealedTraits.length > 0 && (
                                <p className="text-gray-400 text-xs mt-1">
                                  Раскрыто: {target.revealedTraits.length} черт
                                </p>
                              )}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              onClick={finishVoting}
              disabled={!allVoted}
              className={`w-full mt-4 font-bold py-4 px-6 rounded-xl text-lg transition-all ${
                allVoted
                  ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {allVoted ? '📊 Подсчитать голоса' : `⏳ Проголосовали ${Object.keys(votes).length}/${alivePlayers.length}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS PHASE
  if (phase === 'results') {
    const alivePlayers = players.filter(p => p.isAlive);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-8 border border-red-500/30 shadow-2xl text-center">
            <div className="text-6xl mb-4">🚪</div>
            <h2 className="text-3xl font-bold text-red-400 mb-2">Игрок изгнан!</h2>
            
            {eliminatedPlayer && (
              <div className="my-6 bg-red-900/20 rounded-xl p-4 border border-red-500/30">
                <h3 className="text-xl font-bold text-red-300 mb-3">{eliminatedPlayer.name}</h3>
                <div className="space-y-2 text-left">
                  <p className="text-gray-300 text-sm"><span className="text-green-400">Профессия:</span> {eliminatedPlayer.character.profession}</p>
                  <p className="text-gray-300 text-sm"><span className="text-green-400">Биология:</span> {eliminatedPlayer.character.biology}</p>
                  <p className="text-gray-300 text-sm"><span className="text-green-400">Здоровье:</span> {eliminatedPlayer.character.health}</p>
                  <p className="text-gray-300 text-sm"><span className="text-green-400">Хобби:</span> {eliminatedPlayer.character.hobby}</p>
                  <p className="text-gray-300 text-sm"><span className="text-green-400">Фобия:</span> {eliminatedPlayer.character.phobia}</p>
                  <p className="text-gray-300 text-sm"><span className="text-green-400">Багаж:</span> {eliminatedPlayer.character.baggage}</p>
                  <p className="text-gray-300 text-sm"><span className="text-green-400">Секрет:</span> {eliminatedPlayer.character.specialInfo}</p>
                  <p className="text-gray-300 text-sm"><span className="text-green-400">Действие:</span> {eliminatedPlayer.character.action}</p>
                </div>
              </div>
            )}

            <p className="text-green-300 mb-4">
              В бункере осталось: <span className="font-bold text-green-400">{alivePlayers.length}</span> игроков
              (мест: {bunkerCapacity})
            </p>

            <button
              onClick={nextRound}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all"
            >
              {alivePlayers.length <= bunkerCapacity || currentRound >= maxRounds
                ? '🏆 Завершить игру'
                : '▶️ Следующий раунд'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GAME OVER PHASE
  if (phase === 'game-over') {
    const survivors = players.filter(p => p.isAlive);
    const eliminated = players.filter(p => !p.isAlive);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-4xl font-bold text-green-400 mb-2">ИГРА ОКОНЧЕНА</h1>
            <p className="text-green-300/70">Сценарий: {currentCondition.name}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Survivors */}
            <div className="bg-green-900/20 rounded-xl p-4 border border-green-500/30">
              <h3 className="text-green-400 font-bold text-lg mb-3 text-center">✅ Выжили в бункере</h3>
              <div className="space-y-3">
                {survivors.map(p => (
                  <div key={p.id} className="bg-green-800/30 rounded-lg p-3">
                    <p className="text-green-200 font-bold">{p.name}</p>
                    <p className="text-green-300/70 text-sm">{p.character.profession}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Eliminated */}
            <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/30">
              <h3 className="text-red-400 font-bold text-lg mb-3 text-center">❌ Изгнаны из бункера</h3>
              <div className="space-y-3">
                {eliminated.map(p => (
                  <div key={p.id} className="bg-red-800/30 rounded-lg p-3">
                    <p className="text-red-200 font-bold">{p.name}</p>
                    <p className="text-red-300/70 text-sm">{p.character.profession}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full character reveals */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-green-500/20 mb-6">
            <h3 className="text-green-300 font-bold mb-3">📋 Все персонажи:</h3>
            <div className="space-y-2">
              {players.map(p => (
                <details key={p.id} className="bg-gray-700/30 rounded-lg">
                  <summary className="p-2 cursor-pointer text-green-200 hover:text-green-100">
                    {p.isAlive ? '✅' : '❌'} {p.name} — {p.character.profession}
                  </summary>
                  <div className="p-3 pt-0 text-sm text-gray-300 space-y-1">
                    <p>🧬 {p.character.biology}</p>
                    <p>❤️ {p.character.health}</p>
                    <p>🎯 {p.character.hobby}</p>
                    <p>😱 {p.character.phobia}</p>
                    <p>🎒 {p.character.baggage}</p>
                    <p>🔐 {p.character.specialInfo}</p>
                    <p>⚡ {p.character.action}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Discussion questions for debrief */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-yellow-500/20 mb-6">
            <h3 className="text-yellow-300 font-bold mb-3">💬 Вопросы для обсуждения (Debrief):</h3>
            <ul className="text-yellow-200/70 text-sm space-y-1">
              <li>• Какие качества были наиболее важны для выживания?</li>
              <li>• Как вы принимали решения — рационально или эмоционально?</li>
              <li>• Кто из игроков лучше всего "продал" свою полезность?</li>
              <li>• Какие параллели можно провести с рабочей средой?</li>
              <li>• Как информация влияла на ваше мнение о других?</li>
              <li>• Что было сложнее: убеждать или оценивать?</li>
            </ul>
          </div>

          <button
            onClick={resetGame}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            🔄 ИГРАТЬ СНОВА
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
