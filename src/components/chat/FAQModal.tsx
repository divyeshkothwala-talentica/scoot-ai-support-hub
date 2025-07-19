import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { FAQSection } from "./FAQSection";

export const FAQModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          FAQ
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Frequently Asked Questions</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <FAQSection onArticleSelect={(article) => {
            // Close modal when article is used
            setIsOpen(false);
          }} />
        </div>
      </DialogContent>
    </Dialog>
  );
};