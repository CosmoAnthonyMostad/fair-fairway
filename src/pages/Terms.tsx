import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 py-12">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 2026
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="border-none shadow-md">
          <CardContent className="prose prose-gray dark:prose-invert max-w-none py-8 space-y-8">
            
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using MyGolfApp ("the App"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the App. We reserve the right to modify 
                these terms at any time, and your continued use of the App constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                MyGolfApp is a mobile application designed to help golfers track matches, manage groups, 
                and record scores with friends. The App provides features including group creation, match 
                tracking, handicap calculations, and leaderboards.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                To use certain features of the App, you must create an account. You are responsible for 
                maintaining the confidentiality of your account credentials and for all activities that 
                occur under your account. You agree to provide accurate and complete information when 
                creating your account and to update this information as needed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. User Conduct</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You agree to use the App only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Use the App in any way that violates applicable laws or regulations</li>
                <li>Impersonate any person or entity, or falsely state your affiliation</li>
                <li>Interfere with or disrupt the App or servers connected to the App</li>
                <li>Attempt to gain unauthorized access to any part of the App</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Upload or transmit any malicious code or content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The App and its original content, features, and functionality are owned by MyGolfApp and 
                are protected by international copyright, trademark, and other intellectual property laws. 
                You may not copy, modify, distribute, or create derivative works based on the App without 
                our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. User Content</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of any content you submit to the App, including match data, scores, 
                and profile information. By submitting content, you grant us a non-exclusive, worldwide, 
                royalty-free license to use, store, and display your content solely for the purpose of 
                providing and improving the App's services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy, which explains how we 
                collect, use, and protect your personal information. By using the App, you consent to the 
                collection and use of information as described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Disclaimers</h2>
              <p className="text-muted-foreground leading-relaxed">
                The App is provided "as is" and "as available" without warranties of any kind, either 
                express or implied. We do not warrant that the App will be uninterrupted, error-free, 
                or free of harmful components. Handicap calculations are provided for recreational 
                purposes only and should not be used for official tournament play.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the fullest extent permitted by law, MyGolfApp shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages arising out of or related to 
                your use of the App. Our total liability shall not exceed the amount you paid us, if any, 
                for accessing the App.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the App at our sole discretion, 
                without prior notice, for conduct that we believe violates these Terms or is harmful to 
                other users, us, or third parties. You may also delete your account at any time by 
                contacting our support team.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the 
                United States, without regard to conflict of law principles. Any disputes arising 
                from these Terms or your use of the App shall be resolved in the appropriate courts.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-primary font-medium mt-2">
                support@mygolfapp.info
              </p>
            </section>

          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-muted-foreground border-t">
        <p>© {new Date().getFullYear()} MyGolfApp. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Terms;