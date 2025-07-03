import React, { useState, useEffect } from "react";

// 카드 그리드 계산
function getGrid(numCards, width) {
  let cols = 2;
  if (width > 600 && numCards > 4) cols = 3;
  if (width > 900 && numCards > 6) cols = 4;
  if (width > 1200 && numCards > 12) cols = 5;
  while (cols * Math.ceil(numCards / cols) < numCards) cols++;
  return { cols, rows: Math.ceil(numCards / cols) };
}

// 셔플
function shuffle(arr) {
  return arr.slice().sort(() => Math.random() - 0.5);
}

// 모바일 환경 체크
function isMobile() {
  return window.innerWidth <= 600;
}

// 모바일용: 카드를 행별로 분리
function getRowsForMobile(cards, cols) {
  const rows = [];
  for (let i = 0; i < cards.length; i += cols) {
    rows.push(cards.slice(i, i + cols));
  }
  return rows;
}

const MIN_STAGE = 1;
const MAX_STAGE = 10;

export default function App() {
  const [uploadedImages, setUploadedImages] = useState([]); // 업로드한 전체 이미지
  const [selectedImages, setSelectedImages] = useState([]); // 체크된 이미지
  const [stage, setStage] = useState(MIN_STAGE); // 현재 단계
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [tries, setTries] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameClear, setGameClear] = useState(false);
  const [cardBackColors, setCardBackColors] = useState([]);
  const [grid, setGrid] = useState({ rows: 2, cols: 2 });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [hinting, setHinting] = useState(false); // 힌트 기능 상태

  // 고정 로고/이름
  const radiotLogo = "/logo.png";
  const creatorName = "RADIOT LAB";

  // 반응형
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 이미지 업로드
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(
      files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target.result);
          reader.readAsDataURL(file);
        });
      })
    ).then((imgDataList) => {
      setUploadedImages(imgDataList.slice(0, 12));
      setSelectedImages(imgDataList.slice(0, 12));
      setStage(MIN_STAGE);
      setGameStarted(false);
      setGameClear(false);
    });
  };

  // 이미지 선택/해제
  const handleSelectImage = (img) => {
    setSelectedImages(prev =>
      prev.includes(img)
        ? prev.filter(i => i !== img)
        : prev.length < 12 ? [...prev, img] : prev
    );
    setStage(MIN_STAGE);
    setGameStarted(false);
    setGameClear(false);
  };

  // 단계별 사용할 카드쌍 수
  function getPairCountByStage(stage, maxPairs) {
    return Math.min(stage + 1, maxPairs);
  }

  // 단계별 게임 시작
  const startStage = (_stage = stage) => {
    const pairCount = getPairCountByStage(_stage, selectedImages.length);
    if (selectedImages.length < 2 || pairCount < 2) {
      alert("2장 이상 선택하세요.");
      return;
    }
    const stageImgs = selectedImages.slice(0, pairCount);
    const doubledImages = stageImgs.flatMap(img => [img, img]);
    const tempCards = shuffle(doubledImages);
    setCards(tempCards);
    setCardBackColors(Array(tempCards.length).fill().map(() => "#ffe3f4"));
    setFlipped([]);
    setMatched([]);
    setTries(0);
    setGrid(getGrid(tempCards.length, windowWidth));
    setGameStarted(true);
    setGameClear(false);
    setHinting(false);
  };

  // 그리드 재계산
  useEffect(() => {
    if (gameStarted) setGrid(getGrid(cards.length, windowWidth));
  }, [windowWidth, cards.length, gameStarted]);

  // 카드 클릭 처리
  const handleFlip = (idx) => {
    if (!gameStarted || gameClear || hinting) return;
    if (flipped.length === 2 || flipped.includes(idx) || matched.includes(idx)) return;
    setFlipped(prev => [...prev, idx]);
  };

  // 매칭 체크
  useEffect(() => {
    if (flipped.length === 2 && !hinting) {
      setTries(t => t + 1);
      const [i, j] = flipped;
      if (cards[i] === cards[j] && i !== j) {
        setMatched(m => [...m, i, j]);
      }
      setTimeout(() => setFlipped([]), 600);
    }
  }, [flipped, cards, hinting]);

  // 게임 종료 체크
  useEffect(() => {
    if (gameStarted && matched.length === cards.length && cards.length > 0) {
      setGameClear(true);
    }
  }, [matched, cards, gameStarted]);

  // 다시 섞기
  const handleRestart = () => {
    startStage(stage);
  };

  // 다음 단계 이동
  const handleNextStage = () => {
    const maxPairs = selectedImages.length;
    const nextStage = stage + 1;
    if (nextStage > MAX_STAGE) {
      alert("최고 단계를 모두 클리어했습니다!");
      setStage(MAX_STAGE);
      setGameStarted(false);
      setGameClear(false);
      return;
    }
    if (getPairCountByStage(nextStage, maxPairs) > maxPairs) {
      alert("이미지가 부족합니다. 이미지를 더 추가해 주세요!");
      setGameStarted(false);
      setGameClear(false);
      return;
    }
    setStage(nextStage);
    setTimeout(() => startStage(nextStage), 300);
  };

  // 다른 난이도 직접 선택
  const handleStageSelect = (targetStage) => {
    setStage(targetStage);
    setTimeout(() => startStage(targetStage), 100);
  };

  // 힌트 버튼 기능
  const handleHint = () => {
    if (hinting) return;
    setHinting(true);
    setFlipped(Array.from({ length: cards.length }, (_, i) => i));
    setTimeout(() => {
      setFlipped([]);
      setHinting(false);
    }, 1500);
  };

  // 배경색 밝게
  useEffect(() => {
    document.body.style.background = "linear-gradient(120deg,#fffbe7 40%, #ffe3f4 100%)";
    document.body.style.fontFamily = "'Noto Sans KR', Arial, sans-serif";
  }, []);

  // ----------- UI -----------
  return (
    <div className="main-bg">
      <style>{`
      .main-bg {
        min-height: 100vh;
        width: 100vw;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 6vw 0 3vw 0;
      }
      .card-panel {
        width: 96vw;
        max-width: 520px;
        background: rgba(255,255,255,0.95);
        border-radius: 2rem;
        box-shadow: 0 8px 24px 2px #ffe3f455;
        padding: 3vw 2vw 2vw 2vw;
        display: flex;
        flex-direction: column;
        align-items: center;
        border: 2.5px solid #fff7c1;
      }
      .game-title {
        font-size: 2.1rem;
        font-weight: bold;
        color: #ff8eb7;
        letter-spacing: -1px;
        text-shadow: 0 2px 6px #ffe3f4;
        margin-bottom: 1.2rem;
        display: flex; align-items: center; gap: 0.3em;
      }
      .game-title .emoji {
        font-size: 2rem;
        margin-bottom: 0.1em;
      }
      .stage-nav {
        display: flex;
        gap: 0.4em;
        margin: 0.7em 0 1.3em 0;
        flex-wrap: wrap;
        justify-content: center;
      }
      .stage-btn {
        border: none;
        background: linear-gradient(90deg, #fffbe7, #ffe3f4 70%);
        color: #c84070;
        font-weight: bold;
        border-radius: 0.9em;
        padding: 0.28em 1.2em;
        box-shadow: 0 2px 7px #ffe0ee30;
        font-size: 1.08em;
        cursor: pointer;
        margin-bottom: 0.2em;
        transition: background .14s, transform .09s;
      }
      .stage-btn.selected {
        background: linear-gradient(90deg, #ffbff4 40%, #fffbe7 100%);
        color: #ff58aa;
        border: 1.5px solid #fdbfe6;
        transform: scale(1.07);
      }
      .stage-btn:disabled {
        background: #f2f2f2;
        color: #bbb;
        opacity: 0.7;
        border: 1.5px solid #ffe3f4;
      }
      .card-grid {
        display: grid;
        gap: 2vw;
        width: 100%;
        justify-content: center;
        margin-bottom: 2vw;
        grid-template-columns: repeat(${grid.cols}, 1fr);
      }
      @media (max-width: 500px) {
        .card-panel { padding: 5vw 2vw 2vw 2vw; }
        .game-title { font-size: 1.25rem; }
        .game-title .emoji { font-size: 1.2rem;}
        .card-grid { gap: 3vw; }
      }
      .card-btn {
        width: 18vw;
        height: 22vw;
        min-width: 72px; max-width: 108px;
        min-height: 88px; max-height: 132px;
        border-radius: 1.1rem;
        border: 2px solid #ffe4e1;
        box-shadow: 0 4px 16px 0 #ffe3f444;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        background: #fff;
        cursor: pointer;
        overflow: hidden;
        position: relative;
        transition: transform .15s;
      }
      .card-btn:active { transform: scale(0.96);}
      .card-back {
        width: 100%; height: 100%;
        border-radius: 1.1rem;
        display: flex; align-items: center; justify-content: center;
        font-size: 2.3rem;
        font-weight: bold;
        color: #fff5ad;
        background: #ffe4e1;
      }
      .card-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center center;
        border-radius: 1.1rem;
        background: #fff;
        display: block;
      }
      .btn-nice {
        border: none;
        border-radius: 1.5rem;
        background: linear-gradient(90deg,#ffe3f4,#fffbe7 90%);
        color: #c84070;
        font-weight: bold;
        font-size: 1.1rem;
        padding: 0.7em 1.7em;
        margin-top: 0.7em;
        margin-bottom: 0.5em;
        box-shadow: 0 2px 8px #ffd3e477;
        cursor: pointer;
        transition: background 0.2s,transform 0.11s;
      }
      .btn-nice:disabled { opacity: 0.45; }
      .btn-nice:active { background: #ffe3f4; }
      .info-txt { font-size: 0.95em; color: #666; }
      .try-txt { color: #ff8eb7; font-weight: bold; font-size: 1.13rem; }
      .success-txt { color: #2cd67e; font-weight: bold; font-size: 1.2em; margin-top:1vw;}
      .creator-box {
        margin-top: 2vw;
        display: flex;
        align-items: center;
        gap: 0.6em;
        font-size: 1.05rem;
        font-weight: 500;
        color: #3b4653;
        background: #fff8f2cc;
        border-radius: 1.2em;
        padding: 0.3em 1.2em 0.3em 0.7em;
        box-shadow: 0 2px 8px #ffe0ee36;
      }
      .logo-img {
        width: 32px; height: 32px; border-radius: 50%; background: #fff;
        border: 1.5px solid #ffe3f4;
        object-fit: cover;
        margin-right: 0.1em;
      }
      `}</style>

      <div className="card-panel">
        <div className="game-title">
          <span className="emoji"></span> memory game
        </div>

        {/* 이미지 업로드, 게임 시작 전만 */}
        {!gameStarted && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <label style={{ marginBottom: "0.7em", color: "#aa68b6", fontWeight: "500" }}>
              최대 12장의 이미지를 선택하세요
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{
                marginBottom: "0.7em",
                border: "1.5px solid #ffe3f4",
                borderRadius: "0.8em",
                padding: "0.3em 1em",
                background: "#fffaf3",
                fontSize: "1em"
              }}
            />

            <div style={{ display: 'flex', gap: '1vw', flexWrap: 'wrap', margin: '1vw 0', justifyContent:"center" }}>
              {uploadedImages.map((img, i) => (
                <label key={i} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight:"0.4em" }}>
                  <input
                    type="checkbox"
                    checked={selectedImages.includes(img)}
                    onChange={() => handleSelectImage(img)}
                    disabled={
                      (selectedImages.length <= 2 && selectedImages.includes(img)) ||
                      (!selectedImages.includes(img) && selectedImages.length >= 12)
                    }
                    style={{ marginBottom: "0.1em" }}
                  />
                  <img src={img} alt="" style={{ width: 38, height: 38, borderRadius: 8, border: '1.5px solid #ffe3f4', background:"#fff" }} />
                </label>
              ))}
            </div>

            <button
              onClick={() => startStage(MIN_STAGE)}
              disabled={selectedImages.length < 2}
              className="btn-nice"
            >
              1단계부터 시작
            </button>
            <div className="info-txt" style={{ marginTop: "0.5em" }}>
              ※ 사진은 브라우저 내에서만 사용됩니다.
            </div>
          </div>
        )}

        {/* 게임 진행 화면 */}
        {gameStarted && (
          <>
            {/* 단계 선택 네비 */}
            <div className="stage-nav">
              {Array.from({ length: Math.min(selectedImages.length - 1, MAX_STAGE) }, (_, idx) => {
                const s = idx + 1;
                return (
                  <button
                    key={s}
                    className={`stage-btn${s === stage ? " selected" : ""}`}
                    onClick={() => handleStageSelect(s)}
                    disabled={s > selectedImages.length - 1}
                  >
                    {s}단계
                  </button>
                );
              })}
            </div>

            {/* 카드판 */}
            {isMobile() ? (
              // 모바일: 센터 대칭 행별 렌더링
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "3vw", alignItems: "center", marginBottom: "2vw" }}>
                {getRowsForMobile(cards, grid.cols).map((row, rIdx) => {
                  const spaces = grid.cols - row.length;
                  const leftPad = Math.floor(spaces / 2);
                  const rightPad = spaces - leftPad;
                  return (
                    <div key={rIdx} style={{
                      display: "flex",
                      justifyContent: "center",
                      width: "100%",
                      minHeight: 0,
                    }}>
                      {/* 왼쪽 빈칸 */}
                      {Array(leftPad).fill(0).map((_, i) =>
                        <div key={`lp${i}`} style={{ width: "18vw", minWidth: 72, maxWidth: 108, marginRight: "2vw", background: "none" }} />
                      )}
                      {/* 카드 */}
                      {row.map((img, idx2) => {
                        const idx = rIdx * grid.cols + idx2;
                        return (
                          <button
                            key={idx}
                            className="card-btn
