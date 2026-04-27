import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Language, Translations } from "@/translations/types";

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  t: Translations;
  mobile?: boolean;
}

export const LanguageSwitcher = ({ currentLanguage, onLanguageChange, t, mobile = false }: LanguageSwitcherProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {mobile ? (
        <Button variant="outline" className="w-full justify-start gap-2" aria-label={t.selectLanguage}>
          <Languages className="h-4 w-4" />
          Language
        </Button>
        ) : (
        <Button variant="outline" size="icon" aria-label={t.selectLanguage}>
          <Languages className="h-4 w-4" />
        </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => onLanguageChange("en")}
          className={currentLanguage === "en" ? "bg-accent" : ""}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onLanguageChange("sv")}
          className={currentLanguage === "sv" ? "bg-accent" : ""}
        >
          Svenska
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
