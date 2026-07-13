export const MAX_TREE_LEVELS = 10;

const MAX_NODES_PER_LEVEL = 5;

function groupCohorts(cohorts, maxLevels) {
  if (cohorts.length <= maxLevels) return cohorts.map((cohort) => [cohort]);

  const groupCount = maxLevels - 1;
  const remaining = cohorts.length - 1;
  return [
    [cohorts[0]],
    ...Array.from({ length: groupCount }, (_, index) => {
      const start = 1 + Math.floor((index * remaining) / groupCount);
      const end = 1 + Math.floor(((index + 1) * remaining) / groupCount);
      return cohorts.slice(start, end);
    }),
  ];
}

function splitPeople(total, nodeCount) {
  const base = Math.floor(total / nodeCount);
  const remainder = total % nodeCount;
  return Array.from({ length: nodeCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

function representativeNodeCount(people, maxNodes) {
  if (people <= 1) return 1;
  if (people < 10) return Math.min(2, people, maxNodes);
  if (people < 100) return Math.min(3, people, maxNodes);
  if (people < 1_000) return Math.min(4, people, maxNodes);
  return Math.min(5, people, maxNodes);
}

export function buildRecruitmentTree(snapshot, maxLevels = MAX_TREE_LEVELS, maxNodes = MAX_NODES_PER_LEVEL) {
  const cohortGroups = groupCohorts(snapshot.cohorts, maxLevels);
  return cohortGroups.map((group, levelIndex) => {
    const joined = group.reduce((sum, cohort) => sum + cohort.joined, 0);
    const active = group.reduce((sum, cohort) => sum + cohort.active, 0);
    const nodeCount = levelIndex === 0 ? 1 : representativeNodeCount(joined, maxNodes);
    const joinedByNode = splitPeople(joined, nodeCount);
    const activeByNode = splitPeople(active, nodeCount);
    return {
      id: `${group[0].period}-${group.at(-1).period}`,
      periodStart: group[0].period,
      periodEnd: group.at(-1).period,
      joined,
      active,
      collapsedCohorts: group.length,
      nodes: joinedByNode.map((people, nodeIndex) => ({
        id: `${group[0].period}-${group.at(-1).period}-${nodeIndex}`,
        people,
        active: activeByNode[nodeIndex],
      })),
    };
  });
}
