import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-sans">404 Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <Link href="/" className="w-full block">
          <Button size="lg" className="w-full gap-2 font-semibold">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
