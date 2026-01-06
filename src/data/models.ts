export interface Model {
  name: string;
  region: string;
  imageSrc: string;
}

export const models: Model[] = [
  {
    name: "Aurora",
    region: "Europe",
    imageSrc: "https://picsum.photos/seed/model1/800/1200",
  },
  {
    name: "Sakura",
    region: "Asia",
    imageSrc: "https://picsum.photos/seed/model2/800/1200",
  },
  {
    name: "Luna",
    region: "North America",
    imageSrc: "https://picsum.photos/seed/model3/800/1200",
  },
  {
    name: "Nova",
    region: "Australia",
    imageSrc: "https://picsum.photos/seed/model4/800/1200",
  },
  {
    name: "Stella",
    region: "South America",
    imageSrc: "https://picsum.photos/seed/model5/800/1200",
  },
];
