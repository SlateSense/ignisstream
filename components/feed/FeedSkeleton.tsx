import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-secondary animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
                  <div className="h-3 w-32 bg-secondary rounded animate-pulse" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-3">
            <div className="px-6 mb-3 space-y-2">
              <div className="h-4 w-full bg-secondary rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-secondary rounded animate-pulse" />
            </div>
            <div className="aspect-video bg-secondary animate-pulse" />
          </CardContent>
          <CardFooter className="border-t pt-3">
            <div className="flex items-center gap-4">
              <div className="h-8 w-16 bg-secondary rounded animate-pulse" />
              <div className="h-8 w-16 bg-secondary rounded animate-pulse" />
              <div className="h-8 w-16 bg-secondary rounded animate-pulse" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
