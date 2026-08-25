import { useState } from "react";
import "./ThumbnailPage.css";

const THUMBNAIL_WIDTH = 1920;
const THUMBNAIL_HEIGHT = 1080;
const THUMBNAIL_IMAGE = `${import.meta.env.BASE_URL}assets/store/feature-graphics/feature-graphic-market-day.png`;
const DEFAULT_TITLE = "수박수박수박박수박";

function splitTitle(value: string) {
  const characters = Array.from(value || DEFAULT_TITLE);
  const firstLineLength = Math.ceil(characters.length / 2);
  return [characters.slice(0, firstLineLength).join(""), characters.slice(firstLineLength).join("")].filter(Boolean);
}

function drawCoverImage(context: CanvasRenderingContext2D, image: HTMLImageElement) {
  const sourceRatio = image.width / image.height;
  const targetRatio = THUMBNAIL_WIDTH / THUMBNAIL_HEIGHT;
  const sourceWidth = sourceRatio > targetRatio ? image.height * targetRatio : image.width;
  const sourceHeight = sourceRatio > targetRatio ? image.height : image.width / targetRatio;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
}

export default function ThumbnailPage() {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [headline, setHeadline] = useState("수박을 가려라!");
  const [tagline, setTagline] = useState("분류 미니게임 × 로그라이크");
  const [isDownloading, setIsDownloading] = useState(false);

  async function downloadThumbnail() {
    setIsDownloading(true);
    try {
      await document.fonts.ready;
      const image = new Image();
      image.src = THUMBNAIL_IMAGE;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = THUMBNAIL_WIDTH;
      canvas.height = THUMBNAIL_HEIGHT;
      const context = canvas.getContext("2d");
      if (!context) return;

      drawCoverImage(context, image);

      context.textAlign = "center";
      context.lineJoin = "round";
      context.font = '78px "DosStory", sans-serif';
      context.lineWidth = 18;
      context.strokeStyle = "#153b2d";
      context.fillStyle = "#f9ffca";
      splitTitle(title).forEach((line, index) => {
        const titleY = 270 + index * 105;
        context.strokeText(line, 1325, titleY);
        context.fillText(line, 1325, titleY);
      });

      context.font = '64px "DosStory", sans-serif';
      context.lineWidth = 14;
      context.strokeStyle = "#702d16";
      context.strokeText(headline, THUMBNAIL_WIDTH / 2, 835);
      context.fillStyle = "#fff6c4";
      context.fillText(headline, THUMBNAIL_WIDTH / 2, 835);

      context.font = '36px "DosStory", sans-serif';
      const tagWidth = context.measureText(tagline).width + 96;
      context.fillStyle = "rgba(18, 58, 45, .92)";
      context.fillRect((THUMBNAIL_WIDTH - tagWidth) / 2, 874, tagWidth, 72);
      context.strokeStyle = "#ffe9a6";
      context.lineWidth = 4;
      context.strokeRect((THUMBNAIL_WIDTH - tagWidth) / 2, 874, tagWidth, 72);
      context.fillStyle = "#fff8cf";
      context.fillText(tagline, THUMBNAIL_WIDTH / 2, 923);

      const download = document.createElement("a");
      download.download = "watermelon-sorter-thumbnail.png";
      download.href = canvas.toDataURL("image/png");
      download.click();
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="thumbnail-page">
      <header className="thumbnail-page-header">
        <p>THUMBNAIL MAKER · 1920 × 1080</p>
        <h1>수박게임 썸네일 만들기</h1>
        <span>문구를 바꾼 뒤 PNG로 내려받으세요.</span>
      </header>

      <section className="thumbnail-maker" aria-label="수박게임 썸네일 편집기">
        <div className="thumbnail-preview" aria-label="썸네일 미리보기">
          <img src={THUMBNAIL_IMAGE} alt="수박과 컨베이어 벨트가 있는 시장 도트 그래픽" />
          <div className="thumbnail-title">
            {splitTitle(title).map((line) => <span key={line}>{line}</span>)}
          </div>
          <div className="thumbnail-copy">
            <strong>{headline || "수박을 가려라!"}</strong>
            <span>{tagline || "분류 미니게임 × 로그라이크"}</span>
          </div>
        </div>

        <div className="thumbnail-controls">
          <label>
            게임 이름
            <input value={title} maxLength={18} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            메인 문구
            <input value={headline} maxLength={20} onChange={(event) => setHeadline(event.target.value)} />
          </label>
          <label>
            핵심 태그
            <input value={tagline} maxLength={30} onChange={(event) => setTagline(event.target.value)} />
          </label>
          <div className="thumbnail-suggestions">
            <strong>추천 구성</strong>
            <span>게임명 · 강한 한 줄 · 장르 태그</span>
            <small>예: “수박을 가려라!” / “분류 미니게임 × 로그라이크”</small>
          </div>
          <button type="button" onClick={downloadThumbnail} disabled={isDownloading}>
            {isDownloading ? "PNG 만드는 중..." : "PNG 다운로드"}
          </button>
        </div>
      </section>
    </main>
  );
}
