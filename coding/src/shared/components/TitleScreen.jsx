import React from 'react';
import { motion } from 'framer-motion';
import titleBg from '../../assets/dark.png';

const TitleScreen = ({ onStartDuel, onStartStory, onLeaderboard, onDashboard, onFriendDuel }) => {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(180deg, #0a0e1a 0%, #111827 50%, #0a0e1a 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <img
        src={titleBg}
        alt=""
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 1,
          padding: '2rem',
          maxWidth: '600px',
        }}
      >
        {/* Badge */}
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'inline-block',
            padding: '8px 24px',
            borderRadius: '20px',
            border: '1px solid rgba(0, 255, 255, 0.4)',
            background: 'rgba(0, 255, 255, 0.08)',
            color: '#00e5ff',
            fontSize: '0.75rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '2rem',
            fontFamily: "'Press Start 2P', cursive",
          }}
        >
          · BrainNotFound ·
        </motion.span>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 700,
          color: '#ffffff',
          margin: '0 0 1rem 0',
          lineHeight: 1.15,
          letterSpacing: '4px',
          fontFamily: "'Press Start 2P', cursive",
        }}>
          SKILLFORGE
        </h1>

        {/* Subtitle */}
        <p style={{
          color: 'rgba(255, 255, 255, 0.55)',
          fontSize: '0.8rem',
          lineHeight: 1.6,
          maxWidth: '520px',
          margin: '0 0 3rem 0',
          fontFamily: "'Press Start 2P', cursive",
        }}>
          Choose your path. Battle in quick duels or embark on a story-driven debug adventure.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '380px' }}>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(0, 210, 255, 0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartDuel}
            style={{
              background: 'linear-gradient(135deg, #00d2ff, #0097e6)',
              border: 'none', color: '#fff', padding: '16px 28px', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '1px',
              fontFamily: "'Press Start 2P', cursive",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            ⚡ Quick Match Duel
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(255, 80, 80, 0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartStory}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #e63946)',
              border: 'none', color: '#fff', padding: '16px 28px', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '1px',
              fontFamily: "'Press Start 2P', cursive",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            # Story Mode: Debug Adventure
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(52, 211, 153, 0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onFriendDuel}
            style={{
              background: 'linear-gradient(135deg, #34d399, #059669)',
              border: 'none', color: '#fff', padding: '16px 28px', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '1px',
              fontFamily: "'Press Start 2P', cursive",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            ⚔️ Friendly Duel
          </motion.button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <motion.button
              whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.35)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onLeaderboard}
              style={{
                flex: 1, background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)', color: 'rgba(255, 255, 255, 0.7)',
                padding: '14px 18px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.65rem', letterSpacing: '1px',
                fontFamily: "'Press Start 2P', cursive",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              🏆 Rankings
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, borderColor: 'rgba(167, 139, 250, 0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onDashboard}
              style={{
                flex: 1, background: 'rgba(167, 139, 250, 0.06)',
                border: '1px solid rgba(167, 139, 250, 0.2)', color: 'rgba(167, 139, 250, 0.8)',
                padding: '14px 18px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.65rem', letterSpacing: '1px',
                fontFamily: "'Press Start 2P', cursive",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              📊 Analytics
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TitleScreen;