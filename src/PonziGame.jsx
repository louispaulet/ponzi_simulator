import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { levelRows } from './simulation.js';

const EVENT_NAME = 'ponzi-snapshot';

class PonziScene extends Phaser.Scene {
  constructor() {
    super('PonziScene');
    this.snapshot = null;
  }

  create() {
    this.cameras.main.setBackgroundColor('#111827');
    this.graphics = this.add.graphics();
    this.labels = this.add.group();
    this.moneyParticles = [];
    this.onSnapshot = (event) => {
      this.snapshot = event.detail;
      this.draw();
    };
    window.addEventListener(EVENT_NAME, this.onSnapshot);
    this.add
      .text(28, 24, 'Ponzi Simulator', {
        color: '#f8fafc',
        fontFamily: 'Inter, sans-serif',
        fontSize: '24px',
        fontStyle: '700',
      })
      .setDepth(2);
  }

  update(_, delta) {
    this.moneyParticles = this.moneyParticles.filter((particle) => {
      particle.life -= delta;
      particle.text.y -= delta * 0.035;
      particle.text.alpha = Math.max(0, particle.life / 900);
      if (particle.life <= 0) {
        particle.text.destroy();
        return false;
      }
      return true;
    });
  }

  draw() {
    if (!this.snapshot) return;
    this.graphics.clear();
    this.labels.clear(true, true);

    const { width, height } = this.scale;
    const rows = visibleTreeRows(levelRows(this.snapshot), 12);
    const maxCount = Math.max(...rows.map((row) => row.count), 1);
    const baseY = 94;
    const rowGap = Math.min(58, (height - 150) / Math.max(rows.length, 1));
    const centerX = width / 2;

    rows.forEach((row, index) => {
      const y = baseY + index * rowGap;
      if (row.type === 'gap') {
        this.graphics.lineStyle(2, 0x94a3b8, 0.28);
        this.graphics.lineBetween(centerX, y - 18, centerX, y + 18);
        this.labels.add(
          this.add.text(centerX - 72, y - 10, `${row.hiddenCount} levels compressed`, {
            color: '#cbd5e1',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
          }),
        );
        return;
      }
      const radius = Math.max(9, Math.min(31, 8 + Math.sqrt(row.count / maxCount) * 28));
      const spread = Math.min(width * 0.82, 100 + Math.log10(row.count + 1) * 180);
      const nodes = Math.min(13, Math.max(1, Math.ceil(Math.log2(row.count + 1))));
      const color = index === 0 ? 0xf97316 : row.count > 0 ? 0x22c55e : 0x64748b;

      if (index > 0) {
        this.graphics.lineStyle(2, 0x64748b, 0.34);
        this.graphics.lineBetween(centerX, y - rowGap + 20, centerX, y - 18);
      }

      for (let i = 0; i < nodes; i += 1) {
        const x = centerX - spread / 2 + (spread / Math.max(nodes - 1, 1)) * i;
        this.graphics.fillStyle(color, 0.95);
        this.graphics.fillCircle(x, y, radius);
        this.graphics.lineStyle(2, 0xf8fafc, 0.18);
        this.graphics.strokeCircle(x, y, radius);
      }

      this.labels.add(
        this.add.text(24, y - 16, `L${row.level}: ${format(row.count)} | cum ${format(row.cumulative)}`, {
          color: '#e5e7eb',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
        }),
      );
    });

    this.graphics.fillStyle(this.snapshot.collapseRisk > 0.7 ? 0xef4444 : 0x38bdf8, 0.86);
    this.graphics.fillRoundedRect(24, height - 44, Math.max(8, (width - 48) * this.snapshot.collapseRisk), 12, 4);
    this.labels.add(
      this.add.text(24, height - 72, `Collapse risk ${Math.round(this.snapshot.collapseRisk * 100)}%`, {
        color: '#f8fafc',
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
      }),
    );

    if (this.snapshot.lastNewParticipants > 0) {
      const particle = this.add.text(centerX - 24, height - 96, '$$$', {
        color: '#fde68a',
        fontFamily: 'Inter, sans-serif',
        fontSize: '22px',
        fontStyle: '700',
      });
      this.moneyParticles.push({ text: particle, life: 900 });
    }
  }

  shutdown() {
    window.removeEventListener(EVENT_NAME, this.onSnapshot);
  }
}

export default function PonziGame({ snapshot }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return undefined;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: '#111827',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 960,
        height: 620,
      },
      scene: PonziScene,
    });
    gameRef.current = game;
    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: snapshot }));
  }, [snapshot]);

  return <div ref={containerRef} className="h-[440px] min-h-[360px] w-full overflow-hidden bg-slate-900 lg:h-[620px]" />;
}

function format(value) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function visibleTreeRows(rows, maxRows) {
  if (rows.length <= maxRows) return rows;
  const newestCount = maxRows - 2;
  return [
    rows[0],
    {
      type: 'gap',
      level: 'gap',
      count: 0,
      cumulative: rows.at(-newestCount).cumulative,
      hiddenCount: rows.length - newestCount - 1,
    },
    ...rows.slice(-newestCount),
  ];
}
