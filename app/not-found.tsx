import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-6">
        <h1 className="text-[72px] font-bold text-gray-200 mb-2">404</h1>
        <p className="text-[18px] font-medium text-gray-900 mb-2">Seite nicht gefunden</p>
        <p className="text-[14px] text-gray-400 mb-8">Die angeforderte Seite existiert nicht.</p>
        <Link
          href="/"
          className="inline-flex items-center px-5 py-2.5 text-[14px] font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
          data-testid="link-back-home"
        >
          Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}
