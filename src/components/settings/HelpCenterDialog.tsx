import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail, MessageCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface HelpCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const faqs = [
  {
    question: 'How do I create a match?',
    answer: 'Go to your group, tap "New Match", select a course, format, and date. After creating the match, you can set up teams and assign players.',
  },
  {
    question: 'What is GSI (Group Skill Index)?',
    answer: 'GSI is your handicap within a specific group. It starts at your Profile Handicap (PHI) but evolves independently based on your performance in that group.',
  },
  {
    question: 'How are team handicaps calculated?',
    answer: 'For Scramble: 35% low + 15% high handicap. For Best Ball: 80% low + 20% high. The handicaps are displayed relative to the best team (0 strokes).',
  },
  {
    question: 'Can I leave a group?',
    answer: 'Yes! Tap on the group, then use the menu (three dots) and select "Leave Group". You\'ll need to be invited again to rejoin.',
  },
  {
    question: 'How do I update my handicap?',
    answer: 'Go to Profile, tap "Edit Profile", and enter your Handicap Index (PHI). This will apply to new groups but won\'t change existing GSI values.',
  },
];

export const HelpCenterDialog = ({
  open,
  onOpenChange,
}: HelpCenterDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Help Center
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* FAQs */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">
              Frequently Asked Questions
            </h3>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact */}
          <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
            <h3 className="font-semibold text-foreground">Still need help?</h3>
            <p className="text-sm text-muted-foreground">
              Contact our support team and we'll get back to you within 24 hours.
            </p>
            <Button variant="outline" className="w-full gap-2">
              <Mail className="w-4 h-4" />
              support@mygolfapp.info
            </Button>
          </div>

          <Button
            className="w-full gradient-primary text-primary-foreground"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};