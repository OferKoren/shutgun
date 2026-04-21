export default function FlowerEasterEgg() {
  const play = () => {
    const a = new Audio('/fart_sound.m4a');
    a.play().catch(() => {});
  };
  return (
    <button
      type="button"
      onClick={play}
      aria-label="🌸"
      className="fixed bottom-24 md:bottom-6 right-6 z-40 text-3xl origin-bottom animate-wind select-none hover:scale-110 transition-transform"
    >
      🌸
    </button>
  );
}
