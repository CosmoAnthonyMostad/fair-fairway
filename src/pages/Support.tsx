import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, Trophy, Calculator, Shield, Mail, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Support = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Create Golf Groups",
      description: "Organize your regular golf buddies into groups and track matches together."
    },
    {
      icon: Trophy,
      title: "Track Matches",
      description: "Record match results, track winners, and see your group's leaderboard."
    },
    {
      icon: Calculator,
      title: "Handicap Support",
      description: "Built-in PHI (Playing Handicap Index) to keep matches fair and competitive."
    },
    {
      icon: Shield,
      title: "Private & Secure",
      description: "Your data is protected with enterprise-grade security and privacy controls."
    }
  ];

  const faqs = [
    {
      question: "How do I create a golf group?",
      answer: "After signing in, tap the '+' button on the Groups screen to create a new group. Give it a name and invite your friends by searching for their email address."
    },
    {
      question: "How does the handicap system work?",
      answer: "MyGolfApp uses a Playing Handicap Index (PHI) system. Each player sets their handicap in their profile, and the app automatically calculates strokes given for fair competition."
    },
    {
      question: "Can I be in multiple groups?",
      answer: "Yes! You can create or join as many groups as you like. Each group tracks its own matches and has its own leaderboard."
    },
    {
      question: "How do I add friends?",
      answer: "Go to your Profile tab and tap 'Find Friends'. Search by email address to send friend requests. Once accepted, you can easily add them to your groups."
    },
    {
      question: "What match formats are supported?",
      answer: "MyGolfApp supports individual stroke play, best ball (team), and scramble formats. Choose your format when creating a new match."
    },
    {
      question: "Is my data private?",
      answer: "Yes. Your profile and match data are only visible to your accepted friends and group members. We never share your information with third parties."
    },
    {
      question: "How do I delete my account?",
      answer: "Contact us at support@mygolfapp.com and we'll process your account deletion request. All your data will be permanently removed."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            MyGolfApp
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track your golf matches, compete with friends, and improve your game with group leaderboards and handicap tracking.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/onboarding')}
            className="gap-2"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border-none shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <Card className="border-none shadow-md">
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Contact Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Card className="border-none shadow-md bg-primary/5">
          <CardContent className="py-8 text-center">
            <Mail className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Need Help?</h2>
            <p className="text-muted-foreground mb-4">
              We're here to help! Contact our support team for any questions or issues.
            </p>
            <Button variant="outline" className="gap-2" asChild>
              <a href="mailto:support@mygolfapp.com">
                <Mail className="w-4 h-4" />
                support@mygolfapp.com
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-muted-foreground border-t">
        <p>© {new Date().getFullYear()} MyGolfApp. All rights reserved.</p>
        <p className="mt-2">
          Made with ❤️ for golfers everywhere
        </p>
      </footer>
    </div>
  );
};

export default Support;
