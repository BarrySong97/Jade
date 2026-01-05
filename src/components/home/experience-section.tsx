import mazoAiLogo from "@/assets/experiences/mazo-ai.png";
import signerlabsLogo from "@/assets/experiences/signerlabs.png";
import sobeyLogo from "@/assets/experiences/sobey.png";
import shenruiLogo from "@/assets/experiences/shenrui.png";

// EDIT HERE: Section title and description
const SECTION_DATA = {
  title: "工作经历",
  description: `从 2020 到 ${new Date().getFullYear()} 年`,
} as const;

// EDIT HERE: Add/edit your work experience
const EXPERIENCES = [
  {
    title: "Mazo AI",
    description: "全栈工程师 · 远程 · 2024 - 至今",
    logo: mazoAiLogo,
  },
  {
    title: "Signerlabs",
    description: "全栈工程师 · 远程 · 2023 - 2024",
    logo: signerlabsLogo,
  },
  {
    title: "成都索贝数码科技股份有限公司",
    description: "前端工程师 · 成都 · 2021 - 2023",
    logo: sobeyLogo,
  },
  {
    title: "成都深瑞同华科技有限公司",
    description: "前端工程师 · 成都 · 2020 - 2021",
    logo: shenruiLogo,
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
          <div key={index} className="flex items-center gap-3">
            <img
              src={exp.logo.src}
              alt={`${exp.title} logo`}
              className="h-4 w-4 object-contain"
              loading="lazy"
            />
            <div>
              <span className="font-medium">{exp.title}</span>
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
