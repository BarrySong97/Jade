// EDIT HERE: Section title and description
const SECTION_DATA = {
  title: "工作经历",
  description:
    "我是一名全栈工程师，专注于前端开发和用户体验设计，拥有多年的开发经验。",
} as const;

// EDIT HERE: Add/edit your work experience
const EXPERIENCES = [
  {
    title: "Mazo AI",
    description: "全栈工程师 · 远程 · 2024 - 至今",
  },
  {
    title: "Signerlabs",
    description: "全栈工程师 · 远程 · 2023 - 2024",
  },
  {
    title: "成都索贝数码科技股份有限公司",
    description: "前端工程师 · 成都 · 2021 - 2023",
  },
  {
    title: "成都深瑞同华科技有限公司",
    description: "前端工程师 · 成都 · 2020 - 2021",
  },
] as const;

export default async function ExperienceSection() {
  return (
    <section className="space-y-6 px-10 py-16">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">{SECTION_DATA.title}</h2>
        <p className="text-muted-foreground">{SECTION_DATA.description}</p>
      </div>

      <div className="space-y-6">
        {EXPERIENCES.map((exp, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-muted-foreground font-bold">·</span>
            <div>
              <span className="font-semibold">{exp.title}</span>
              <span className="ml-3 text-muted-foreground">
                {exp.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
