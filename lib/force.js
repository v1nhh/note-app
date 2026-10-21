// Een eenvoudige krachtsimulatie voor het web, zelf geschreven, zonder
// bibliotheek. Elke knoop is een deeltje:
//   - knopen duwen elkaar weg, zodat ze niet op elkaar liggen;
//   - een verbinding werkt als een veer, zodat verbonden knopen dicht bij
//     elkaar blijven;
//   - een zwakke kracht trekt alles naar het midden.
// Elke stap tellen we de krachten op en verplaatsen we de knopen. Wrijving
// remt af en alpha wordt steeds kleiner, zodat alles tot rust komt.
//
// Zelfde idee als d3-force, maar eenvoudiger. De afstoting rekent elk paar uit
// (n²); dat is snel genoeg voor een paar honderd knopen.

const REPULSION = 1500;
const SPRING = 0.07;
const SPRING_LENGTH = 70;
const GRAVITY = 0.012;
const FRICTION = 0.58;
const ALPHA_DECAY = 0.982;
const ALPHA_MIN = 0.004;
const MAX_TICKS = 400;

/// Startposities in een spiraal (zoals de pitten van een zonnebloem). Geen
/// toeval: hetzelfde web ziet er dan elke keer hetzelfde uit.
function seedPosition(index) {
  const radius = 12 * Math.sqrt(index + 0.5);
  const angle = index * Math.PI * (3 - Math.sqrt(5));
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
}

/// nodes: [{ id }], links: [{ source, target }] (ids). Rekent de simulatie in
/// één keer uit tot hij stilstaat, en geeft { id, x, y } per knoop terug.
export function layoutGraph(nodes, links) {
  const byId = new Map();
  const particles = nodes.map((node, index) => {
    const particle = { id: node.id, ...seedPosition(index), vx: 0, vy: 0 };
    byId.set(node.id, particle);
    return particle;
  });

  // Verbindingen naar knopen die er niet zijn, laten we weg.
  const springs = links
    .map((link) => ({ source: byId.get(link.source), target: byId.get(link.target) }))
    .filter((link) => link.source && link.target);

  let alpha = 1;

  for (let tick = 0; tick < MAX_TICKS && alpha > ALPHA_MIN; tick += 1) {
    // 1. Afstoting tussen elk paar knopen. Hoe dichterbij, hoe sterker:
    //    de kracht neemt af met het kwadraat van de afstand, zoals bij magneten.
    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j += 1) {
        const b = particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        // Nooit door nul delen, ook niet als twee knopen precies op elkaar liggen.
        const distanceSq = Math.max(dx * dx + dy * dy, 1);
        const distance = Math.sqrt(distanceSq);
        const force = (REPULSION * alpha) / distanceSq;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // 2. Veren (de wet van Hooke): verder dan de rustlengte trekt naar elkaar
    //    toe, dichterbij duwt weg. Hoe verder uitgerekt, hoe harder.
    for (const { source, target } of springs) {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const stretch = ((distance - SPRING_LENGTH) / distance) * SPRING * alpha;
      source.vx += dx * stretch;
      source.vy += dy * stretch;
      target.vx -= dx * stretch;
      target.vy -= dy * stretch;
    }

    // 3. Zwaartekracht naar het midden, 4. wrijving, 5. verplaatsen.
    for (const particle of particles) {
      particle.vx -= particle.x * GRAVITY * alpha;
      particle.vy -= particle.y * GRAVITY * alpha;
      particle.vx *= FRICTION;
      particle.vy *= FRICTION;
      particle.x += particle.vx;
      particle.y += particle.vy;
    }

    // Elke stap iets minder kracht: de simulatie "koelt af" tot rust.
    alpha *= ALPHA_DECAY;
  }

  // Afronden: kortere getallen in de HTML, en niemand ziet een tiende pixel.
  return particles.map(({ id, x, y }) => ({
    id,
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  }));
}