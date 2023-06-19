export function delayRandomly() {
  const delay = 500 + Math.random() * 1500;
  return new Promise((resolve) => setTimeout(resolve, delay));
}
