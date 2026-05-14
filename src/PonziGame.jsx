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
    this.cameras.main.setBackgroundColor('#0d1117');
    this.graphics = this.add.graphics();
    this.labels = this.add.group();
    this.moneyParticles = [];
    this.onSnapshot = (event) => {
      this.snapshot = event.detail;
      this.draw();
    };
    window.addEventListener(EVENT_NAME, this.onSnapshot);
    this.title = this.add
      .text(30, 24, 'CASH FLOW / COHORT MAP', {
        color: '#f4f1ea',
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
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
    const baseY = 96;
    const rowGap = Math.min(54, (height - 178) / Math.max(rows.length, 1));
    const centerX = width / 2;
    const risk = this.snapshot.collapseRisk;

    this.drawBackground(width, height, risk);

    rows.forEach((row, index) => {
      const y = baseY + index * rowGap;
      if (row.type === 'gap') {
        this.graphics.lineStyle(2, 0xf3d46b, 0.35);
        this.graphics.lineBetween(centerX, y - 18, centerX, y + 18);
        this.labels.add(
          this.add.text(centerX - 86, y - 10, `${row.hiddenCount} levels compressed`, {
            color: '#f3d46b',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontStyle: '700',
          }),
        );
        return;
      }
      const radius = Math.max(8, Math.min(29, 7 + Math.sqrt(row.count / maxCount) * 27));
      const spread = Math.min(width * 0.78, 80 + Math.log10(row.count + 1) * 165);
      const nodes = Math.min(15, Math.max(1, Math.ceil(Math.log2(row.count + 1))));
      const color = index === 0 ? 0xf3d46b : risk > 0.7 ? 0xd63d2e : row.count > 0 ? 0x37c993 : 0x6d7480;

      if (index > 0) {
        this.graphics.lineStyle(3, risk > 0.7 ? 0xd63d2e : 0x2864c9, 0.22);
        this.graphics.lineBetween(centerX, y - rowGap + 20, centerX, y - 18);
      }

      for (let i = 0; i < nodes; i += 1) {
        const x = centerX - spread / 2 + (spread / Math.max(nodes - 1, 1)) * i;
        const drift = Math.sin((this.snapshot.month + i + index) * 0.85) * Math.min(7, risk * 10);
        this.graphics.fillStyle(0x000000, 0.22);
        this.graphics.fillCircle(x + 4, y + 5, radius);
        this.graphics.fillStyle(color, 0.95);
        this.graphics.fillCircle(x + drift, y, radius);
        this.graphics.lineStyle(2, 0xf4f1ea, 0.38);
        this.graphics.strokeCircle(x + drift, y, radius);
      }

      this.labels.add(
        this.add.text(30, y - 16, `L${row.level}`, {
          color: '#f4f1ea',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontStyle: '700',
        }),
      );
      this.labels.add(
        this.add.text(74, y - 16, `${format(row.count)} joined / ${format(row.cumulative)} total`, {
          color: '#b8c0cc',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
        }),
      );
    });

    const riskColor = risk > 0.7 ? 0xd63d2e : risk > 0.38 ? 0xf3d46b : 0x37c993;
    this.graphics.lineStyle(2, 0xf4f1ea, 0.2);
    this.graphics.strokeRect(30, height - 54, width - 60, 16);
    this.graphics.fillStyle(riskColor, 0.92);
    this.graphics.fillRect(30, height - 54, Math.max(8, (width - 60) * risk), 16);
    this.labels.add(
      this.add.text(30, height - 82, `Collapse risk ${Math.round(risk * 100)}%`, {
        color: '#f4f1ea',
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        fontStyle: '700',
      }),
    );
    this.labels.add(
      this.add.text(width - 238, height - 82, `New participants ${format(this.snapshot.lastNewParticipants)}`, {
        color: '#f3d46b',
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        fontStyle: '700',
      }),
    );

    if (this.snapshot.lastNewParticipants > 0) {
      const particle = this.add.text(centerX - 28, height - 106, '+ cash', {
        color: '#f3d46b',
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        fontStyle: '700',
      });
      this.moneyParticles.push({ text: particle, life: 900 });
    }
  }

  drawBackground(width, height, risk) {
    const dangerAlpha = Math.min(0.45, risk * 0.5);
    this.graphics.fillStyle(0x111827, 1);
    this.graphics.fillRect(0, 0, width, height);
    this.graphics.fillStyle(0x2864c9, 0.1);
    this.graphics.fillRect(0, 0, width, height * 0.38);
    this.graphics.fillStyle(0xd63d2e, dangerAlpha);
    this.graphics.fillRect(0, height * 0.62, width, height * 0.38);

    this.graphics.lineStyle(1, 0xf4f1ea, 0.08);
    for (let x = 40; x < width; x += 80) {
      this.graphics.lineBetween(x, 70, x, height - 96);
    }
    for (let y = 92; y < height - 96; y += 54) {
      this.graphics.lineBetween(24, y, width - 24, y);
    }

    this.graphics.fillStyle(0xf4f1ea, 0.08);
    this.graphics.fillRoundedRect(24, 20, width - 48, 42, 6);
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

  return <div ref={containerRef} className="h-[440px] min-h-[360px] w-full overflow-hidden bg-[#0d1117] sm:h-[520px] lg:h-[620px]" />;
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
