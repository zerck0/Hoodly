export function LoadingScreen({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white">{message}</div>
    </div>
  );
}
