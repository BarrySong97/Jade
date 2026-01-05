import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// EDIT HERE: Section title and description
const SECTION_DATA = {
  title: "技术栈",
  description: "我使用的技术和工具",
} as const;

// EDIT HERE: Add/edit your tech stack
const TECH_STACK = [
  {
    category: "前端",
    technologies: [
      "React / Next.js",
      "Vue 3 / Nuxt",
      "TypeScript",
      "Tailwind CSS",
      "Astro",
      "shadcn/ui",
      "Vite / Webpack",
    ],
  },
  {
    category: "后端",
    technologies: [
      "Node.js / Express",
      "Python / FastAPI",
      "PostgreSQL / MongoDB",
      "Redis",
      "GraphQL / REST API",
      "Docker / Kubernetes",
    ],
  },
  {
    category: "移动端",
    technologies: ["React Native", "Flutter", "Swift / SwiftUI", "Kotlin"],
  },
] as const;

export default function TechStackSection() {
  return (
    <section className="space-y-6 px-10 py-16">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">{SECTION_DATA.title}</h2>
        <p className="text-muted-foreground">{SECTION_DATA.description}</p>
      </div>

      <Accordion className="w-full border-none">
        {TECH_STACK.map((stack, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-base ">
              {stack.category}
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 pl-1">
                {stack.technologies.map((tech, techIndex) => (
                  <li
                    key={techIndex}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {tech}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
