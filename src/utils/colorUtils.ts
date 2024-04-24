const darkBlue = 0x021827;
const lightBlue = 0x172a50;
const darkRed = 0x270202;
const darkerTeal = 0x133134;
const darkViolet = 0x240227;
const lightVelvet = 0x211423;
const lightGray = 0x1f1f1f;
const floorColors = [darkBlue, lightBlue, darkRed, darkerTeal, darkViolet, lightVelvet, lightGray];

export function getRandomFloorColor() {
  const colorIndex = Math.floor(Math.random() * floorColors.length);
  return floorColors[colorIndex];
}
