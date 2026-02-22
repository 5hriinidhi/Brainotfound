import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="page-wrap pixel-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Added style block to ensure background image loads properly via public folder or standard CSS */}
      <style>
        {`
                    body.pixel-bg {
                        background-image: url('/bg_index.png');
                        background-size: cover;
                        background-position: center;
                        background-attachment: fixed;
                    }
                    body::after {
                        content: '';
                        position: fixed;
                        inset: 0;
                        background: rgba(4, 4, 20, 0.4);
                        pointer-events: none;
                        z-index: 0;
                    }
                    
                    /* Inline previous CSS that was on index.html */
                    .choose-section {
                      padding: 48px 40px;
                      flex: 1;
                      position: relative;
                      z-index: 1;
                    }

                    .choose-label {
                      text-align: center;
                      font-size: 9px;
                      color: var(--text-dim);
                      letter-spacing: 4px;
                      margin-bottom: 40px;
                    }

                    .choose-label span {
                      color: var(--neon-gold);
                    }

                    .game-cards {
                      display: grid;
                      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                      gap: 32px;
                      max-width: 900px;
                      margin: 0 auto;
                    }

                    .game-card {
                      background: var(--bg-card);
                      border: 2px solid var(--text-dim);
                      padding: 32px 28px;
                      cursor: pointer;
                      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
                      position: relative;
                      overflow: hidden;
                      display: flex;
                      flex-direction: column;
                      gap: 20px;
                    }

                    .game-card::before {
                      content: '';
                      position: absolute;
                      top: 0;
                      left: 0;
                      right: 0;
                      height: 3px;
                      background: currentColor;
                      opacity: 0;
                      transition: opacity 0.2s;
                    }

                    .game-card:hover {
                      transform: translate(-4px, -4px);
                    }

                    .game-card.card-red:hover {
                      border-color: var(--neon-red);
                      box-shadow: 8px 8px 0 #000, var(--glow-red);
                    }

                    .game-card.card-red:hover::before {
                      opacity: 1;
                      color: var(--neon-red);
                    }

                    .game-card.card-red .card-accent {
                      color: var(--neon-red);
                    }

                    .game-card.card-red .card-accent-bg {
                      background: rgba(255, 45, 85, 0.08);
                      border-color: rgba(255, 45, 85, 0.3);
                    }

                    .game-card.card-cyan:hover {
                      border-color: var(--neon-cyan);
                      box-shadow: 8px 8px 0 #000, var(--glow-cyan);
                    }

                    .game-card.card-cyan:hover::before {
                      opacity: 1;
                      color: var(--neon-cyan);
                    }

                    .game-card.card-cyan .card-accent {
                      color: var(--neon-cyan);
                    }

                    .game-card.card-cyan .card-accent-bg {
                      background: rgba(0, 245, 255, 0.08);
                      border-color: rgba(0, 245, 255, 0.3);
                    }

                    .card-header {
                      display: flex;
                      align-items: flex-start;
                      gap: 16px;
                    }

                    .card-icon {
                      font-size: 32px;
                      animation: float 3s ease-in-out infinite;
                      flex-shrink: 0;
                    }

                    .card-num {
                      font-size: 8px;
                      color: var(--text-dim);
                      margin-bottom: 6px;
                      letter-spacing: 2px;
                    }

                    .card-title {
                      font-size: 16px;
                      line-height: 1.5;
                      margin-bottom: 6px;
                    }

                    .card-tagline {
                      font-family: 'VT323', monospace;
                      font-size: 15px;
                      color: var(--text-dim);
                      font-style: italic;
                    }

                    .card-desc {
                      font-family: 'VT323', monospace;
                      font-size: 16px;
                      line-height: 1.7;
                      color: var(--text-dim);
                    }

                    .card-meta {
                      display: flex;
                      gap: 12px;
                      flex-wrap: wrap;
                    }

                    .meta-chip {
                      font-size: 7px;
                      padding: 5px 10px;
                      border: 1px solid var(--text-dim);
                      color: var(--text-dim);
                      letter-spacing: 1px;
                    }

                    .card-skills {
                      display: flex;
                      flex-wrap: wrap;
                      gap: 6px;
                    }

                    .card-skill-tag {
                      font-size: 12px;
                      padding: 6px 12px;
                      border: 1px solid;
                      letter-spacing: 1px;
                    }

                    .card-rank-row {
                      padding: 12px;
                      border: 1px solid;
                      font-size: 7px;
                    }

                    .card-rank-row .rank-label {
                      color: var(--text-dim);
                      margin-bottom: 8px;
                      letter-spacing: 2px;
                    }

                    .corner-tl,
                    .corner-br {
                      position: absolute;
                      width: 16px;
                      height: 16px;
                    }

                    .corner-tl {
                      top: 0;
                      left: 0;
                      border-top: 3px solid;
                      border-left: 3px solid;
                    }

                    .corner-br {
                      bottom: 0;
                      right: 0;
                      border-bottom: 3px solid;
                      border-right: 3px solid;
                    }
                    
                    .card-cta {
                      margin-top: auto;
                    }

                    .card-cta a {
                      display: block;
                      text-align: center;
                    }
                `}
      </style>

      {/* DOMAIN HERO (Simplified to show game choices immediately) */}
      <header className="domain-hero" style={{ padding: '60px 40px 40px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="domain-badge" style={{ display: 'inline-block', fontSize: '8px', padding: '6px 16px', border: '2px solid var(--neon-cyan)', color: 'var(--neon-cyan)', letterSpacing: '4px', marginBottom: '24px', boxShadow: 'var(--glow-cyan)' }}>◈ DATA DOMAIN ◈</div>
        <h1 className="domain-title glitch" data-text="CHOOSE YOUR CHALLENGE" style={{ fontSize: 'clamp(24px, 5vw, 40px)', color: '#fff', textShadow: '0 0 20px rgba(0, 245, 255, 0.4)', marginBottom: '16px', lineHeight: 1.3 }}>
          CHOOSE YOUR CHALLENGE
        </h1>
        <p className="domain-subtitle" style={{ fontFamily: '"VT323", monospace', fontSize: '20px', color: 'var(--text-dim)', letterSpacing: '2px', marginBottom: '40px' }}>// prove your skills · earn your rank · build your profile</p>
      </header>

      <hr className="pixel-divider" style={{ border: 'none', borderTop: '2px dashed rgba(0, 245, 255, 0.2)', margin: '0 40px' }} />

      {/* GAME CHOOSE SECTION */}
      <section className="choose-section">
        <p className="choose-label">▸ SELECT A GAME TO <span>BEGIN</span> ◂</p>

        <div className="game-cards">

          {/* ======= GAME CARD 1: DASHBOARD DISASTER ======= */}
          <div
            className="game-card card-red"
            id="card-game1"
            onClick={() => navigate('/game1')}
            role="button"
            tabIndex="0"
            aria-label="Play Dashboard Disaster"
          >
            <div className="corner-tl" style={{ color: 'var(--neon-red)' }}></div>
            <div className="corner-br" style={{ color: 'var(--neon-red)' }}></div>

            <div className="card-header">
              <div className="card-icon" style={{ animationDelay: '0s' }}>🚨</div>
              <div>
                <div className="card-num">GAME 01</div>
                <div className="card-title card-accent">Dashboard Disaster</div>
                <div className="card-tagline">"The CEO presentation is in 4 minutes — fix everything"</div>
              </div>
            </div>

            <p className="card-desc">
              You land inside a broken company dashboard. 7 panels glow red — each hiding a critical error.
              Click a panel, spot the error, fix it, justify the business impact.
              Turn all 7 panels green before the timer hits zero.
            </p>

            <div className="card-meta">
              <span className="meta-chip">⏱ 4 MINUTES</span>
              <span className="meta-chip">🧩 7 PANELS</span>
              <span className="meta-chip">👤 SINGLE PLAYER</span>
              <span className="meta-chip">🎯 TIMED MISSION</span>
            </div>

            <div className="card-skills">
              <span className="card-skill-tag card-accent">📊 Visualization</span>
              <span className="card-skill-tag card-accent">🗄️ MongoDB</span>
              <span className="card-skill-tag card-accent">🧹 Data Cleaning</span>
              <span className="card-skill-tag card-accent">🤖 ML</span>
              <span className="card-skill-tag card-accent">📈 Analytics</span>
              <span className="card-skill-tag card-accent">🔢 Statistics</span>
              <span className="card-skill-tag card-accent">💾 SQL</span>
            </div>

            <div className="card-rank-row card-accent-bg">
              <div className="rank-label">▸ RANK PROGRESSION</div>
              <div className="rank-track">
                <div className="rank-dot card-accent"></div>
                <span className="rank-name">ANALYST TRAINEE</span>
                <span className="rank-track-arrow">→</span>
                <div className="rank-dot card-accent"></div>
                <span className="rank-name">JUNIOR ANALYST</span>
                <span className="rank-track-arrow">→</span>
                <div className="rank-dot card-accent"></div>
                <span className="rank-name">SENIOR ANALYST</span>
                <span className="rank-track-arrow">→</span>
                <div className="rank-dot card-accent"></div>
                <span className="rank-name">DATA LEAD</span>
              </div>
            </div>

            <div className="card-cta">
              <button
                className="btn-pixel btn-red"
                style={{ width: '100%' }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/game1');
                }}
              >
                [ ENTER MISSION ]
              </button>
            </div>
          </div>

          {/* ======= GAME CARD 2: FRAUD OR LEGIT ======= */}
          <div
            className="game-card card-cyan"
            id="card-game2"
            onClick={() => navigate('/game2')}
            role="button"
            tabIndex="0"
            aria-label="Play Fraud or Legit"
          >
            <div className="corner-tl" style={{ color: 'var(--neon-cyan)' }}></div>
            <div className="corner-br" style={{ color: 'var(--neon-cyan)' }}></div>

            <div className="card-header">
              <div className="card-icon" style={{ animationDelay: '0.5s' }}>🕵️</div>
              <div>
                <div className="card-num">GAME 02</div>
                <div className="card-title card-accent">Fraud or Legit?</div>
                <div className="card-tagline">"You are the anomaly detective"</div>
              </div>
            </div>

            <p className="card-desc">
              Review a case file of 20 data records. For each one — flag it or pass it, classify the anomaly,
              rate its severity. Watch out: 20% of records look suspicious but are actually legitimate.
              Surface-level guessing will cost you.
            </p>

            <div className="card-meta">
              <span className="meta-chip">⏱ 3 MINUTES</span>
              <span className="meta-chip">📂 20 RECORDS</span>
              <span className="meta-chip">👤 SINGLE PLAYER</span>
              <span className="meta-chip">🔍 INVESTIGATION</span>
            </div>

            <div className="card-skills">
              <span className="card-skill-tag card-accent">🏦 Bank Fraud</span>
              <span className="card-skill-tag card-accent">🛒 E-commerce</span>
              <span className="card-skill-tag card-accent">🏥 Healthcare</span>
              <span className="card-skill-tag card-accent">📊 Survey Bias</span>
              <span className="card-skill-tag card-accent">💾 DB Corruption</span>
            </div>

            <div className="card-rank-row card-accent-bg">
              <div className="rank-label">▸ RANK PROGRESSION</div>
              <div className="rank-track">
                <div className="rank-dot card-accent"></div>
                <span className="rank-name">ROOKIE DETECTIVE</span>
                <span className="rank-track-arrow">→</span>
                <div className="rank-dot card-accent"></div>
                <span className="rank-name">FIELD DETECTIVE</span>
                <span className="rank-track-arrow">→</span>
                <div className="rank-dot card-accent"></div>
                <span className="rank-name">SENIOR DETECTIVE</span>
                <span className="rank-track-arrow">→</span>
                <div className="rank-dot card-accent"></div>
                <span className="rank-name">CHIEF INVESTIGATOR</span>
              </div>
            </div>

            <div className="card-cta">
              <button
                className="btn-pixel btn-cyan"
                style={{ width: '100%' }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/game2');
                }}
              >
                [ OPEN CASE FILE ]
              </button>
            </div>
          </div>

        </div>{/* /game-cards */}
      </section>
    </div>
  );
};

export default GameSelection;
