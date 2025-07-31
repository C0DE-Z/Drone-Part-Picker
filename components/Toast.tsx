export default function Toast({
  message,
  type = 'info',
}: {
  message: string;
  type?: 'info' | 'success' | 'error';
}) {
  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-transform transform ${
        type === 'success'
          ? 'bg-green-100 text-green-800'
          : type === 'error'
          ? 'bg-red-100 text-red-800'
          : 'bg-blue-100 text-blue-800'
      }`}
    >
      {message}
    </div>
  );
}
