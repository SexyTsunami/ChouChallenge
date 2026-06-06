export default function VinylRecord({ spinning = true }: { spinning?: boolean }) {
  return (
    <div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40">
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-800 border-4 border-gray-700 shadow-2xl ${
          spinning ? "animate-spin-slow" : ""
        }`}
      >
        <div className="absolute inset-[30%] rounded-full bg-vinyl-accent/20 border-2 border-vinyl-accent/40" />
        <div className="absolute inset-[42%] rounded-full bg-black border border-gray-600" />
      </div>
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-16 h-3 bg-gray-600 rounded-sm rotate-12 origin-left shadow-lg" />
    </div>
  );
}
