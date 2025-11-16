import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Language } from "@/lib/translations";

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  mobile: boolean;
}

export const LanguageSwitcher = ({ currentLanguage, onLanguageChange, mobile = false }: LanguageSwitcherProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {mobile ? (
        <Button variant="outline" className="w-full justify-start gap-2">
          <Languages className="h-4 w-4" />
          Language
        </Button>
        ) : (
        <Button variant="outline" size="icon">
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
