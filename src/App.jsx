import React, { useState, useEffect, useRef } from "react";

// 카드 그리드 계산
function getGrid(numCards, width) {
  let cols = 2;
  if (width > 600 && numCards > 4) cols = 3;
  if (width > 900 && numCards > 6) cols = 4;
  if (width > 1200 && numCards > 12) cols = 5;
  while (cols * Math.ceil(numCards / cols) < numCards) cols++;
  return { cols, rows: Math.ceil(numCards / cols) };
}
function shuffle(arr) {
  return arr.slice().sort(() => Math.random() - 0.5);
}
function isMobile() {
  return window.innerWidth <= 600;
}
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
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [stage, setStage] = useState(MIN_STAGE);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [tries, setTries] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameClear, setGameClear] = useState(false);
  const [showClearPopup, setShowClearPopup] = useState(false);
  const [grid, setGrid] = useState({ rows: 2, cols: 2 });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [hinting, setHinting] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0); // 키보드 포커스용
  const [dark, setDark] = useState(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const cardBtnRefs = useRef([]);

  // 로고/이름
  const radiotLogo = "/logo.png";
  const creatorName = "RADIOT LAB";

  // 반응형
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 시스템 다크모드 반영
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // 다크모드 배경
  useEffect(() => {
    document.body.style.background = dark
      ? "linear-gradient(120deg,#18181c 40%, #271933 100%)"
      : "linear-gradient(120deg,#fffbe7 40%, #ffe3f4 100%)";
    document.body.style.color = dark ? "#eee" : "#222";
    document.body.style.fontFamily = "'Noto Sans KR', 'Pretendard', Arial, sans-serif";
  }, [dark]);

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
      setShowClearPopup(false);
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
    setShowClearPopup(false);
  };

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
    setFlipped([]);
    setMatched([]);
    setTries(0);
    setGrid(getGrid(tempCards.length, windowWidth));
    setGameStarted(true);
    setGameClear(false);
    setShowClearPopup(false);
    setHinting(false);
    setFocusIdx(0);
    setTimeout(() => cardBtnRefs.current[0]?.focus(), 100);
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
    setFocusIdx(idx);
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
      setTimeout(() => setShowClearPopup(true), 550);
    }
  }, [matched, cards, gameStarted]);

  // 다시 섞기
  const handleRestart = () => {
    startStage(stage);
  };

  // 처음으로(이미지 선택화면)
  const handleGoHome = () => {
    setGameStarted(false);
    setGameClear(false);
    setShowClearPopup(false);
    setStage(MIN_STAGE);
    setFlipped([]);
    setMatched([]);
    setCards([]);
    setTries(0);
    setFocusIdx(0);
  };

  // 다음 단계 이동
  const handleNextStage = () => {
    const maxPairs = selectedImages.length;
    const nextStage = stage + 1;
    if (nextStage > MAX_STAGE) {
      setStage(MAX_STAGE);
      setGameStarted(false);
      setGameClear(false);
      setShowClearPopup(false);
      return;
    }
    if (getPairCountByStage(nextStage, maxPairs) > maxPairs) {
      setGameStarted(false);
      setGameClear(false);
      setShowClearPopup(false);
      return;
    }
    setStage(nextStage);
    setTimeout(() => startStage(nextStage), 350);
  };

  // 단계 선택
  const handleStageSelect = (targetStage) => {
    setStage(targetStage);
    setTimeout(() => startStage(targetStage), 100);
  };

  // 힌트
  const handleHint = () => {
    if (hinting) return;
    setHinting(true);
    setFlipped(Array.from({ length: cards.length }, (_, i) => i));
    setTimeout(() => {
      setFlipped([]);
      setHinting(false);
    }, 1200);
  };

  // 카드에 포커스
  useEffect(() => {
    if (gameStarted && cardBtnRefs.current[focusIdx]) {
      cardBtnRefs.current[focusIdx].focus();
    }
  }, [focusIdx, gameStarted]);

  // 키보드 조작
  useEffect(() => {
    if (!gameStarted || showClearPopup) return;
    const handleKeyDown = (e) => {
      if (cards.length === 0) return;
      let nextIdx = focusIdx;
      const { cols, rows } = grid;
      switch (e.key) {
        case "ArrowRight":
          nextIdx = (focusIdx + 1) % cards.length; break;
        case "ArrowLeft":
          nextIdx = (focusIdx - 1 + cards.length) % cards.length; break;
        case "ArrowDown":
          nextIdx = (focusIdx + cols) % cards.length; break;
        case "ArrowUp":
          nextIdx = (focusIdx - cols + cards.length) % cards.length; break;
        case " ":
        case "Enter":
          handleFlip(focusIdx);
          break;
        case "h":
        case "H":
          handleHint();
          break;
        case "r":
        case "R":
          handleRestart();
          break;
        case "Escape":
          handleGoHome();
          break;
        default:
          return;
      }
      if (nextIdx !== focusIdx) setFocusIdx(nextIdx);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusIdx, grid, gameStarted, showClearPopup, cards, handleFlip]);

  // 모달 키보드
  useEffect(() => {
    if (!showClearPopup) return;
    const handleModalKey = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        setShowClearPopup(false);
        if (stage < Math.min(selectedImages.length - 1, MAX_STAGE)) {
          handleNextStage();
        } else {
          handleGoHome();
        }
      }
      if (e.key === "Escape") {
        setShowClearPopup(false);
        handleGoHome();
      }
    };
    window.addEventListener("keydown", handleModalKey);
    return () => window.removeEventListener("keydown", handleModalKey);
  }, [showClearPopup, stage, selectedImages]);

  // ----------- UI ----------- //
  return (
    <div className={`main-bg${dark ? " dark" : ""}`}>
      <style>{`
      :root {
        --main-bg: ${dark ? "#231e33" : "#fffbe7"};
        --main-accent: ${dark ? "#46327d" : "#ffe3f4"};
        --btn-bg: ${dark ? "#2c2743" : "#f6f8fa"};
        --btn-bg-sel: ${dark ? "#34335a" : "#e5e9f0"};
        --btn-txt: ${dark ? "#e2e2f9" : "#5c6473"};
        --btn-txt-sel: ${dark ? "#b5d1ff" : "#2953a6"};
        --btn-border: ${dark ? "#4e4585" : "#e3e3ea"};
        --card-back: ${dark ? "#3d3058" : "#ffe4e1"};
        --card-front: ${dark ? "#2a2142" : "#fff"};
        --modal-bg: ${dark ? "rgba(40,20,45,0.98)" : "rgba(255,255,255,0.98)"};
        --modal-shadow: ${dark ? "0 6px 48px 0 #300e5c55" : "0 8px 40px 2px #ffe3f455"};
      }
      .main-bg {
        min-height: 100vh;
        width: 100vw;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 6vw 0 3vw 0;
        background: var(--main-bg);
        color: ${dark ? "#eee" : "#222"};
        transition: background 0.4s;
      }
      .main-bg.dark { background: var(--main-bg); }
      .card-panel {
        width: 98vw;
        max-width: 600px;
        background: ${dark ? "#211a32e0" : "rgba(255,255,255,0.95)"};
        border-radius: 2rem;
        box-shadow: 0 8px 24px 2px #ffe3f455;
        padding: 3vw 2vw 2vw 2vw;
        display: flex;
        flex-direction: column;
        align-items: center;
        border: 2.5px solid ${dark ? "#46327d" : "#fff7c1"};
        position: relative;
      }
      .game-title {
        font-size: 2.1rem;
        font-weight: bold;
        color: #ff8eb7;
        letter-spacing: -1px;
        text-shadow: 0 2px 6px #ffe3f4;
        margin-bottom: 0.7rem;
        margin-right: auto;
        display: flex; align-items: center; gap: 0.3em;
      }
      .stage-nav-wrap {
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        justify-content: flex-end;
        margin-bottom: 0.8em;
        min-height: 2.3em;
      }
      .stage-nav {
        display: flex;
        gap: 0.2em;
        flex-wrap: wrap;
      }
      .stage-btn {
        border: none;
        background: var(--btn-bg);
        color: var(--btn-txt);
        font-weight: 500;
        border-radius: 0.8em;
        padding: 0.28em 1.16em;
        font-size: 1.02em;
        cursor: pointer;
        margin-bottom: 0.1em;
        transition: background 0.14s, color 0.12s, font-weight 0.15s;
        box-shadow: none;
        outline: none;
      }
      .stage-btn.selected {
        background: var(--btn-bg-sel);
        color: var(--btn-txt-sel);
        font-weight: 700;
      }
      .stage-btn:disabled {
        background: #f3f4f7;
        color: #c1c5cd;
        opacity: 0.75;
        font-weight: 500;
      }
      .card-grid {
        display: grid;
        gap: 1.7rem;
        width: 100%;
        justify-content: center;
        margin-bottom: 2vw;
        grid-template-columns: repeat(${grid.cols}, 1fr);
        max-width: 600px;
        min-width: 320px;
      }
      .card-btn {
        width: 150px;
        height: 190px;
        min-width: 128px;
        min-height: 160px;
        max-width: 180px;
        max-height: 230px;
        border-radius: 1.6rem;
        border: 2.5px solid var(--card-back);
        box-shadow: 0 4px 18px 0 #ffe3f477;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin: 0;
        background: none;
        cursor: pointer;
        overflow: hidden;
        position: relative;
        transition: box-shadow .15s, outline 0.12s;
        outline: 2.5px solid transparent;
      }
      .card-btn:focus { outline: 2.5px solid #b68fff; z-index: 2;}
      .card-inner {
        width: 100%; height: 100%;
        position: relative;
        border-radius: 1.4rem;
        transition: transform 0.56s cubic-bezier(.29,.58,.5,1.37);
        transform-style: preserve-3d;
      }
      .card-inner.flipped { transform: rotateY(180deg);}
      .card-front, .card-back {
        position: absolute; width: 100%; height: 100%; left: 0; top: 0;
        border-radius: 1.4rem;
        backface-visibility: hidden;
        display: flex; align-items: center; justify-content: center;
      }
      .card-front { z-index: 2; background: var(--card-front);}
      .card-back {
        background: var(--card-back);
        color: #fff5ad;
        font-size: 2.3rem; font-weight: bold;
        transform: rotateY(180deg);
        z-index: 1;
      }
      .card-img {
        width: 100%; height: 100%; object-fit: cover; object-position: center;
        border-radius: 1.4rem; background: var(--card-front); display: block;
      }
      .btn-nice {
        border: none;
        border-radius: 1.5rem;
        background: var(--btn-bg);
        color: var(--btn-txt);
        font-weight: bold;
        font-size: 1.07rem;
        padding: 0.7em 1.6em;
        margin-top: 0.7em;
        margin-bottom: 0.5em;
        box-shadow: 0 2px 8px #ffd3e477;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }
      .btn-nice:disabled { opacity
