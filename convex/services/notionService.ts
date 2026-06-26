

export interface NotionPage {
  id: string;
  properties: Record<string, any>;
}

export interface NotionExercise {
  name: string;
  videoUrl?: string;
  instructions: string[];
  equipment: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  sets: string;
  reps: string;
  rest?: string;
  category: string;
}

export class NotionExerciseService {
  constructor(
    private accessToken: string,
    private databaseId: string,
    private trainer: { firstName: string; lastName: string }
  ) {}

  async fetchExercises(): Promise<NotionExercise[]> {
    const response = await fetch(`https://api.notion.com/v1/databases/${this.databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.results.map((page: NotionPage) => this.mapNotionPageToExercise(page));
  }

  private mapNotionPageToExercise(page: NotionPage): NotionExercise {
    const props = page.properties;

    return {
      name: this.getTitleText(props.Name),
      videoUrl: this.getUrlText(props.Video),
      instructions: this.getRichTextArray(props.Instructions),
      equipment: this.getMultiSelectArray(props.Equipment),
      primaryMuscles: this.getMultiSelectArray(props['Primary Muscles']),
      secondaryMuscles: this.getMultiSelectArray(props['Secondary Muscles']),
      difficulty: this.getSelectValue(props.Difficulty),
      sets: this.getNumberValue(props.Sets)?.toString() || '',
      reps: this.getNumberValue(props.Reps)?.toString() || '',
      rest: this.getNumberValue(props['Rest (seconds)'])?.toString(),
      category: this.getSelectValue(props.Category),
    };
  }

  private getTitleText(prop: any): string {
    if (!prop?.title?.[0]?.plain_text) return '';
    return prop.title[0].plain_text;
  }

  private getUrlText(prop: any): string | undefined {
    if (!prop?.url) return undefined;
    return prop.url;
  }

  private getRichTextArray(prop: any): string[] {
    if (!prop?.rich_text) return [];
    return prop.rich_text.map((r: any) => r.plain_text).filter((t: string) => t);
  }

  private getMultiSelectArray(prop: any): string[] {
    if (!prop?.multi_select) return [];
    return prop.multi_select.map((s: any) => s.name);
  }

  private getSelectValue(prop: any): any {
    if (!prop?.select?.name) return undefined;
    return prop.select.name;
  }

  private getNumberValue(prop: any): number | undefined {
    if (prop?.number === undefined || prop?.number === null) return undefined;
    return prop.number;
  }
}