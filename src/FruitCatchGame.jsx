import React, { useState, useRef, useEffect } from 'react';
import { Pause, Play, X } from 'lucide-react';
import liff from '@line/liff'

// ゲームの設定
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 20;
const FRUIT_SIZE = 30;
const BOMB_SIZE = 40;
const MAX_MISSED_OBJECTS = 5; // ゲームオーバーとなる見逃しオブジェクトの最大数

// フルーツと爆弾の種類
const FRUITS = [
  { type: 'apple', color: '#FF0000', points: 1 },
  { type: 'banana', color: '#FFD700', points: 2 },
  { type: 'cherry', color: '#8B0000', points: 3 }
];

const BOMB_CONFIG = { color: '#000000', penalty: -5 };

const FruitCatchGame = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [missedObjects, setMissedObjects] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // ゲーム状態
  const gameStateRef = useRef({
    playerX: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    fallingObjects: [],
    gameSpeed: 2,
    frameCount: 0
  });

  // キャンバスのクリックハンドラ
  const handleCanvasClick = (event) => {
    if (gameOver || isPaused) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    
    gameStateRef.current.playerX = mouseX - PLAYER_WIDTH / 2;
  };

  // オブジェクトの生成
  const createFallingObject = () => {
    const isBonus = Math.random() < 0.2; // 20%の確率で爆弾
    const x = Math.random() * (CANVAS_WIDTH - FRUIT_SIZE);
    
    if (isBonus) {
      return {
        x,
        y: 0,
        width: BOMB_SIZE,
        height: BOMB_SIZE,
        type: 'bomb',
        color: BOMB_CONFIG.color
      };
    }
    
    const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    return {
      x,
      y: 0,
      width: FRUIT_SIZE,
      height: FRUIT_SIZE,
      type: fruit.type,
      color: fruit.color,
      points: fruit.points
    };
  };

  // ゲームループ
  const gameLoop = () => {
    if (gameOver || isPaused) return;

    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // プレイヤーの描画
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(
      gameStateRef.current.playerX, 
      CANVAS_HEIGHT - PLAYER_HEIGHT, 
      PLAYER_WIDTH, 
      PLAYER_HEIGHT
    );

    // フォールオブジェクトの更新と描画
    gameStateRef.current.fallingObjects = 
      gameStateRef.current.fallingObjects.filter(obj => {
        obj.y += gameStateRef.current.gameSpeed;

        // オブジェクトの描画
        ctx.fillStyle = obj.color;
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);

        // 衝突判定
        const playerBottom = CANVAS_HEIGHT - PLAYER_HEIGHT;
        const collision = 
          obj.y + obj.height >= playerBottom &&
          obj.x < gameStateRef.current.playerX + PLAYER_WIDTH &&
          obj.x + obj.width > gameStateRef.current.playerX;

        if (collision) {
          if (obj.type === 'bomb') {
            setScore(prevScore => Math.max(0, prevScore + BOMB_CONFIG.penalty));
          } else {
            setScore(prevScore => prevScore + obj.points);
          }
          return false;
        }

        // 画面外に出たオブジェクトの処理
        if (obj.y > CANVAS_HEIGHT) {
          if (obj.type !== 'bomb') {
            setMissedObjects(prev => {
              const newMissed = prev + 1;
              if (newMissed >= MAX_MISSED_OBJECTS) {
                setGameOver(true);
              }
              return newMissed;
            });
          }
          return false;
        }

        return true;
      });

    // 新しいオブジェクトの生成
    gameStateRef.current.frameCount++;
    if (gameStateRef.current.frameCount % 60 === 0) {
      gameStateRef.current.fallingObjects.push(createFallingObject());
    }

    // ゲームスピードの調整
    if (gameStateRef.current.frameCount % 300 === 0) {
      gameStateRef.current.gameSpeed += 0.5;
    }
  };

  // ゲームの初期化
  const resetGame = () => {
    setScore(0);
    setMissedObjects(0);
    setGameOver(false);
    gameStateRef.current = {
      playerX: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      fallingObjects: [],
      gameSpeed: 2,
      frameCount: 0
    };
  };

  // ゲームループの管理
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const intervalId = setInterval(gameLoop, 1000 / 60); // 60 FPS

    return () => clearInterval(intervalId);
  }, [gameOver, isPaused]);


  const handleShare = () => {
    if (liff.isApiAvailable("shareTargetPicker")) {
      liff.shareTargetPicker([
        {
          "type": "flex",
          "altText": "シューティングゲームのスコアをシェア！",
          "contents": {
            "type": "bubble",
            "hero": {
              "type": "image",
              "url": "https://raw.githubusercontent.com/himanago/line-miniapp-handson/refs/heads/main/icon.png",
              "size": "full",
              "aspectRatio": "20:13",
              "aspectMode": "cover"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "text",
                      "text": `フルーツキャッチゲームで${score}点をとったよ！`,
                      "size": "lg",
                      "color": "#000000",
                      "weight": "bold",
                      "wrap": true
                    }
                  ],
                  "spacing": "none"
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "text",
                      "text": "手軽に遊べるミニゲーム",
                      "size": "sm",
                      "color": "#999999",
                      "wrap": true
                    }
                  ],
                  "spacing": "none"
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "button",
                      "action": {
                        "type": "uri",
                        "label": "遊んでみる！",
                        "uri": `https://miniapp.line.me/${liff.id}`
                      },
                      "style": "primary",
                      "height": "md",
                      "color": "#17c950"
                    },
                    {
                      "type": "button",
                      "action": {
                        "type": "uri",
                        "label": "シェアする",
                        "uri": `https://miniapp.line.me/${liff.id}/share`
                      },
                      "style": "link",
                      "height": "md",
                      "color": "#469fd6"
                    }
                  ],
                  "spacing": "xs",
                  "margin": "lg"
                }
              ],
              "spacing": "md"
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "separator",
                  "color": "#f0f0f0"
                },
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "image",
                      "url": "https://raw.githubusercontent.com/himanago/line-miniapp-handson/refs/heads/main/icon.png",
                      "flex": 1,
                      "gravity": "center"
                    },
                    {
                      "type": "text",
                      "text": "フルーツキャッチゲーム",
                      "flex": 19,
                      "size": "xs",
                      "color": "#999999",
                      "weight": "bold",
                      "gravity": "center",
                      "wrap": false
                    },
                    {
                      "type": "image",
                      "url": "https://vos.line-scdn.net/service-notifier/footer_go_btn.png",
                      "flex": 1,
                      "gravity": "center",
                      "size": "xxs",
                      "action": {
                        "type": "uri",
                        "label": "action",
                        "uri": `https://miniapp.line.me/${liff.id}`
                      }
                    }
                  ],
                  "flex": 1,
                  "spacing": "md",
                  "margin": "md"
                }
              ]
            }
          }
        }
      ]).then(function (res) {
        if (res) {
          alert("シェアしました！");
        } else {
          alert("シェアをキャンセルしました。");
        }
      })
      .catch(function (error) {
        alert("エラーが発生しました。");
      });
    }
  };



  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">フルーツキャッチゲーム</h1>
        <div className="flex justify-between">
          <p>スコア: {score}</p>
          <p>見逃し: {missedObjects} / {MAX_MISSED_OBJECTS}</p>
        </div>
      </div>
      <canvas 
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="border-2 border-gray-300"
      />
      {gameOver && (
        <div className="absolute bg-red-500 text-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-3xl font-bold mb-4">ゲームオーバー</h2>
          <p className="mb-4">最終スコア: {score}</p>
          <button onclick={handleShare}>シェア！</button>
        </div>
      )}
      <div className="mt-4 flex space-x-4">
        {!gameOver && (
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {isPaused ? <Play /> : <Pause />}
          </button>
        )}
        {gameOver && (
          <button 
            onClick={resetGame}
            className="bg-green-500 text-white px-4 py-2 rounded flex items-center"
          >
            <X className="mr-2" /> もう一度プレイ
          </button>
        )}
      </div>
    </div>
  );
};

export default FruitCatchGame;