import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md border-2 border-border shadow-xl">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          
          <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">Page Not Found</h1>
          <p className="mb-8 text-muted-foreground">
            We couldn't find the page you were looking for. It might have been moved or doesn't exist.
          </p>

          <Link href="/">
            <Button className="w-full" size="lg">
              Return to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
