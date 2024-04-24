const floorColors = [0x021827, 0x270202, 0x022724, 0x240227];

export function getRandomFloorColor() {
  const colorIndex = Math.floor(Math.random() * floorColors.length);
  return floorColors[colorIndex];
}
