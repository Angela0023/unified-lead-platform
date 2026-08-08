import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface QualityStatsProps {
  distribution: {
    score1: number;
    score2: number;
    score3: number;
    score4: number;
    score5: number;
    total: number;
  };
  warnings: string[];
}

export function QualityStats({ distribution, warnings }: QualityStatsProps) {
  const { score1, score2, score3, score4, score5, total } = distribution;
  const validated = score2 + score3 + score4 + score5;

  const scorePercentage = (count: number) =>
    total > 0 ? (count / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Score 5/5 (Perfect Fit)</span>
            <span className="text-muted-foreground">{score5}</span>
          </div>
          <Progress
            value={scorePercentage(score5)}
            className="h-2 [&>div]:bg-green-500"
          />

          <div className="flex items-center justify-between text-sm">
            <span>Score 4/5 (Good Fit)</span>
            <span className="text-muted-foreground">{score4}</span>
          </div>
          <Progress
            value={scorePercentage(score4)}
            className="h-2 [&>div]:bg-blue-500"
          />

          <div className="flex items-center justify-between text-sm">
            <span>Score 3/5 (Okay Fit)</span>
            <span className="text-muted-foreground">{score3}</span>
          </div>
          <Progress
            value={scorePercentage(score3)}
            className="h-2 [&>div]:bg-yellow-500"
          />

          <div className="flex items-center justify-between text-sm">
            <span>Score 2/5 (Potential Fit)</span>
            <span className="text-muted-foreground">{score2}</span>
          </div>
          <Progress
            value={scorePercentage(score2)}
            className="h-2 [&>div]:bg-orange-500"
          />

          <div className="flex items-center justify-between text-sm">
            <span>Score 1/5 (Rejected)</span>
            <span className="text-muted-foreground">{score1}</span>
          </div>
          <Progress
            value={scorePercentage(score1)}
            className="h-2 [&>div]:bg-red-500"
          />
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm font-medium">
            <span>Total Validated</span>
            <span>
              {validated} / {total}
            </span>
          </div>
        </div>

        {warnings.length > 0 && (
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Quality Notes</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {warnings.map((w, i) => (
                  <li key={i} className="text-sm">
                    {w}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
