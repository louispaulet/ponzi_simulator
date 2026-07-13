export const articles = [
  {
    id: 'ponzi-schemes',
    eyebrow: 'Learn the mechanics',
    title: 'How investment Ponzi schemes manufacture confidence',
    description: 'Why fabricated returns, selective withdrawals, and steady-looking statements can hide a growing cash deficit.',
    readTime: '6 min read',
    relatedCases: ['charles-ponzi', 'madoff', 'stanford'],
    relatedArticles: ['warning-signs', 'pyramid-schemes'],
    sections: [
      {
        title: 'The central mismatch',
        paragraphs: [
          'An investment Ponzi scheme claims that participant balances are growing through a legitimate strategy. In reality, the cash available to honor withdrawals comes largely or entirely from later deposits.',
          'The statement balance and the bank balance are therefore different things. A scheme can report enormous gains while holding only a fraction of the cash needed if participants ask to withdraw.',
        ],
      },
      {
        title: 'Why early withdrawals matter',
        paragraphs: [
          'Small, successful withdrawals are powerful marketing. They reassure existing investors and give them a story to repeat to friends, family, and professional networks.',
          'The scheme appears stable while most people leave supposed gains inside their accounts. It fails when withdrawals accelerate, deposits slow, or an investigation interrupts access to new money.',
        ],
      },
      {
        title: 'What the simulator tracks',
        paragraphs: [
          'The investment model keeps cash reserves, total deposits, withdrawals, operator diversion, unpaid liabilities, and fictitious account values separate. That separation is essential: none of those measures is interchangeable with verified victim loss.',
        ],
      },
    ],
  },
  {
    id: 'pyramid-schemes',
    eyebrow: 'Understand exponential growth',
    title: 'Why recruitment pyramids run out of people',
    description: 'The recruitment math behind the shape—and why most participants must land near the bottom.',
    readTime: '5 min read',
    relatedCases: ['zeek-rewards', 'forsage', 'burnlounge'],
    relatedArticles: ['mlm', 'warning-signs'],
    sections: [
      {
        title: 'Every level needs a larger level below it',
        paragraphs: [
          'If each participant must recruit several more people, the required population grows exponentially. Recruiting three people per participant requires 3 people at the first level, 9 at the second, 27 at the third, and 59,049 by the tenth.',
          'The available market is finite. Real recruitment also slows because social networks overlap, interest fades, and earlier participants have already approached the easiest prospects.',
        ],
      },
      {
        title: 'Money moves in the opposite direction',
        paragraphs: [
          'People grow downward through the recruitment tree while commissions and bonuses move upward. Participants near the top may receive enough from a wide downline to offset their costs; late entrants usually do not have enough people below them.',
        ],
      },
      {
        title: 'Products do not settle the question',
        paragraphs: [
          'A program can sell real products and still create pyramid incentives. The important questions are what activity actually drives rewards, whether retail demand comes from outside the network, and whether participants buy inventory mainly to qualify for compensation.',
        ],
      },
    ],
  },
  {
    id: 'mlm',
    eyebrow: 'Compare compensation plans',
    title: 'MLM, retail sales, and inventory loading',
    description: 'How to separate genuine customer demand from rewards that pressure a downline to buy and recruit.',
    readTime: '7 min read',
    relatedCases: ['burnlounge', 'zeek-rewards'],
    relatedArticles: ['pyramid-schemes', 'warning-signs'],
    sections: [
      {
        title: 'Where the revenue comes from',
        paragraphs: [
          'Multi-level marketing sells through a network of participants. A participant may earn from direct retail sales and may also receive commissions connected to a downline.',
          'The FTC emphasizes that a real product does not automatically make a compensation structure lawful. The design and real-world incentives of the plan matter.',
        ],
      },
      {
        title: 'Inventory loading',
        paragraphs: [
          'Inventory loading happens when participants buy products to remain eligible, reach a rank, or help an upline qualify—not because customers genuinely want the product. The purchases can create revenue for the company while leaving participants with unsold stock and recurring costs.',
        ],
      },
      {
        title: 'Ranks and qualification pressure',
        paragraphs: [
          'Bronze, silver, gold, or platinum labels often combine recruitment counts, team volume, and personal purchases. The simulator lets you model these rules because a small change in eligibility can redirect a large share of the available money toward a small group.',
        ],
      },
    ],
  },
  {
    id: 'warning-signs',
    eyebrow: 'Pause before paying',
    title: 'Warning signs in an investment or recruitment pitch',
    description: 'A practical checklist for promises that deserve more scrutiny.',
    readTime: '4 min read',
    relatedCases: ['charles-ponzi', 'madoff', 'stanford', 'zeek-rewards', 'forsage', 'burnlounge'],
    relatedArticles: ['ponzi-schemes', 'pyramid-schemes', 'mlm'],
    sections: [
      {
        title: 'Investment red flags',
        bullets: [
          'High or unusually consistent returns with little visible risk.',
          'A vague, secret, or needlessly complex explanation of the investment strategy.',
          'Account statements that cannot be verified with an independent custodian.',
          'Delays, excuses, or pressure to roll over money when you request a withdrawal.',
        ],
      },
      {
        title: 'Recruitment red flags',
        bullets: [
          'Earnings stories focus on building a team rather than selling to outside customers.',
          'Recurring purchases, training, or fees are needed to stay active or qualify for rewards.',
          'The typical participant outcome is missing while exceptional earners dominate the pitch.',
          'Rank advancement depends on recruiting several levels of participants.',
        ],
      },
      {
        title: 'Questions worth asking',
        bullets: [
          'What percentage of revenue comes from customers outside the participant network?',
          'What does the typical participant earn after every fee, purchase, refund, and expense?',
          'Who independently holds the money or verifies the claimed transactions?',
          'Can you leave, return inventory, and withdraw funds without recruiting or making another purchase?',
        ],
      },
    ],
  },
];

export function articleById(id) {
  return articles.find((article) => article.id === id) ?? null;
}
