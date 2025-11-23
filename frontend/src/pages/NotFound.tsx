import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Translations } from "@/translations/types";

interface NotFoundProps {
  t: Translations;
}

const NotFound = ({ t }: NotFoundProps) => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{t.notFound404}</h1>
        <p className="mb-4 text-xl text-gray-600">{t.notFoundPageNotFound}</p>
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          {t.notFoundReturnToHome}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
